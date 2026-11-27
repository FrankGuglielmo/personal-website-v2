// Run: node --test app/api/impostor/_lib/merge.test.mjs   (Node 22.18+, type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { addPlayer, applyAction, createRoom, settle } from "./engine.ts";
import { covers, mergeRooms, stampChanges } from "./merge.ts";
import { CATEGORIES } from "./packs.ts";

function base(n = 1) {
  const now = 1_000_000;
  const room = createRoom("ABCD", { id: "p0", name: "Host", token: "t0" }, now, CATEGORIES);
  room.gameAt = now;
  room.removed = [];
  for (const p of room.players) p.seatAt = now;
  let r = room;
  for (let i = 1; i < n; i++) r = step(r, now + i, join(`p${i}`, `P${i}`));
  return r;
}

/** Applies `fn` the way the route does: clone, settle, mutate, stamp, bump version. */
function step(room, now, fn) {
  const next = structuredClone(room);
  settle(next, now);
  fn(next);
  stampChanges(room, next, now);
  next.version = room.version + 1;
  next.updatedAt = now;
  return next;
}

const join = (id, name) => (r) => addPlayer(r, { id, name, token: `t${id}` }, r.updatedAt + 1);
const act = (who, op, args, now) => (r) => applyAction(r, who, op, args, now, CATEGORIES);

test("two joins that raced from the same copy both survive the merge", () => {
  const r0 = base();
  const a = step(r0, 1_000_100, join("a", "Ann"));
  const b = step(r0, 1_000_101, join("b", "Ben"));
  const m = mergeRooms([a, b]);
  assert.deepEqual(m.players.map((p) => p.id).sort(), ["a", "b", "p0"]);
  assert.equal(covers(b, m), false, "the shared copy is missing Ann, so it gets written back");
  assert.equal(covers(m, mergeRooms([m, a, b])), true);
});

test("ready taps from stale copies combine, and the last one starts the discussion", () => {
  let r = base(4);
  r = step(r, 1_100_000, act("p0", "start", {}, 1_100_000));
  // Every phone taps ready on the same (stale) copy, so each write holds one tap.
  const copies = ["p0", "p1", "p2", "p3"].map((id, i) => step(r, 1_101_000 + i, act(id, "ready", {}, 1_101_000 + i)));
  const m = structuredClone(mergeRooms(copies));
  settle(m, 1_102_000);
  assert.equal(m.phase, "discuss");
});

test("concurrent ballots are all counted", () => {
  let r = base(5);
  r = step(r, 1_100_000, act("p0", "start", {}, 1_100_000));
  r = step(r, 1_100_001, act("p0", "startDiscuss", {}, 1_100_001));
  r = step(r, 1_100_002, act("p0", "callVote", {}, 1_100_002));
  const target = r.round.impostors[0];
  const voters = r.round.participants.filter((id) => id !== target).slice(0, 2);
  const copies = voters.map((id, i) => step(r, 1_101_000 + i, act(id, "vote", { target }, 1_101_000 + i)));
  const m = mergeRooms(copies);
  assert.deepEqual(Object.keys(m.round.vote.ballots).sort(), [...voters].sort());
});

test("a kick sticks even if an older copy still lists the player", () => {
  const r0 = base(4);
  const kicked = step(r0, 1_100_000, act("p0", "kick", { target: "p2" }, 1_100_000));
  const m = mergeRooms([kicked, r0]);
  assert.ok(!m.players.some((p) => p.id === "p2"));
  assert.ok(m.removed.includes("p2"));
});

test("game state follows the newest copy; scores move with it", () => {
  let r = base(4);
  r = step(r, 1_100_000, act("p0", "start", {}, 1_100_000));
  const later = step(r, 1_100_001, act("p0", "endGame", {}, 1_100_001));
  const m = mergeRooms([later, r]);
  assert.equal(m.phase, "over");
  const reset = step(later, 1_100_002, act("p0", "newGame", {}, 1_100_002));
  assert.equal(mergeRooms([r, reset, later]).phase, "lobby");
});
