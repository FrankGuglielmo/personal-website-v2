// Run: node --test app/api/taboo/_lib/engine.test.mjs   (Node 22.18+, type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { GRACE_MS, GameError, addPlayer, applyAction, createRoom, tick, viewFor } from "./engine.ts";

const CARDS = Array.from({ length: 30 }, (_, id) => ({ id, word: `Word${id}`, taboo: ["a", "b", "c", "d", "e"] }));
const deck = { ids: () => CARDS.map((c) => c.id), get: (id) => CARDS[id] };

function setup(n = 4) {
  let now = 1_000_000;
  const room = createRoom("ABCD", { id: "p0", name: "Host", token: "t0" }, now);
  for (let i = 1; i < n; i++) addPlayer(room, { id: `p${i}`, name: `P${i}`, token: `t${i}` }, ++now);
  return { room, now };
}
const act = (room, who, op, args = {}, now = Date.now()) => applyAction(room, who, op, args, now, deck);

test("auto-balances teams and rotates clue-givers per team", () => {
  const { room, now } = setup(5);
  assert.deepEqual(room.players.map((p) => p.team), [0, 1, 0, 1, 0]);
  act(room, "p0", "start", {}, now);
  assert.equal(room.phase, "ready");
  const givers = [];
  let t = now;
  for (let i = 0; i < 6; i++) {
    givers.push(room.clueGiverId);
    act(room, room.clueGiverId, "beginTurn", {}, t);
    t += 61_000 + GRACE_MS;
    tick(room, t);
    act(room, "p0", "confirmReview", {}, t);
  }
  // Team A (p0,p2,p4) and team B (p1,p3) alternate; each rotates through its own members.
  assert.deepEqual(givers, ["p0", "p1", "p2", "p3", "p4", "p1"]);
});

test("guessers and spectators never receive the card; clue-giver and watchers do", () => {
  const { room, now } = setup(5);
  act(room, "p4", "setTeam", { team: null }, now);
  act(room, "p0", "start", {}, now);
  act(room, "p0", "beginTurn", {}, now);
  const cardId = room.turn.currentCardId;
  act(room, "p0", "correct", { cardId }, now + 1000);
  const v = (id) => viewFor(room, id, now + 2000, deck);
  assert.ok(v("p0").turn.card, "clue-giver sees card");
  assert.ok(v("p1").turn.card && v("p3").turn.card, "opposing team sees card");
  for (const id of ["p2", "p4"]) {
    const view = v(id);
    assert.equal(view.turn.card, null);
    assert.equal(view.turn.played[0].word, null);
    assert.ok(!JSON.stringify(view).includes("Word"), `${id} view leaks no card words`);
  }
});

test("scoring: correct +1, skip penalty, buzz -1 (only opponents or clue-giver), stale ids ignored", () => {
  const { room, now } = setup(4);
  act(room, "p0", "setSettings", { skipPenalty: 1 }, now);
  act(room, "p0", "start", {}, now);
  act(room, "p0", "beginTurn", {}, now);
  const cur = () => room.turn.currentCardId;
  act(room, "p0", "correct", { cardId: cur() }, now + 1);
  act(room, "p0", "correct", { cardId: cur() }, now + 2);
  act(room, "p0", "skip", { cardId: cur() }, now + 3);
  assert.throws(() => act(room, "p2", "buzz", { cardId: cur() }, now + 4), GameError, "teammate can't buzz");
  const id = cur();
  act(room, "p1", "buzz", { cardId: id }, now + 5);
  assert.throws(() => act(room, "p3", "buzz", { cardId: id }, now + 6), /stale/, "double buzz dropped");
  tick(room, now + 61_000 + GRACE_MS);
  act(room, "p0", "confirmReview", {}, now + 62_000);
  assert.deepEqual(room.scores, [0, 0], "2 correct, 1 skip at -1, 1 buzz at -1");
});

test("grace window accepts late taps, then turn moves to review", () => {
  const { room, now } = setup(4);
  act(room, "p0", "start", {}, now);
  act(room, "p0", "beginTurn", {}, now);
  const end = room.turn.endsAt;
  assert.equal(tick(room, end + GRACE_MS - 1), false);
  act(room, "p0", "correct", { cardId: room.turn.currentCardId }, end + 200);
  assert.equal(tick(room, end + GRACE_MS), true);
  assert.equal(room.phase, "review");
  assert.equal(room.turn.played.length, 1);
});

test("undo restores the previous card; review toggles fix disputes", () => {
  const { room, now } = setup(4);
  act(room, "p0", "start", {}, now);
  act(room, "p0", "beginTurn", {}, now);
  const first = room.turn.currentCardId;
  act(room, "p0", "skip", { cardId: first }, now + 1);
  const second = room.turn.currentCardId;
  act(room, "p0", "undo", {}, now + 2);
  assert.equal(room.turn.currentCardId, first);
  act(room, "p0", "correct", { cardId: first }, now + 3);
  assert.equal(room.turn.currentCardId, second, "undone card returns to the deck");
  tick(room, room.turn.endsAt + GRACE_MS);
  act(room, "p0", "toggleResult", { index: 0 }, now + 70_000);
  assert.equal(room.turn.played[0].result, "skip");
});

test("pause freezes remaining time", () => {
  const { room, now } = setup(4);
  act(room, "p0", "start", {}, now);
  act(room, "p0", "beginTurn", {}, now);
  act(room, "p0", "pause", {}, now + 10_000);
  assert.equal(room.turn.pausedRemainingMs, 50_000);
  assert.equal(tick(room, now + 500_000), false);
  act(room, "p0", "resume", {}, now + 500_000);
  assert.equal(room.turn.endsAt, now + 550_000);
});

test("win only checked after equal turns; ties continue", () => {
  const { room, now } = setup(4);
  act(room, "p0", "setSettings", { target: 1 }, now);
  act(room, "p0", "start", {}, now);
  const playTurn = (corrects, t) => {
    act(room, room.clueGiverId, "beginTurn", {}, t);
    for (let i = 0; i < corrects; i++) act(room, room.clueGiverId, "correct", { cardId: room.turn.currentCardId }, t + i + 1);
    tick(room, room.turn.endsAt + GRACE_MS);
    act(room, "p0", "confirmReview", {}, t + 100_000);
  };
  playTurn(1, now);
  assert.equal(room.phase, "ready", "team B still gets its turn");
  playTurn(1, now + 200_000);
  assert.equal(room.phase, "ready", "tie keeps going");
  playTurn(2, now + 400_000);
  playTurn(0, now + 600_000);
  assert.equal(room.phase, "over");
  assert.equal(room.winner, 0);
});

test("kicking the active clue-giver ends the turn; host leaving hands off host", () => {
  const { room, now } = setup(4);
  act(room, "p0", "start", {}, now);
  act(room, "p0", "beginTurn", {}, now);
  act(room, "p0", "leave", {}, now + 1);
  assert.equal(room.phase, "review");
  assert.equal(room.hostId, "p1");
});
