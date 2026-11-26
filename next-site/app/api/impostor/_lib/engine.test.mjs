// Run: node --test app/api/impostor/_lib/engine.test.mjs   (Node 22.18+, type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { GUESS_MS, GRACE_MS, GameError, VOTE_MS, addPlayer, applyAction, applyOnce, createRoom, maxImpostors, tick, viewFor } from "./engine.ts";
import { CATEGORIES } from "./packs.ts";

function setup(n = 6, settings = {}) {
  let now = 1_000_000;
  const room = createRoom("ABCD", { id: "p0", name: "Host", token: "t0" }, now, CATEGORIES);
  for (let i = 1; i < n; i++) addPlayer(room, { id: `p${i}`, name: `P${i}`, token: `t${i}` }, ++now);
  if (Object.keys(settings).length) act(room, "p0", "setSettings", { settings }, now);
  return { room, now };
}
const act = (room, who, op, args = {}, now = 2_000_000) => applyAction(room, who, op, args, now, CATEGORIES);
const innocents = (room) => room.round.participants.filter((id) => !room.round.impostors.includes(id));

function toVote(room, now) {
  act(room, "p0", "start", {}, now);
  act(room, "p0", "startDiscuss", {}, now);
  act(room, "p0", "callVote", {}, now);
}
function everyoneVotes(room, target, now) {
  for (const id of room.round.participants) {
    if (room.round.eliminated.includes(id) || room.phase !== "vote") continue;
    const t = id === target ? room.round.participants.find((x) => x !== id && !room.round.eliminated.includes(x)) : target;
    act(room, id, "vote", { target: t }, now++);
  }
}

test("pack content is big enough for 10 guess options", () => {
  for (const c of CATEGORIES) {
    assert.ok(c.words.length >= 10, c.id);
    assert.ok(c.places.length >= 10, c.id);
    for (const p of c.places) assert.ok(p.roles.length >= 5, p.name);
  }
});

test("impostor count follows the host stepper, capped below the innocents", () => {
  assert.equal(maxImpostors(3), 1);
  assert.equal(maxImpostors(7), 3);
  assert.equal(maxImpostors(8), 3);
  const { room, now } = setup(7, { impostors: 2 });
  act(room, "p0", "start", {}, now);
  assert.equal(room.round.impostors.length, 2);
  const { room: r2, now: n2 } = setup(4, { impostors: 3 });
  act(r2, "p0", "start", {}, n2);
  assert.equal(r2.round.impostors.length, 1);
});

test("views: impostor sees only the category; innocents see secret and role", () => {
  const { room, now } = setup(6);
  act(room, "p0", "start", {}, now);
  const imp = room.round.impostors[0];
  const iv = viewFor(room, imp, now, CATEGORIES);
  assert.equal(iv.card.kind, "impostor");
  assert.equal(iv.card.category, room.round.categoryName);
  assert.ok(!JSON.stringify(iv).includes(room.round.secret), "impostor view leaks the secret");
  assert.equal(iv.guess, null);
  const inn = innocents(room)[0];
  const nv = viewFor(room, inn, now, CATEGORIES);
  assert.equal(nv.card.kind, "innocent");
  assert.equal(nv.card.secret, room.round.secret);
  assert.ok(nv.card.role);
  assert.equal(nv.result, null);
  assert.ok(!JSON.stringify(nv).includes(`"impostor"`), "innocent view hints at the impostor");
});

test("word mode: clue order starts with an innocent and advances", () => {
  const { room, now } = setup(5, { mode: "word" });
  act(room, "p0", "start", {}, now);
  act(room, "p0", "startDiscuss", {}, now);
  const r = room.round;
  assert.ok(!r.impostors.includes(r.clueOrder[0]));
  act(room, r.clueOrder[0], "clueDone", { who: r.clueOrder[0] }, now);
  assert.equal(r.clueIndex, 1);
  assert.throws(() => act(room, r.clueOrder[3] === "p0" ? r.clueOrder[2] : r.clueOrder[3], "clueDone", { who: r.clueOrder[1] }, now), GameError);
});

test("reveal advances when everyone is ready", () => {
  const { room, now } = setup(4);
  act(room, "p0", "start", {}, now);
  for (const p of room.players) act(room, p.id, "ready", {}, now);
  assert.equal(room.phase, "discuss");
});

