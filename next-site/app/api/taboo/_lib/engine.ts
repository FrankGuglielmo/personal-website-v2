// Pure, server-authoritative game logic. Only type imports here so the file
// runs under `node --test` with type stripping (see engine.test.mjs).
import type {
  ActionOp,
  CardResult,
  Phase,
  PlayedView,
  PublicCard,
  RoomView,
  Settings,
  TeamIdx,
} from "../../../taboo/_lib/types";

export const GRACE_MS = 750;
export const HOST_AWAY_MS = 45_000;
export const ONLINE_MS = 12_000;
export const TOUCH_MS = 8_000;
export const MAX_PLAYERS = 24;
export const ROOM_TTL_MS = 8 * 60 * 60 * 1000;

export type Player = {
  id: string;
  name: string;
  team: TeamIdx | null;
  token: string;
  joinedAt: number;
  lastSeen: number;
};

export type Played = { cardId: number; result: CardResult };

export type Room = {
  code: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  hostId: string;
  phase: Phase;
  settings: Settings;
  players: Player[];
  teamNames: [string, string];
  scores: [number, number];
  turnsPlayed: [number, number];
  rotation: [number, number];
  activeTeam: TeamIdx;
  clueGiverId: string | null;
  turn: {
    endsAt: number | null;
    pausedRemainingMs: number | null;
    currentCardId: number | null;
    played: Played[];
  } | null;
  deck: number[];
  deckPos: number;
  lastTurn: { team: TeamIdx; clueGiverName: string; played: Played[]; delta: number } | null;
  winner: TeamIdx | "tie" | null;
};

export type DeckSource = {
  ids(): number[];
  get(id: number): PublicCard | undefined;
};

export class GameError extends Error {}

export const DEFAULT_SETTINGS: Settings = { roundSec: 60, skipPenalty: 0, winMode: "score", target: 20 };

export function cleanName(raw: unknown, fallback = "Player"): string {
  const s = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, 20) : "";
  return s || fallback;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createRoom(code: string, host: { id: string; name: string; token: string }, now: number): Room {
  return {
    code,
    version: 1,
    createdAt: now,
    updatedAt: now,
    hostId: host.id,
    phase: "lobby",
    settings: { ...DEFAULT_SETTINGS },
    players: [{ id: host.id, name: cleanName(host.name), team: 0, token: host.token, joinedAt: now, lastSeen: now }],
    teamNames: ["Team A", "Team B"],
    scores: [0, 0],
    turnsPlayed: [0, 0],
    rotation: [0, 0],
    activeTeam: 0,
    clueGiverId: null,
    turn: null,
    deck: [],
    deckPos: 0,
    lastTurn: null,
    winner: null,
  };
}

export function teamMembers(room: Room, team: TeamIdx): Player[] {
  return room.players.filter((p) => p.team === team).sort((a, b) => a.joinedAt - b.joinedAt);
}

function smallerTeam(room: Room): TeamIdx {
  return teamMembers(room, 0).length <= teamMembers(room, 1).length ? 0 : 1;
}

export function addPlayer(room: Room, p: { id: string; name: string; token: string }, now: number): void {
  if (room.players.length >= MAX_PLAYERS) throw new GameError("Room is full");
  const joinedAt = Math.max(now, ...room.players.map((x) => x.joinedAt + 1));
  room.players.push({ id: p.id, name: cleanName(p.name), team: smallerTeam(room), token: p.token, joinedAt, lastSeen: now });
  if (room.phase === "ready" && !room.clueGiverId) pickClueGiver(room);
}

export function findByToken(room: Room, token: string): Player | undefined {
  return room.players.find((p) => p.token === token);
}

/** Records presence; returns true when the change is worth persisting. */
export function touch(room: Room, playerId: string, now: number): boolean {
  const p = room.players.find((x) => x.id === playerId);
  if (!p || now - p.lastSeen < TOUCH_MS) return false;
  p.lastSeen = now;
  return true;
}

function pickClueGiver(room: Room): void {
  const members = teamMembers(room, room.activeTeam);
  room.clueGiverId = members.length ? members[room.rotation[room.activeTeam] % members.length].id : null;
}

