// Run: node --test app/api/taboo/_lib/merge.test.mjs   (Node 22.18+, type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { addPlayer, applyAction, createRoom, normalizeRoom, repairRoom } from "./engine.ts";
import { covers, mergeRooms as rawMerge, stampChanges } from "./merge.ts";

const mergeRooms = (rooms) => rawMerge(rooms, (r) => repairRoom(normalizeRoom(r)));

const CARDS = Array.from({ length: 30 }, (_, id) => ({ id, word: `Word${id}`, taboo: ["a", "b", "c", "d", "e"] }));
const deck = { ids: () => CARDS.map((c) => c.id), get: (id) => CARDS[id] };

function base() {
  const now = 1_000_000;
  const room = createRoom("ABCD", { id: "h", name: "Host", token: "th" }, now);
  room.gameAt = now;
  room.removed = [];
  for (const p of room.players) p.seatAt = now;
  return room;
}

/** Applies `fn` the way the route does: clone, mutate, stamp, bump version. */
function step(room, now, fn) {
  const next = structuredClone(room);
  fn(next, now);
  stampChanges(room, next, now);
  next.version = room.version + 1;
  next.updatedAt = now;
  return next;
}

const join = (id) => (r, now) => addPlayer(r, { id, name: id.toUpperCase(), token: `t${id}` }, now);
const act = (who, op, args = {}) => (r, now) => applyAction(r, who, op, args, now, deck);
const ids = (r) => r.players.map((p) => p.id).sort();

test("parallel joins that raced from the same copy all survive the merge", () => {
  const r0 = base();
  const copies = ["a", "b", "c", "d"].map((id, i) => step(r0, 1_000_100 + i, join(id)));
  const m = mergeRooms([r0, ...copies]);
  assert.deepEqual(ids(m), ["a", "b", "c", "d", "h"]);
});

test("a team switch dropped by a stale write comes back from the player's snapshot", () => {
  const r0 = step(base(), 1_000_100, join("a"));
  assert.equal(r0.players.find((p) => p.id === "a").team, 1);
  const mine = step(r0, 1_000_200, act("a", "setTeam", { team: 0 }));
  const other = step(r0, 1_000_300, join("b"));
  const m = mergeRooms([other, mine]);
  assert.equal(m.players.find((p) => p.id === "a").team, 0);
  assert.ok(m.players.some((p) => p.id === "b"));
});

test("a kicked player stays out even when an older copy still lists them", () => {
  const r0 = step(base(), 1_000_100, join("a"));
  const kicked = step(r0, 1_000_200, act("h", "kick", { playerId: "a" }));
  const m = mergeRooms([r0, kicked]);
  assert.ok(!m.players.some((p) => p.id === "a"));
  assert.ok(m.removed.includes("a"));
  const later = mergeRooms([step(r0, 1_000_300, join("b")), m]);
  assert.ok(!later.players.some((p) => p.id === "a"));
});

test("a Correct tap isn't undone by a newer-numbered copy with older game state", () => {
  let r = base();
  for (const [i, id] of ["a", "b", "c"].entries()) r = step(r, 1_000_100 + i, join(id));
  r = step(r, 1_000_200, act("h", "start"));
  r = step(r, 1_000_201, act("h", "beginTurn"));
  const giver = step(r, 1_000_300, act("h", "correct", { cardId: r.turn.currentCardId }));
  let phone = step(r, 1_000_301, join("x"));
  phone = step(phone, 1_000_302, join("y"));
  assert.ok(phone.version > giver.version);
  const m = mergeRooms([phone, giver]);
  assert.deepEqual(m.turn.played.map((p) => p.result), ["correct"]);
  assert.ok(m.players.some((p) => p.id === "x"));
  assert.ok(m.version >= phone.version);
});

test("a merge never leaves a player on a team that no longer exists, or a missing host", () => {
  let r0 = step(base(), 1_000_100, act("h", "setSettings", { teamCount: 3 }));
  r0 = step(r0, 1_000_101, join("a"));
  const onC = step(r0, 1_000_200, act("a", "setTeam", { team: 2 }));
  const shrunk = step(r0, 1_000_100 + 150, act("h", "setSettings", { teamCount: 2 }));
  const fewer = step(shrunk, 1_000_300, act("h", "transferHost", { playerId: "a" }));
  const left = step(fewer, 1_000_400, act("a", "leave"));
  const m = mergeRooms([onC, left]);
  assert.equal(m.settings.teamCount, 2);
  assert.ok(m.players.every((p) => p.team === null || p.team < 2));
  assert.ok(m.players.some((p) => p.id === m.hostId));
});

test("covers() says no write is needed only when the stored copy has everything", () => {
  const r0 = step(base(), 1_000_100, join("a"));
  assert.equal(covers(r0, mergeRooms([r0])), true);
  const r1 = step(r0, 1_000_200, join("b"));
  assert.equal(covers(r0, mergeRooms([r0, r1])), false);
  assert.equal(covers(null, r0), false);
});