test("catching the impostor goes to the last-chance guess; wrong guess scores innocents", () => {
  const { room, now } = setup(6);
  toVote(room, now);
  const imp = room.round.impostors[0];
  everyoneVotes(room, imp, now);
  assert.equal(room.phase, "guess");
  const opts = viewFor(room, imp, now, CATEGORIES).guess.options;
  assert.equal(opts.length, 10);
  assert.ok(opts.includes(room.round.secret));
  act(room, imp, "guess", { pick: opts.find((o) => o !== room.round.secret) }, now);
  assert.equal(room.result.outcome, "innocents");
  for (const id of innocents(room)) assert.ok(room.players.find((p) => p.id === id).score >= 1);
  assert.equal(room.players.find((p) => p.id === imp).score, 0);
  const first = room.result.firstVoterId;
  assert.equal(room.players.find((p) => p.id === first).score, 2);
});

test("correct last-chance guess steals the round for +3", () => {
  const { room, now } = setup(6);
  toVote(room, now);
  const imp = room.round.impostors[0];
  everyoneVotes(room, imp, now);
  act(room, imp, "guess", { pick: room.round.secret }, now);
  assert.equal(room.result.outcome, "impostors");
  assert.equal(room.players.find((p) => p.id === imp).score, 3);
});

test("voting out an innocent: impostors win +2", () => {
  const { room, now } = setup(6);
  toVote(room, now);
  const imp = room.round.impostors[0];
  everyoneVotes(room, innocents(room)[0], now);
  assert.equal(room.phase, "results");
  assert.equal(room.result.outcome, "impostors");
  assert.equal(room.players.find((p) => p.id === imp).score, 2);
});

test("tie triggers one re-vote among the tied; still tied means impostors win", () => {
  const { room, now } = setup(4);
  toVote(room, now);
  const [a, b, c, d] = room.round.participants;
  act(room, a, "vote", { target: b }, now);
  act(room, b, "vote", { target: a }, now);
  act(room, c, "vote", { target: a }, now);
  act(room, d, "vote", { target: b }, now);
  assert.equal(room.phase, "vote");
  assert.equal(room.round.vote.revote, true);
  assert.deepEqual([...room.round.vote.candidates].sort(), [a, b].sort());
  act(room, a, "vote", { target: b }, now);
  act(room, b, "vote", { target: a }, now);
  act(room, c, "vote", { target: a }, now);
  act(room, d, "vote", { target: b }, now);
  assert.equal(room.phase, "results");
  assert.equal(room.result.outcome, "impostors");
});

test("vote and guess timers resolve lazily on tick", () => {
  const { room, now } = setup(5);
  toVote(room, now);
  const imp = room.round.impostors[0];
  for (const id of room.round.participants) if (id !== imp) act(room, id, "vote", { target: imp }, now);
  assert.equal(room.phase, "vote");
  tick(room, now + VOTE_MS + GRACE_MS);
  assert.equal(room.phase, "guess");
  tick(room, now + VOTE_MS + GUESS_MS + 2 * GRACE_MS);
  assert.equal(room.result.outcome, "innocents");
});

test("multi-vote with 2 impostors: an innocent out means another discussion", () => {
  const { room, now } = setup(8, { impostors: 2, multiVote: true });
  toVote(room, now);
  const out = innocents(room)[0];
  everyoneVotes(room, out, now);
  assert.equal(room.phase, "discuss");
  assert.equal(room.round.lastEliminated, out);
  act(room, "p0", "callVote", {}, now);
  assert.ok(!room.round.vote.candidates.includes(out));
  assert.throws(() => act(room, out, "vote", { target: room.round.impostors[0] }, now), GameError);
});

test("spyfall 'I know it!' lets the impostor guess early", () => {
  const { room, now } = setup(5);
  act(room, "p0", "start", {}, now);
  act(room, "p0", "startDiscuss", {}, now);
  const imp = room.round.impostors[0];
  assert.throws(() => act(room, innocents(room)[0], "knowIt", {}, now), GameError);
  act(room, imp, "knowIt", {}, now);
  assert.equal(room.phase, "guess");
  act(room, imp, "guess", { pick: room.round.secret }, now);
  assert.equal(room.result.outcome, "impostors");
});

