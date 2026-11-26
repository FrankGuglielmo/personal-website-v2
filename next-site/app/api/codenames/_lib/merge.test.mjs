// Run: node --test app/api/codenames/_lib/merge.test.mjs   (Node 22.18+, type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { addPlayer, applyAction, createRoom } from "./engine.ts";
import { covers, mergeRooms, stampChanges } from "./merge.ts";

const WORDS = Array.from({ length: 60 }, (_, i) => `Word${i}`);
const words = () => WORDS;

function base() {
  const now = 1_000_000;
  const room = createRoom("ABCD", { id: "tv", token: "ttv" }, now);
  room.gameAt = now;
  room.removed = [];
  for (const p of room.players) p.seatAt = now;
  return room;
}

/** Applies `fn` the way the route does: clone, mutate, stamp, bump version. */
function step(room, now, fn) {
  const next = structuredClone(room);
  fn(next);
  stampChanges(room, next, now);
  next.version = room.version + 1;
  next.updatedAt = now;
  return next;
}

const join = (id, name) => (r) => addPlayer(r, { id, name, token: `t${id}` }, r.updatedAt + 1);
const act = (who, op, args, now) => (r) => applyAction(r, who, op, args, now, words);

test("two joins that raced from the same copy both survive the merge", () => {
  const r0 = base();
  const a = step(r0, 1_000_100, join("a", "Ann"));
  const b = step(r0, 1_000_101, join("b", "Ben"));
  const m = mergeRooms([a, b]);
  assert.deepEqual(m.players.map((p) => p.id).sort(), ["a", "b", "tv"]);
});

test("a seat change dropped by a stale write comes back from the player's snapshot", () => {
  const r0 = step(base(), 1_000_100, join("a", "Ann"));
  const mine = step(r0, 1_000_200, act("a", "setPlayer", { team: "red", role: "spymaster" }, 1_000_200));
  const other = step(r0, 1_000_300, join("b", "Ben"));
  const m = mergeRooms([other, mine]);
  const ann = m.players.find((p) => p.id === "a");
  assert.equal(ann.team, "red");
  assert.equal(ann.role, "spymaster");
  assert.ok(m.players.some((p) => p.id === "b"));
});

test("a kicked player stays out even when their own old snapshot still lists them", () => {
  const r0 = step(base(), 1_000_100, join("a", "Ann"));
  const kicked = step(r0, 1_000_200, act("tv", "kick", { playerId: "a" }, 1_000_200));
  const m = mergeRooms([r0, kicked]);
  assert.ok(!m.players.some((p) => p.id === "a"));
  assert.ok(m.removed.includes("a"));
  const later = mergeRooms([step(r0, 1_000_300, join("b", "Ben")), m]);
  assert.ok(!later.players.some((p) => p.id === "a"));
});

test("a reveal from the board isn't undone by a newer-numbered copy with older game state", () => {
  let r = base();
  r = step(r, 1_000_100, join("bs", "bs"));
  r = step(r, 1_000_101, join("rs", "rs"));
  r = step(r, 1_000_102, act("bs", "setPlayer", { team: "blue", role: "spymaster" }, 1_000_102));
  r = step(r, 1_000_103, act("rs", "setPlayer", { team: "red", role: "spymaster" }, 1_000_103));
  r = step(r, 1_000_104, act("tv", "start", {}, 1_000_104));
  const board = step(r, 1_000_200, act("tv", "reveal", { index: r.key.indexOf(r.turn) }, 1_000_200));
  let phone = step(r, 1_000_201, join("x", "Xan"));
  phone = step(phone, 1_000_202, act("x", "setPlayer", { team: "blue", role: "operative" }, 1_000_202));
  assert.ok(phone.version > board.version);
  const m = mergeRooms([phone, board]);
  assert.equal(m.revealed.filter(Boolean).length, 1);
  assert.ok(m.players.some((p) => p.id === "x"));
  assert.ok(m.version >= phone.version);
});

test("a merge never leaves two spymasters on one team", () => {
  const r0 = step(step(base(), 1_000_100, join("a", "Ann")), 1_000_101, join("b", "Ben"));
  const a = step(r0, 1_000_200, act("a", "setPlayer", { team: "blue", role: "spymaster" }, 1_000_200));
  const b = step(r0, 1_000_300, act("b", "setPlayer", { team: "blue", role: "spymaster" }, 1_000_300));
  const m = mergeRooms([a, b]);
  const spies = m.players.filter((p) => p.team === "blue" && p.role === "spymaster");
  assert.deepEqual(spies.map((p) => p.id), ["b"]);
});

test("covers() says no write is needed only when the stored copy has everything", () => {
  const r0 = step(base(), 1_000_100, join("a", "Ann"));
  assert.equal(covers(r0, mergeRooms([r0])), true);
  const r1 = step(r0, 1_000_200, join("b", "Ben"));
  assert.equal(covers(r0, mergeRooms([r0, r1])), false);
  assert.equal(covers(null, r0), false);
});