function draw(room: Room, deck: DeckSource): number {
  if (room.deckPos >= room.deck.length) {
    room.deck = shuffle(deck.ids());
    room.deckPos = 0;
  }
  return room.deck[room.deckPos++];
}

function pointsFor(result: CardResult, settings: Settings): number {
  if (result === "correct") return 1;
  if (result === "buzz") return -1;
  return -settings.skipPenalty;
}

export function turnDelta(played: Played[], settings: Settings): number {
  return played.reduce((sum, p) => sum + pointsFor(p.result, settings), 0);
}

function toReview(room: Room): void {
  if (!room.turn) return;
  room.turn.endsAt = null;
  room.turn.pausedRemainingMs = null;
  room.turn.currentCardId = null;
  room.phase = "review";
}

/** Advances time-based transitions. Returns true when state changed. */
export function tick(room: Room, now: number): boolean {
  if (room.phase === "active" && room.turn?.endsAt != null && now >= room.turn.endsAt + GRACE_MS) {
    toReview(room);
    return true;
  }
  return false;
}

function finishByScore(room: Room): void {
  const [a, b] = room.scores;
  room.winner = a === b ? "tie" : a > b ? 0 : 1;
  room.phase = "over";
  room.turn = null;
  room.clueGiverId = null;
}

function checkWin(room: Room): boolean {
  const [ta, tb] = room.turnsPlayed;
  if (ta !== tb) return false;
  const { winMode, target } = room.settings;
  if (winMode === "rounds") {
    if (ta >= target) {
      finishByScore(room);
      return true;
    }
    return false;
  }
  const [a, b] = room.scores;
  if (Math.max(a, b) >= target && a !== b) {
    finishByScore(room);
    return true;
  }
  return false;
}