test("rounds: no repeated secrets, no back-to-back impostor, game ends after N rounds", () => {
  const { room, now } = setup(6, { rounds: 3 });
  act(room, "p0", "start", {}, now);
  const secrets = new Set();
  let last = [];
  for (let i = 0; i < 3; i++) {
    assert.ok(!secrets.has(room.round.secret));
    secrets.add(room.round.secret);
    for (const id of room.round.impostors) assert.ok(!last.includes(id));
    last = room.round.impostors;
    act(room, "p0", "startDiscuss", {}, now);
    act(room, "p0", "callVote", {}, now);
    everyoneVotes(room, innocents(room)[0], now);
    assert.equal(room.phase, "results");
    act(room, "p0", "nextRound", {}, now);
  }
  assert.equal(room.phase, "over");
});

test("late joiners spectate; an impostor leaving cancels the round", () => {
  const { room, now } = setup(5);
  act(room, "p0", "start", {}, now);
  addPlayer(room, { id: "late", name: "Late", token: "tl" }, now);
  assert.equal(viewFor(room, "late", now, CATEGORIES).card.kind, "spectator");
  act(room, room.round.impostors[0], "leave", {}, now);
  assert.equal(room.phase, "results");
  assert.equal(room.result.outcome, "cancelled");
  act(room, room.hostId, "nextRound", {}, now);
  assert.ok(room.round.participants.includes("late"));
});

test("only the host changes settings; host can be claimed when away", () => {
  const { room, now } = setup(4);
  assert.throws(() => act(room, "p1", "setSettings", { settings: { impostors: 2 } }, now), GameError);
  assert.throws(() => act(room, "p1", "claimHost", {}, now + 1000), GameError);
  const seen = { p0: now + 50_000 };
  assert.throws(() => applyAction(room, "p1", "claimHost", {}, now + 60_000, CATEGORIES, seen), GameError);
  assert.equal(viewFor(room, "p1", now + 60_000, CATEGORIES, seen).players[0].online, true);
  act(room, "p1", "claimHost", {}, now + 60_000);
  assert.equal(room.hostId, "p1");
});

test("timers are derived from due times, so every instance computes the same room", () => {
  const { room, now } = setup(5, { discussSec: 180 });
  act(room, "p0", "start", {}, now);
  act(room, "p0", "startDiscuss", {}, now);
  const a = structuredClone(room);
  const b = structuredClone(room);
  assert.equal(tick(a, now + 180_000 + GRACE_MS + 10), true);
  assert.equal(tick(b, now + 180_000 + GRACE_MS + 4_321), true);
  assert.deepEqual(a, b);
  assert.equal(a.phase, "vote");
  // Several due transitions in one read: vote ends with no ballots, round over.
  const c = structuredClone(room);
  tick(c, now + 180_000 + VOTE_MS + 2 * GRACE_MS + 1);
  assert.equal(c.phase, "results");
  assert.equal(tick(c, now + 999_999_999), false);
});

test("a resent action applies once, and an action lost to a stale write heals on resend", () => {
  const { room, now } = setup(5);
  toVote(room, now);
  const [imp] = room.round.impostors;
  const [x, y] = innocents(room);
  const stale = structuredClone(room);
  // x's vote lands, then y's vote is computed from a stale copy and overwrites it.
  assert.equal(applyOnce(room, x, "ax", "vote", { target: imp }, now, CATEGORIES), true);
  assert.deepEqual(viewFor(room, x, now, CATEGORIES).acks, ["ax"]);
  assert.equal(applyOnce(stale, y, "ay", "vote", { target: imp }, now, CATEGORIES), true);
  let latest = stale;
  assert.deepEqual(viewFor(latest, x, now, CATEGORIES).acks, [], "x sees its action missing");
  assert.equal(applyOnce(latest, x, "ax", "vote", { target: imp }, now + 3000, CATEGORIES), true);
  assert.equal(applyOnce(latest, y, "ay", "vote", { target: imp }, now + 3000, CATEGORIES), false, "dedupe");
  assert.equal(viewFor(latest, x, now, CATEGORIES).vote.votedCount, 2);
});

test("kicked players are remembered", () => {
  const { room, now } = setup(4);
  act(room, "p0", "kick", { target: "p2" }, now);
  assert.deepEqual(room.kicked, ["p2"]);
  assert.ok(!room.players.some((p) => p.id === "p2"));
});
