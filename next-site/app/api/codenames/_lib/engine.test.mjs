// Run: node --test app/api/codenames/_lib/engine.test.mjs   (Node 22.18+, type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { BOARD_AWAY_MS, GameError, addPlayer, applyAction, createRoom, remaining, viewFor } from "./engine.ts";

const WORDS = Array.from({ length: 60 }, (_, i) => `Word${i}`);
const words = () => WORDS;

function setup() {
  let now = 1_000_000;
  const room = createRoom("ABCD", { id: "tv", token: "ttv" }, now);
  const ids = ["bs", "bo", "rs", "ro"];
  for (const id of ids) addPlayer(room, { id, name: id, token: `t${id}` }, ++now);
  const act = (who, op, args = {}, t = now) => applyAction(room, who, op, args, t, words);
  act("bs", "setPlayer", { team: "blue", role: "spymaster" });
  act("bo", "setPlayer", { team: "blue", role: "operative" });
  act("rs", "setPlayer", { team: "red", role: "spymaster" });
  act("ro", "setPlayer", { team: "red", role: "operative" });
  return { room, now, act };
}

const indexOf = (room, color, skip = []) => room.key.findIndex((c, i) => c === color && !room.revealed[i] && !skip.includes(i));

test("deals 9/8/7/1 with the starting team holding nine", () => {
  const { room, act } = setup();
  act("tv", "start");
  assert.equal(room.phase, "playing");
  assert.equal(room.words.length, 25);
  assert.equal(new Set(room.words).size, 25);
  const count = (c) => room.key.filter((k) => k === c).length;
  const start = room.startingTeam;
  const second = start === "blue" ? "red" : "blue";
  assert.equal(count(start), 9);
  assert.equal(count(second), 8);
  assert.equal(count("neutral"), 7);
  assert.equal(count("assassin"), 1);
  assert.equal(room.turn, start);
});

test("start needs a spymaster on each team, and only the board can start", () => {
  const { act } = setup();
  assert.throws(() => act("bo", "start"), GameError);
  act("rs", "setPlayer", { team: "red", role: "operative" });
  assert.throws(() => act("tv", "start"), /Red needs a spymaster/);
});

test("only spymasters see the key; board and operatives don't", () => {
  const { room, now, act } = setup();
  act("tv", "start");
  const hidden = (v) => v.cards.filter((c) => !c.revealed).every((c) => c.color === null);
  assert.ok(hidden(viewFor(room, "tv", now)));
  assert.ok(hidden(viewFor(room, "bo", now)));
  assert.ok(viewFor(room, "bs", now).cards.every((c) => c.color !== null));
  assert.ok(viewFor(room, "rs", now).cards.every((c) => c.color !== null));
  act("tv", "reveal", { index: indexOf(room, "neutral") });
  const tvCards = viewFor(room, "tv", now).cards;
  assert.equal(tvCards.filter((c) => c.color !== null).length, 1);
});

test("own agent keeps the turn; bystander or opponent passes it", () => {
  const { room, act } = setup();
  act("tv", "start");
  const team = room.turn;
  const opp = team === "blue" ? "red" : "blue";
  act("tv", "reveal", { index: indexOf(room, team) });
  assert.equal(room.turn, team);
  act("tv", "reveal", { index: indexOf(room, "neutral") });
  assert.equal(room.turn, opp);
  act("tv", "reveal", { index: indexOf(room, team) });
  assert.equal(room.turn, team);
  act("tv", "endTurn");
  assert.equal(room.turn, opp);
});

test("only the board reveals; operatives and spymasters can't", () => {
  const { act } = setup();
  act("tv", "start");
  assert.throws(() => act("bo", "reveal", { index: 0 }), /Only the TV board/);
  assert.throws(() => act("bs", "select", { index: 0 }), /Only the TV board/);
});

test("assassin loses instantly and undo restores it", () => {
  const { room, act } = setup();
  act("tv", "start");
  const team = room.turn;
  act("tv", "reveal", { index: indexOf(room, "assassin") });
  assert.equal(room.phase, "over");
  assert.equal(room.endReason, "assassin");
  assert.equal(room.winner, team === "blue" ? "red" : "blue");
  act("tv", "undo");
  assert.equal(room.phase, "playing");
  assert.equal(room.winner, null);
  assert.equal(room.turn, team);
  assert.equal(room.revealed.filter(Boolean).length, 0);
});

test("revealing the last agent wins, even when the other team flips it", () => {
  const { room, act } = setup();
  act("tv", "start");
  const team = room.turn;
  const opp = team === "blue" ? "red" : "blue";
  act("tv", "endTurn");
  for (let i = 0; i < 7; i++) {
    room.revealed[indexOf(room, team)] = true;
  }
  assert.equal(remaining(room)[team], 2);
  act("tv", "reveal", { index: indexOf(room, team) });
  assert.equal(room.phase, "playing");
  assert.equal(room.turn, team);
  act("tv", "endTurn");
  assert.equal(room.turn, opp);
  act("tv", "reveal", { index: indexOf(room, team) });
  assert.equal(room.phase, "over");
  assert.equal(room.winner, team);
  assert.equal(room.endReason, "agents");
  assert.ok(viewFor(room, "bo", 0).cards.every((c) => c.color !== null), "full key shown after the game");
});

test("one spymaster per team; offline spymaster can be replaced", () => {
  const { room, now, act } = setup();
  assert.throws(() => act("bo", "setPlayer", { team: "blue", role: "spymaster" }), /already has a spymaster/);
  const later = now + 60_000;
  room.players.find((p) => p.id === "bo").lastSeen = later;
  act("bo", "setPlayer", { team: "blue", role: "spymaster" }, later);
  assert.equal(room.players.find((p) => p.id === "bs").role, "operative");
  assert.equal(room.players.find((p) => p.id === "bo").role, "spymaster");
});

test("board takeover only after the board is away", () => {
  const { room, now, act } = setup();
  act("tv", "start");
  assert.throws(() => act("bo", "claimBoard", {}, now + 1000), /still connected/);
  act("bo", "claimBoard", {}, now + BOARD_AWAY_MS + 1);
  assert.equal(room.hostId, "bo");
  assert.ok(!room.players.some((p) => p.id === "tv"));
  const v = viewFor(room, "bo", now + BOARD_AWAY_MS + 1);
  assert.equal(v.me.role, "board");
  assert.ok(v.cards.filter((c) => !c.revealed).every((c) => c.color === null));
});

test("new game keeps teams and avoids recently used words", () => {
  const { room, act } = setup();
  act("tv", "start");
  const first = new Set(room.words);
  act("tv", "newGame");
  assert.equal(room.gameNo, 2);
  assert.ok(room.words.every((w) => !first.has(w)));
  assert.equal(room.players.find((p) => p.id === "bs").role, "spymaster");
});
