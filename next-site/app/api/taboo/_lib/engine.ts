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
// Long enough that locking a phone or switching apps never hands VIP to someone else.
export const HOST_AWAY_MS = 3 * 60_000;
export const ONLINE_MS = 50_000;
export const TOUCH_MS = 20_000;
export const MAX_PLAYERS = 24;
export const ROOM_TTL_MS = 8 * 60 * 60 * 1000;

export type Player = {
  id: string;
  name: string;
  team: TeamIdx | null;
  token: string;
  joinedAt: number;
  lastSeen: number;
  /** When this player's name/team last changed (see merge.ts). */
  seatAt?: number;
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
  teamNames: string[];
  scores: number[];
  turnsPlayed: number[];
  rotation: number[];
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
  /** When game state (anything but the player list) last changed (see merge.ts). */
  gameAt?: number;
  /** Ids of kicked or departed players, so an older copy can't bring them back. */
  removed?: string[];
};

export type DeckSource = {
  ids(): number[];
  get(id: number): PublicCard | undefined;
};

export class GameError extends Error {}

export const DEFAULT_SETTINGS: Settings = { teamCount: 2, roundSec: 60, skipPenalty: 0, winMode: "score", target: 20 };
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 4;
export const MIN_PER_TEAM = 2;

export const defaultTeamName = (t: number) => `Team ${String.fromCharCode(65 + t)}`;
const zeros = (n: number) => Array.from({ length: n }, () => 0);
const teamList = (room: Room) => Array.from({ length: room.settings.teamCount }, (_, t) => t);
const validTeam = (room: Room, v: unknown): v is TeamIdx =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v < room.settings.teamCount;

/** Upgrades rooms saved before team counts existed (always 2 teams) and keeps arrays sized to `teamCount`. */
export function normalizeRoom(room: Room): Room {
  const count = Math.min(MAX_TEAMS, Math.max(MIN_TEAMS, room.settings.teamCount ?? room.teamNames?.length ?? 2));
  room.settings = Object.assign(room.settings ?? {}, { ...DEFAULT_SETTINGS, ...room.settings, teamCount: count });
  const fit = (arr: number[] | undefined) => Array.from({ length: count }, (_, i) => arr?.[i] ?? 0);
  room.teamNames = Array.from({ length: count }, (_, i) => room.teamNames?.[i] ?? defaultTeamName(i));
  room.scores = fit(room.scores);
  room.turnsPlayed = fit(room.turnsPlayed);
  room.rotation = fit(room.rotation);
  return room;
}

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
    teamNames: [defaultTeamName(0), defaultTeamName(1)],
    scores: zeros(2),
    turnsPlayed: zeros(2),
    rotation: zeros(2),
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
  let best = 0;
  for (const t of teamList(room)) if (teamMembers(room, t).length < teamMembers(room, best).length) best = t;
  return best;
}

function setTeamCount(room: Room, count: number): void {
  const n = Math.min(MAX_TEAMS, Math.max(MIN_TEAMS, Math.round(count)));
  if (n === room.settings.teamCount) return;
  room.settings.teamCount = n;
  normalizeRoom(room);
  room.teamNames = room.teamNames.slice(0, n);
  for (const p of room.players.slice().sort((a, b) => a.joinedAt - b.joinedAt)) {
    if (p.team !== null && p.team >= n) {
      p.team = null;
      p.team = smallerTeam(room);
    }
  }
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

/** The single highest-scoring team, or null if the lead is shared. */
function leader(room: Room): TeamIdx | null {
  const top = Math.max(...room.scores);
  const leaders = room.scores.flatMap((s, t) => (s === top ? [t] : []));
  return leaders.length === 1 ? leaders[0] : null;
}

function finishByScore(room: Room): void {
  room.winner = leader(room) ?? "tie";
  room.phase = "over";
  room.turn = null;
  room.clueGiverId = null;
}

function checkWin(room: Room): boolean {
  const turns = room.turnsPlayed[0];
  if (room.turnsPlayed.some((n) => n !== turns)) return false;
  const { winMode, target } = room.settings;
  if (winMode === "rounds") {
    if (turns >= target) {
      finishByScore(room);
      return true;
    }
    return false;
  }
  if (Math.max(...room.scores) >= target && leader(room) !== null) {
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

/** Fixes what merging two diverged copies of a room can break. */
export function repairRoom(room: Room): Room {
  for (const p of room.players.slice().sort((a, b) => a.joinedAt - b.joinedAt)) {
    if (p.team !== null && !validTeam(room, p.team)) {
      p.team = null;
      p.team = smallerTeam(room);
    }
  }
  if (!room.players.some((p) => p.id === room.hostId)) {
    const next = room.players.slice().sort((a, b) => a.joinedAt - b.joinedAt)[0];
    room.hostId = next ? next.id : "";
  }
  if (room.clueGiverId && !room.players.some((p) => p.id === room.clueGiverId)) {
    if (room.phase === "ready") pickClueGiver(room);
  } else if (room.phase === "ready" && !room.clueGiverId) pickClueGiver(room);
  return room;
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
      const team = validTeam(room, args.team) ? args.team : null;
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
      needHost();
      if (!validTeam(room, args.team)) throw new GameError("Bad team");
      room.teamNames[args.team] = cleanName(args.name, defaultTeamName(args.team));
      return;
    }
    case "setSettings": {
      needHost();
      needPhase("lobby", "over");
      const s = room.settings;
      const teamCount = num(args.teamCount);
      if (teamCount !== null) setTeamCount(room, teamCount);
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
      playing.forEach((p, i) => (p.team = i % room.settings.teamCount));
      return;
    }
    case "start": {
      needHost();
      needPhase("lobby", "over");
      if (teamList(room).some((t) => teamMembers(room, t).length < MIN_PER_TEAM)) {
        throw new GameError(`Each team needs at least ${MIN_PER_TEAM} players`);
      }
      const n = room.settings.teamCount;
      room.scores = zeros(n);
      room.turnsPlayed = zeros(n);
      room.rotation = zeros(n);
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
        // Any non-active team may buzz; the card-id check above makes the first buzz win.
        const opponent = actor.team !== null && actor.team !== room.activeTeam;
        if (!opponent && !isClueGiver) throw new GameError("Only the other teams can buzz");
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
      room.activeTeam = (team + 1) % room.settings.teamCount;
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
    case "transferHost": {
      needHost();
      const target = room.players.find((p) => p.id === args.playerId);
      if (!target || target.id === actorId) throw new GameError("Pick another player");
      room.hostId = target.id;
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
      room.scores = zeros(room.settings.teamCount);
      room.turnsPlayed = zeros(room.settings.teamCount);
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
