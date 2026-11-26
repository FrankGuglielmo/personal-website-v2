// Pure, server-authoritative game logic. Only type imports here so the file
// runs under `node --test` with type stripping (see engine.test.mjs).
import type {
  ActionOp,
  CardColor,
  CardView,
  GameEvent,
  PackId,
  Phase,
  Role,
  RoomView,
  Team,
} from "../../../codenames/_lib/types";

export const ONLINE_MS = 12_000;
export const TOUCH_MS = 8_000;
export const BOARD_AWAY_MS = 30_000;
export const MAX_PLAYERS = 24;
export const ROOM_TTL_MS = 8 * 60 * 60 * 1000;
export const BOARD_SIZE = 25;
const RECENT_MAX = 150;
const PACK_IDS: readonly PackId[] = ["classic", "food", "places", "holiday", "mix"];

export type Player = {
  id: string;
  name: string;
  team: Team | null;
  role: Role;
  token: string;
  joinedAt: number;
  lastSeen: number;
};

type HistoryEntry = { kind: "reveal"; index: number; turnBefore: Team } | { kind: "pass"; turnBefore: Team };

export type Room = {
  code: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  hostId: string;
  phase: Phase;
  pack: PackId;
  players: Player[];
  words: string[] | null;
  key: CardColor[] | null;
  revealed: boolean[] | null;
  startingTeam: Team | null;
  turn: Team | null;
  selected: number | null;
  history: HistoryEntry[];
  winner: Team | null;
  endReason: "agents" | "assassin" | null;
  lastEvent: GameEvent | null;
  eventSeq: number;
  gameNo: number;
  recent: string[];
};

export type WordSource = (pack: PackId) => readonly string[];

export class GameError extends Error {}

export const other = (t: Team): Team => (t === "blue" ? "red" : "blue");
const label = (t: Team) => (t === "blue" ? "Blue" : "Red");

export function cleanName(raw: unknown, fallback = "Player"): string {
  const s = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, 20) : "";
  return s || fallback;
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createRoom(code: string, host: { id: string; token: string }, now: number): Room {
  return {
    code,
    version: 1,
    createdAt: now,
    updatedAt: now,
    hostId: host.id,
    phase: "lobby",
    pack: "classic",
    players: [{ id: host.id, name: "TV board", team: null, role: "board", token: host.token, joinedAt: now, lastSeen: now }],
    words: null,
    key: null,
    revealed: null,
    startingTeam: null,
    turn: null,
    selected: null,
    history: [],
    winner: null,
    endReason: null,
    lastEvent: null,
    eventSeq: 0,
    gameNo: 0,
    recent: [],
  };
}

export function addPlayer(room: Room, p: { id: string; name: unknown; token: string }, now: number): Player {
  if (room.players.length >= MAX_PLAYERS) throw new GameError("This room is full");
  const player: Player = {
    id: p.id,
    name: cleanName(p.name),
    team: null,
    role: "operative",
    token: p.token,
    joinedAt: now,
    lastSeen: now,
  };
  room.players.push(player);
  return player;
}

export const findByToken = (room: Room, token: string) =>
  token ? room.players.find((p) => p.token === token) ?? null : null;

/** Records presence; returns true only when it's worth persisting. */
export function touch(room: Room, playerId: string, now: number): boolean {
  const p = room.players.find((x) => x.id === playerId);
  if (!p || now - p.lastSeen < TOUCH_MS) return false;
  p.lastSeen = now;
  return true;
}

const isOnline = (p: Player, now: number) => now - p.lastSeen < ONLINE_MS;

export function remaining(room: Room): Record<Team, number> | null {
  if (!room.key || !room.revealed) return null;
  const left = { blue: 0, red: 0 };
  room.key.forEach((c, i) => {
    if ((c === "blue" || c === "red") && !room.revealed![i]) left[c]++;
  });
  return left;
}