function removePlayer(room: Room, playerId: string): void {
  const wasClueGiver = room.clueGiverId === playerId;
  room.players = room.players.filter((p) => p.id !== playerId);
  if (room.hostId === playerId) {
    const next = room.players.slice().sort((a, b) => a.joinedAt - b.joinedAt)[0];
    room.hostId = next ? next.id : "";
  }
  if (wasClueGiver) {
    if (room.phase === "active") toReview(room);
    else if (room.phase === "ready") pickClueGiver(room);
  }
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function applyAction(
  room: Room,
  actorId: string,
  op: ActionOp,
  args: Record<string, unknown>,
  now: number,
  deck: DeckSource,
): void {
  const actor = room.players.find((p) => p.id === actorId);
  if (!actor) throw new GameError("You are not in this room");
  const isHost = room.hostId === actorId;
  const isClueGiver = room.clueGiverId === actorId;
  const needHost = () => {
    if (!isHost) throw new GameError("Only the host can do that");
  };
  const needPhase = (...phases: Phase[]) => {
    if (!phases.includes(room.phase)) throw new GameError("Not right now");
  };

  switch (op) {
    case "setTeam": {
      const targetId = typeof args.playerId === "string" ? args.playerId : actorId;
      if (targetId !== actorId) needHost();
      const target = room.players.find((p) => p.id === targetId);
      if (!target) throw new GameError("Player not found");
      const team = args.team === 0 || args.team === 1 ? args.team : null;
      if (room.phase === "active" && (target.id === room.clueGiverId || target.team === room.activeTeam || team === room.activeTeam)) {
        throw new GameError("Switch teams between turns");
      }
      target.team = team;
      // Joining a team mid-game puts you at the end of its rotation.
      if (team !== null && room.phase !== "lobby") target.joinedAt = Math.max(now, ...room.players.map((x) => x.joinedAt + 1));
      if (room.phase === "ready" && (target.id === room.clueGiverId || !room.clueGiverId)) pickClueGiver(room);
      return;
    }
    case "setTeamName": {
      const team = args.team === 0 || args.team === 1 ? args.team : null;
      if (team === null) throw new GameError("Bad team");
      if (!isHost && actor.team !== team) throw new GameError("Only the host or team members can rename a team");
      room.teamNames[team] = cleanName(args.name, team === 0 ? "Team A" : "Team B");
      return;
    }
    case "setSettings": {
      needHost();
      needPhase("lobby", "over");
      const s = room.settings;
      const roundSec = num(args.roundSec);
      if (roundSec !== null) s.roundSec = Math.min(180, Math.max(15, Math.round(roundSec)));
      if (args.skipPenalty === 0 || args.skipPenalty === 1) s.skipPenalty = args.skipPenalty;
      if (args.winMode === "score" || args.winMode === "rounds") s.winMode = args.winMode;
      const target = num(args.target);
      if (target !== null) s.target = Math.min(100, Math.max(1, Math.round(target)));
      return;
    }
    case "shuffleTeams": {
      needHost();
      needPhase("lobby", "over");
      const playing = shuffle(room.players.filter((p) => p.team !== null));
      playing.forEach((p, i) => (p.team = (i % 2) as TeamIdx));
      return;
    }
    case "start": {
      needHost();
      needPhase("lobby", "over");
      if (teamMembers(room, 0).length < 2 || teamMembers(room, 1).length < 2) {
        throw new GameError("Each team needs at least 2 players");
      }
      room.scores = [0, 0];
      room.turnsPlayed = [0, 0];
      room.rotation = [0, 0];
      room.deck = shuffle(deck.ids());
      room.deckPos = 0;
      room.lastTurn = null;
      room.winner = null;
      room.turn = null;
      room.activeTeam = 0;
      pickClueGiver(room);
      room.phase = "ready";
      return;
    }
    case "beginTurn": {
      needPhase("ready");
      if (!isClueGiver && !isHost) throw new GameError("Waiting for the clue-giver");
      if (!room.clueGiverId) throw new GameError("This team has no players");
      room.turn = {
        endsAt: now + room.settings.roundSec * 1000,
        pausedRemainingMs: null,
        currentCardId: draw(room, deck),
        played: [],
      };
      room.phase = "active";
      return;
    }
    case "correct":
    case "skip":
    case "buzz": {
      needPhase("active");
      const turn = room.turn!;
      if (turn.endsAt == null) throw new GameError("Paused");
      if (turn.currentCardId == null || args.cardId !== turn.currentCardId) throw new GameError("stale");
      if (op === "buzz") {
        const opponent = actor.team !== null && actor.team !== room.activeTeam;
        if (!opponent && !isClueGiver) throw new GameError("Only the other team can buzz");
      } else if (!isClueGiver) {
        throw new GameError("Only the clue-giver can do that");
      }
      turn.played.push({ cardId: turn.currentCardId, result: op });
      turn.currentCardId = draw(room, deck);
      return;
    }
    case "undo": {
      needPhase("active");
      if (!isClueGiver) throw new GameError("Only the clue-giver can undo");
      const turn = room.turn!;
      const last = turn.played.pop();
      if (!last) throw new GameError("Nothing to undo");
      if (turn.currentCardId != null) room.deck.splice(room.deckPos, 0, turn.currentCardId);
      turn.currentCardId = last.cardId;
      return;
    }
    case "pause": {
      needPhase("active");
      if (!isHost && !isClueGiver) throw new GameError("Only the host or clue-giver can pause");
      const turn = room.turn!;
      if (turn.endsAt == null) return;
      turn.pausedRemainingMs = Math.max(0, turn.endsAt - now);
      turn.endsAt = null;
      return;
    }
    case "resume": {
      needPhase("active");
      if (!isHost && !isClueGiver) throw new GameError("Only the host or clue-giver can resume");
      const turn = room.turn!;
      if (turn.pausedRemainingMs == null) return;
      turn.endsAt = now + turn.pausedRemainingMs;
      turn.pausedRemainingMs = null;
      return;
    }
    case "toggleResult": {
      needPhase("review");
      if (!isHost && !isClueGiver) throw new GameError("Only the host or clue-giver can edit results");
      const i = num(args.index);
      const item = i !== null ? room.turn?.played[i] : undefined;
      if (!item) throw new GameError("Card not found");
      const order: CardResult[] = ["correct", "skip", "buzz"];
      item.result = order[(order.indexOf(item.result) + 1) % order.length];
      return;
    }
    case "confirmReview": {
      needPhase("review");
      if (!isHost && !isClueGiver) throw new GameError("Waiting for the clue-giver to confirm");
      const team = room.activeTeam;
      const played = room.turn?.played ?? [];
      const delta = turnDelta(played, room.settings);
      room.scores[team] += delta;
      const giver = room.players.find((p) => p.id === room.clueGiverId);
      room.lastTurn = { team, clueGiverName: giver?.name ?? "Clue-giver", played, delta };
      room.turnsPlayed[team] += 1;
      room.rotation[team] += 1;
      room.turn = null;
      if (checkWin(room)) return;
      room.activeTeam = team === 0 ? 1 : 0;
      pickClueGiver(room);
      room.phase = "ready";
      return;
    }
    case "kick": {
      needHost();
      const targetId = typeof args.playerId === "string" ? args.playerId : "";
      if (!targetId || targetId === actorId) throw new GameError("Can't kick that player");
      removePlayer(room, targetId);
      return;
    }
    case "claimHost": {
      const host = room.players.find((p) => p.id === room.hostId);
      if (host && now - host.lastSeen < HOST_AWAY_MS) throw new GameError("The host is still here");
      room.hostId = actorId;
      return;
    }
    case "endGame": {
      needHost();
      needPhase("ready", "active", "review");
      finishByScore(room);
      return;
    }
    case "newGame": {
      needHost();
      needPhase("over");
      room.phase = "lobby";
      room.scores = [0, 0];
      room.turnsPlayed = [0, 0];
      room.lastTurn = null;
      room.winner = null;
      room.clueGiverId = null;
      return;
    }
    case "leave": {
      removePlayer(room, actorId);
      return;
    }
    default:
      throw new GameError("Unknown action");
  }
}

function playedView(played: Played[], deck: DeckSource, showWords: boolean): PlayedView[] {
  return played.map((p) => ({ cardId: p.cardId, result: p.result, word: showWords ? deck.get(p.cardId)?.word ?? null : null }));
}

/** Guessers and spectators never get card contents while a turn is live. */
export function canSeeCard(room: Room, playerId: string): boolean {
  if (room.phase !== "active") return false;
  const me = room.players.find((p) => p.id === playerId);
  if (!me) return false;
  if (me.id === room.clueGiverId) return true;
  return me.team !== null && me.team !== room.activeTeam;
}

export function viewFor(room: Room, playerId: string, now: number, deck: DeckSource): RoomView {
  const me = room.players.find((p) => p.id === playerId);
  if (!me) throw new GameError("You are not in this room");
  const host = room.players.find((p) => p.id === room.hostId);
  const seeCard = canSeeCard(room, playerId);
  const turn = room.turn;
  return {
    code: room.code,
    version: room.version,
    serverNow: now,
    me: { id: me.id, name: me.name, team: me.team, isHost: me.id === room.hostId },
    hostId: room.hostId,
    hostAway: !host || now - host.lastSeen >= HOST_AWAY_MS,
    phase: room.phase,
    settings: { ...room.settings },
    players: room.players
      .slice()
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((p) => ({ id: p.id, name: p.name, team: p.team, online: now - p.lastSeen < ONLINE_MS })),
    teamNames: [...room.teamNames],
    scores: [...room.scores],
    turnsPlayed: [...room.turnsPlayed],
    activeTeam: room.activeTeam,
    clueGiverId: room.clueGiverId,
    turn: turn
      ? {
          endsAt: turn.endsAt,
          pausedRemainingMs: turn.pausedRemainingMs,
          card: seeCard && turn.currentCardId != null ? deck.get(turn.currentCardId) ?? null : null,
          canSeeCard: seeCard,
          played: playedView(turn.played, deck, seeCard || room.phase === "review"),
          delta: turnDelta(turn.played, room.settings),
        }
      : null,
    lastTurn: room.lastTurn
      ? {
          team: room.lastTurn.team,
          clueGiverName: room.lastTurn.clueGiverName,
          played: playedView(room.lastTurn.played, deck, true),
          delta: room.lastTurn.delta,
        }
      : null,
    winner: room.winner,
  };
}