export function dealBoard(room: Room, words: WordSource) {
  const pool = [...new Set(words(room.pack))];
  if (pool.length < BOARD_SIZE) throw new GameError("That word pack is too small");
  const recent = new Set(room.recent);
  const fresh = pool.filter((w) => !recent.has(w));
  const picked = shuffle(fresh.length >= BOARD_SIZE ? fresh : pool).slice(0, BOARD_SIZE);
  const starting: Team = Math.random() < 0.5 ? "blue" : "red";
  const key: CardColor[] = [
    ...Array<CardColor>(9).fill(starting),
    ...Array<CardColor>(8).fill(other(starting)),
    ...Array<CardColor>(7).fill("neutral"),
    "assassin",
  ];
  room.words = picked;
  room.key = shuffle(key);
  room.revealed = Array(BOARD_SIZE).fill(false);
  room.startingTeam = starting;
  room.turn = starting;
  room.selected = null;
  room.history = [];
  room.winner = null;
  room.endReason = null;
  room.lastEvent = null;
  room.gameNo++;
  room.recent = [...picked, ...room.recent].slice(0, RECENT_MAX);
  room.phase = "playing";
}

type NewEvent = { [K in GameEvent["kind"]]: Omit<Extract<GameEvent, { kind: K }>, "seq"> }[GameEvent["kind"]];

function emit(room: Room, event: NewEvent) {
  room.eventSeq++;
  room.lastEvent = { ...event, seq: room.eventSeq } as GameEvent;
}

function parseIndex(room: Room, raw: unknown): number {
  const i = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(i) || i < 0 || i >= BOARD_SIZE) throw new GameError("Unknown card");
  if (room.revealed![i]) throw new GameError("That card is already revealed");
  return i;
}

const parseTeam = (raw: unknown): Team | null => (raw === "blue" || raw === "red" ? raw : null);

export function applyAction(
  room: Room,
  actorId: string,
  op: ActionOp,
  args: Record<string, unknown>,
  now: number,
  words: WordSource,
) {
  const me = room.players.find((p) => p.id === actorId);
  if (!me) throw new GameError("You're not in this room");
  const isHost = me.id === room.hostId;
  const hostOnly = () => {
    if (!isHost) throw new GameError("Only the TV board can do that");
  };
  const playing = () => {
    if (room.phase !== "playing" || !room.turn) throw new GameError("No game in progress");
  };

  switch (op) {
    case "setPlayer": {
      const targetId = typeof args.playerId === "string" ? args.playerId : me.id;
      if (targetId !== me.id && !isHost) throw new GameError("You can only change your own role");
      const target = room.players.find((p) => p.id === targetId);
      if (!target) throw new GameError("That player left");
      if (target.id === room.hostId) throw new GameError("The TV board can't join a team");
      const team = parseTeam(args.team);
      const role: Role = args.role === "spymaster" ? "spymaster" : "operative";
      if (role === "spymaster") {
        if (!team) throw new GameError("Pick a team first");
        const current = room.players.find((p) => p.id !== target.id && p.team === team && p.role === "spymaster");
        if (current) {
          if (!isHost && isOnline(current, now)) {
            throw new GameError(`${label(team)} already has a spymaster (${current.name})`);
          }
          current.role = "operative";
        }
      }
      target.team = team;
      target.role = role;
      return;
    }
    case "kick": {
      hostOnly();
      if (args.playerId === room.hostId) throw new GameError("The TV board can't be removed");
      room.players = room.players.filter((p) => p.id !== args.playerId);
      return;
    }
    case "leave": {
      if (isHost) throw new GameError("The TV board can't leave. Start a new board instead.");
      room.players = room.players.filter((p) => p.id !== me.id);
      return;
    }
    case "setPack": {
      hostOnly();
      if (room.phase !== "lobby") throw new GameError("Change the word pack from the lobby");
      if (!PACK_IDS.includes(args.pack as PackId)) throw new GameError("Unknown word pack");
      room.pack = args.pack as PackId;
      return;
    }
    case "start": {
      hostOnly();
      if (room.phase !== "lobby") throw new GameError("The game has already started");
      for (const t of ["blue", "red"] as const) {
        if (!room.players.some((p) => p.team === t && p.role === "spymaster")) {
          throw new GameError(`${label(t)} needs a spymaster`);
        }
      }
      dealBoard(room, words);
      return;
    }
    case "select": {
      hostOnly();
      playing();
      if (args.index === null) {
        room.selected = null;
        return;
      }
      const i = parseIndex(room, args.index);
      room.selected = room.selected === i ? null : i;
      return;
    }
    case "reveal": {
      hostOnly();
      playing();
      const i = parseIndex(room, args.index);
      const team = room.turn!;
      const color = room.key![i];
      room.history.push({ kind: "reveal", index: i, turnBefore: team });
      room.revealed![i] = true;
      room.selected = null;
      const left = remaining(room)!;
      if (color === "assassin") {
        room.winner = other(team);
        room.endReason = "assassin";
      } else if (left.blue === 0 || left.red === 0) {
        room.winner = left.blue === 0 ? "blue" : "red";
        room.endReason = "agents";
      } else if (color !== team) {
        room.turn = other(team);
      }
      if (room.winner) room.phase = "over";
      emit(room, { kind: "reveal", index: i, color, team });
      return;
    }
    case "endTurn": {
      hostOnly();
      playing();
      const team = room.turn!;
      room.history.push({ kind: "pass", turnBefore: team });
      room.turn = other(team);
      room.selected = null;
      emit(room, { kind: "pass", team });
      return;
    }
    case "undo": {
      hostOnly();
      if (room.phase === "lobby") throw new GameError("Nothing to undo");
      const last = room.history.pop();
      if (!last) throw new GameError("Nothing to undo");
      if (last.kind === "reveal") room.revealed![last.index] = false;
      room.turn = last.turnBefore;
      room.winner = null;
      room.endReason = null;
      room.selected = null;
      room.phase = "playing";
      emit(room, { kind: "undo" });
      return;
    }
    case "newGame": {
      hostOnly();
      if (room.phase === "lobby") throw new GameError("Start the game from the lobby");
      dealBoard(room, words);
      return;
    }
    case "toLobby": {
      hostOnly();
      room.phase = "lobby";
      room.words = room.key = room.revealed = null;
      room.turn = room.startingTeam = room.winner = room.endReason = null;
      room.selected = null;
      room.history = [];
      room.lastEvent = null;
      return;
    }
    case "claimBoard": {
      if (isHost) throw new GameError("This device is already the TV board");
      const host = room.players.find((p) => p.id === room.hostId);
      if (host && now - host.lastSeen < BOARD_AWAY_MS) throw new GameError("The TV board is still connected");
      room.players = room.players.filter((p) => p.id !== room.hostId);
      me.team = null;
      me.role = "board";
      me.name = "TV board";
      room.hostId = me.id;
      return;
    }
    default:
      throw new GameError("Unknown action");
  }
}

export function viewFor(room: Room, playerId: string, now: number): RoomView {
  const me = room.players.find((p) => p.id === playerId);
  if (!me) throw new GameError("You're not in this room");
  const pv = (p: Player) => ({
    id: p.id,
    name: p.name,
    team: p.team,
    role: p.role,
    online: isOnline(p, now),
    isHost: p.id === room.hostId,
  });
  const showKey = me.role === "spymaster" || room.phase === "over";
  const cards: CardView[] | null =
    room.words && room.key && room.revealed
      ? room.words.map((word, i) => ({
          word,
          revealed: room.revealed![i],
          color: room.revealed![i] || showKey ? room.key![i] : null,
        }))
      : null;
  const host = room.players.find((p) => p.id === room.hostId);
  return {
    code: room.code,
    version: room.version,
    serverNow: now,
    phase: room.phase,
    pack: room.pack,
    me: pv(me),
    players: room.players.map(pv),
    cards,
    turn: room.turn,
    startingTeam: room.startingTeam,
    selected: room.selected,
    remaining: remaining(room),
    winner: room.winner,
    endReason: room.endReason,
    lastEvent: room.lastEvent,
    canUndo: room.history.length > 0,
    boardAway: !host || now - host.lastSeen >= BOARD_AWAY_MS,
    gameNo: room.gameNo,
  };
}
