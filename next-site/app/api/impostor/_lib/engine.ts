import type { ActionOp, Mode, Phase, ResultView, RoomView, Settings } from "@/app/impostor/_lib/types";

// Pure game rules. No I/O and no relative value imports, so `node --test` can
// load this file directly with type stripping.

export const ROOM_TTL_MS = 8 * 60 * 60 * 1000;
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 16;
export const VOTE_MS = 45_000;
export const REVOTE_MS = 30_000;
export const GUESS_MS = 45_000;
export const GRACE_MS = 750;
export const HOST_AWAY_MS = 45_000;
// Presence pings are store writes; keep them sparse to stay inside the free
// Runtime Cache write allotment.
const ONLINE_MS = 25_000;
const TOUCH_EVERY_MS = 10_000;
const GUESS_OPTIONS = 10;
const NAME_MAX = 20;

export type Place = { name: string; roles: string[] };
export type Category = { id: string; name: string; words: string[]; places: Place[] };

export class GameError extends Error {}

export type Player = {
  id: string;
  name: string;
  token: string;
  joinedAt: number;
  lastSeen: number;
  score: number;
};

type Ballot = { target: string; at: number };

export type Round = {
  no: number;
  mode: Mode;
  categoryId: string;
  categoryName: string;
  secret: string;
  options: string[];
  roles: Record<string, string>;
  participants: string[];
  impostors: string[];
  eliminated: string[];
  ready: string[];
  clueOrder: string[];
  clueIndex: number;
  firstAsker: string | null;
  discussEndsAt: number;
  lastEliminated: string | null;
  vote: { candidates: string[]; revote: boolean; ballots: Record<string, Ballot>; endsAt: number } | null;
  lastTally: { id: string; votes: number }[];
  firstVoterId: string | null;
  guess: { by: string; reason: "caught" | "called"; endsAt: number } | null;
};

export type Room = {
  code: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  hostId: string;
  phase: Phase;
  players: Player[];
  settings: Settings;
  roundNo: number;
  round: Round | null;
  result: ResultView | null;
  usedSecrets: string[];
  lastImpostors: string[];
};

const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const maxImpostors = (n: number) => Math.max(1, Math.ceil(n / 2) - 1);

function cleanName(raw: unknown, room: Room | null): string {
  let name = (typeof raw === "string" ? raw : "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
  if (!name) name = `Player ${(room?.players.length ?? 0) + 1}`;
  if (!room) return name;
  const taken = new Set(room.players.map((p) => p.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  for (let i = 2; ; i++) {
    const n = `${name.slice(0, NAME_MAX - 3)} ${i}`;
    if (!taken.has(n.toLowerCase())) return n;
  }
}

export function defaultSettings(categories: Category[]): Settings {
  return {
    mode: "spyfall",
    impostors: 1,
    knowEachOther: false,
    discussSec: 300,
    rounds: 5,
    multiVote: false,
    categories: categories.map((c) => c.id),
  };
}

export function createRoom(
  code: string,
  host: { id: string; name: unknown; token: string },
  now: number,
  categories: Category[],
): Room {
  return {
    code,
    version: 1,
    createdAt: now,
    updatedAt: now,
    hostId: host.id,
    phase: "lobby",
    players: [{ id: host.id, name: cleanName(host.name, null), token: host.token, joinedAt: now, lastSeen: now, score: 0 }],
    settings: defaultSettings(categories),
    roundNo: 0,
    round: null,
    result: null,
    usedSecrets: [],
    lastImpostors: [],
  };
}

export function addPlayer(room: Room, p: { id: string; name: unknown; token: string }, now: number) {
  if (room.players.length >= MAX_PLAYERS) throw new GameError(`This room is full (${MAX_PLAYERS} players)`);
  room.players.push({ id: p.id, name: cleanName(p.name, room), token: p.token, joinedAt: now, lastSeen: now, score: 0 });
}

export const findByToken = (room: Room, token: string) =>
  token ? room.players.find((p) => p.token === token) ?? null : null;

/** Returns true when lastSeen moved enough to be worth a write. */
export function touch(room: Room, id: string, now: number): boolean {
  const p = room.players.find((x) => x.id === id);
  if (!p || now - p.lastSeen < TOUCH_EVERY_MS) return false;
  p.lastSeen = now;
  return true;
}

const isActive = (phase: Phase) => phase === "reveal" || phase === "discuss" || phase === "vote" || phase === "guess";
const alive = (r: Round) => r.participants.filter((id) => !r.eliminated.includes(id));
const aliveImpostors = (r: Round) => alive(r).filter((id) => r.impostors.includes(id));
const aliveInnocents = (r: Round) => alive(r).filter((id) => !r.impostors.includes(id));
const multiVoteOn = (room: Room, r: Round) => room.settings.multiVote && r.impostors.length >= 2;

// ---------- dealing ----------

function dealRound(room: Room, categories: Category[]) {
  const players = [...room.players].sort((a, b) => a.joinedAt - b.joinedAt).map((p) => p.id);
  if (players.length < MIN_PLAYERS) throw new GameError(`Need at least ${MIN_PLAYERS} players`);
  const { mode } = room.settings;
  const k = Math.min(Math.max(1, room.settings.impostors), maxImpostors(players.length));

  const pool = categories.filter((c) => room.settings.categories.includes(c.id));
  const cats = pool.length ? pool : categories;
  const entries = (c: Category) => (mode === "spyfall" ? c.places.map((p) => p.name) : c.words);
  const keyOf = (c: Category, name: string) => `${mode}:${c.id}:${name}`;
  let fresh = cats.flatMap((c) => entries(c).filter((n) => !room.usedSecrets.includes(keyOf(c, n))).map((n) => ({ c, n })));
  if (!fresh.length) {
    room.usedSecrets = room.usedSecrets.filter((key) => !key.startsWith(`${mode}:`));
    fresh = cats.flatMap((c) => entries(c).map((n) => ({ c, n })));
  }
  const { c: cat, n: secret } = pick(fresh);
  room.usedSecrets.push(keyOf(cat, secret));

  const options = shuffle([secret, ...shuffle(entries(cat).filter((n) => n !== secret)).slice(0, GUESS_OPTIONS - 1)]);

  const avoid = new Set(room.lastImpostors);
  const eligible = players.length - players.filter((id) => avoid.has(id)).length >= k ? players.filter((id) => !avoid.has(id)) : players;
  const impostors = shuffle(eligible).slice(0, k);
  const innocents = players.filter((id) => !impostors.includes(id));

  const roles: Record<string, string> = {};
  if (mode === "spyfall") {
    const place = cat.places.find((p) => p.name === secret);
    const roleList = shuffle(place?.roles ?? []);
    shuffle(innocents).forEach((id, i) => {
      if (roleList.length) roles[id] = roleList[i % roleList.length];
    });
  }

  let clueOrder = shuffle(players);
  const firstInnocent = clueOrder.findIndex((id) => !impostors.includes(id));
  if (firstInnocent > 0) clueOrder = [...clueOrder.slice(firstInnocent), ...clueOrder.slice(0, firstInnocent)];

  room.roundNo += 1;
  room.round = {
    no: room.roundNo,
    mode,
    categoryId: cat.id,
    categoryName: cat.name,
    secret,
    options,
    roles,
    participants: players,
    impostors,
    eliminated: [],
    ready: [],
    clueOrder,
    clueIndex: 0,
    firstAsker: mode === "spyfall" ? pick(players) : null,
    discussEndsAt: 0,
    lastEliminated: null,
    vote: null,
    lastTally: [],
    firstVoterId: null,
    guess: null,
  };
  room.result = null;
  room.phase = "reveal";
}

// ---------- phase transitions ----------

function startDiscuss(room: Room, r: Round, now: number) {
  room.phase = "discuss";
  r.discussEndsAt = now + room.settings.discussSec * 1000;
  r.clueIndex = 0;
  r.vote = null;
}

function startVote(room: Room, r: Round, now: number, candidates: string[], revote: boolean) {
  room.phase = "vote";
  r.vote = { candidates, revote, ballots: {}, endsAt: now + (revote ? REVOTE_MS : VOTE_MS) };
}

function voters(r: Round) {
  return alive(r);
}

function maybeResolveVote(room: Room, r: Round, now: number) {
  if (room.phase !== "vote" || !r.vote) return;
  const vs = voters(r);
  if (vs.every((id) => r.vote!.ballots[id] || !r.vote!.candidates.some((c) => c !== id))) resolveVote(room, r, now);
}

function resolveVote(room: Room, r: Round, now: number) {
  const vote = r.vote!;
  const counts = new Map<string, number>(vote.candidates.map((id) => [id, 0]));
  for (const [voter, b] of Object.entries(vote.ballots)) {
    if (r.participants.includes(voter) && counts.has(b.target)) counts.set(b.target, counts.get(b.target)! + 1);
  }
  r.lastTally = [...counts].map(([id, votes]) => ({ id, votes })).sort((a, b) => b.votes - a.votes);
  const top = r.lastTally[0]?.votes ?? 0;
  const leaders = r.lastTally.filter((t) => t.votes === top).map((t) => t.id);

  if (top === 0) return finish(room, r, "impostors", "Nobody got any votes, so the impostor slipped away.");
  if (leaders.length > 1) {
    if (!vote.revote) return startVote(room, r, now, leaders, true);
    return finish(room, r, "impostors", "Still tied after the re-vote, so nobody was voted out.");
  }

  const out = leaders[0];
  r.eliminated.push(out);
  const first = Object.entries(vote.ballots)
    .filter(([, b]) => b.target === out)
    .sort((a, b) => a[1].at - b[1].at)[0];
  r.firstVoterId = first ? first[0] : null;

  if (r.impostors.includes(out)) {
    room.phase = "guess";
    r.vote = null;
    r.guess = { by: out, reason: "caught", endsAt: now + GUESS_MS };
    return;
  }
  if (multiVoteOn(room, r) && aliveImpostors(r).length < aliveInnocents(r).length) {
    r.lastEliminated = out;
    startDiscuss(room, r, now);
    return;
  }
  finish(room, r, "impostors", "An innocent player was voted out.");
}

function resolveGuess(room: Room, r: Round, pickName: string | null) {
  const g = r.guess!;
  const correct = pickName === r.secret;
  const guess = { by: g.by, pick: pickName, correct };
  if (correct) return finish(room, r, "impostors", "The impostor guessed the secret.", guess);
  if (g.reason === "caught") {
    return finish(room, r, "innocents", pickName ? "The impostor was caught and guessed wrong." : "The impostor was caught and ran out of time.", guess);
  }
  return finish(room, r, "innocents", "The impostor called it early and guessed wrong.", guess);
}

function finish(
  room: Room,
  r: Round,
  outcome: ResultView["outcome"],
  reason: string,
  guess: ResultView["guess"] = null,
) {
  const deltas: Record<string, number> = {};
  if (outcome === "innocents") {
    for (const id of r.participants) if (!r.impostors.includes(id)) deltas[id] = 1;
    if (r.firstVoterId && deltas[r.firstVoterId]) deltas[r.firstVoterId] += 1;
  } else if (outcome === "impostors") {
    for (const id of r.impostors) deltas[id] = 2;
    if (guess?.correct) deltas[guess.by] = 3;
  }
  for (const p of room.players) p.score += deltas[p.id] ?? 0;
  room.result = {
    roundNo: r.no,
    outcome,
    reason,
    mode: r.mode,
    category: r.categoryName,
    secret: r.secret,
    impostors: [...r.impostors],
    roles: { ...r.roles },
    eliminated: [...r.eliminated],
    tally: r.lastTally,
    guess,
    deltas,
    firstVoterId: outcome === "innocents" ? r.firstVoterId : null,
  };
  room.lastImpostors = [...r.impostors];
  r.vote = null;
  r.guess = null;
  room.phase = "results";
}

/** Applies anything that became due because time passed. */
export function tick(room: Room, now: number): boolean {
  const r = room.round;
  if (!r) return false;
  if (room.phase === "discuss" && now >= r.discussEndsAt + GRACE_MS) {
    startVote(room, r, now, alive(r), false);
    return true;
  }
  if (room.phase === "vote" && r.vote && now >= r.vote.endsAt + GRACE_MS) {
    resolveVote(room, r, now);
    return true;
  }
  if (room.phase === "guess" && r.guess && now >= r.guess.endsAt + GRACE_MS) {
    resolveGuess(room, r, null);
    return true;
  }
  return false;
}

function removePlayer(room: Room, id: string, now: number) {
  room.players = room.players.filter((p) => p.id !== id);
  if (room.hostId === id && room.players.length) {
    room.hostId = [...room.players].sort((a, b) => a.joinedAt - b.joinedAt)[0].id;
  }
  const r = room.round;
  if (!r || !isActive(room.phase) || !r.participants.includes(id)) return;
  if (r.impostors.includes(id)) {
    finish(room, r, "cancelled", "An impostor left the room, so this round doesn't count.");
    return;
  }
  r.participants = r.participants.filter((x) => x !== id);
  r.eliminated = r.eliminated.filter((x) => x !== id);
  r.ready = r.ready.filter((x) => x !== id);
  const cur = r.clueOrder[r.clueIndex];
  r.clueOrder = r.clueOrder.filter((x) => x !== id);
  if (cur && cur !== id) r.clueIndex = Math.max(0, r.clueOrder.indexOf(cur));
  if (r.firstAsker === id) r.firstAsker = r.participants[0] ?? null;
  if (r.vote) {
    delete r.vote.ballots[id];
    for (const [voter, b] of Object.entries(r.vote.ballots)) if (b.target === id) delete r.vote.ballots[voter];
    r.vote.candidates = r.vote.candidates.filter((x) => x !== id);
  }
  if (alive(r).length < MIN_PLAYERS || aliveImpostors(r).length >= aliveInnocents(r).length) {
    finish(room, r, "cancelled", "Too few players left to finish this round.");
    return;
  }
  if (room.phase === "reveal" && r.participants.every((x) => r.ready.includes(x))) startDiscuss(room, r, now);
  if (room.phase === "vote" && r.vote && !r.vote.candidates.length) {
    finish(room, r, "impostors", "Nobody was left to vote for.");
    return;
  }
  maybeResolveVote(room, r, now);
}

// ---------- actions ----------

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : NaN);

function applySettings(room: Room, args: Record<string, unknown>, categories: Category[]) {
  const s = { ...room.settings };
  const patch = (args.settings ?? {}) as Partial<Record<keyof Settings, unknown>>;
  if (patch.mode === "spyfall" || patch.mode === "word") s.mode = patch.mode;
  if (patch.impostors !== undefined) {
    const n = num(patch.impostors);
    if (n >= 1 && n <= 7) s.impostors = n;
  }
  if (typeof patch.knowEachOther === "boolean") s.knowEachOther = patch.knowEachOther;
  if (typeof patch.multiVote === "boolean") s.multiVote = patch.multiVote;
  if ([180, 300, 480].includes(num(patch.discussSec))) s.discussSec = num(patch.discussSec);
  if ([3, 5, 8].includes(num(patch.rounds))) s.rounds = num(patch.rounds);
  if (Array.isArray(patch.categories)) {
    const ids = new Set(categories.map((c) => c.id));
    const next = patch.categories.filter((x): x is string => typeof x === "string" && ids.has(x));
    if (!next.length) throw new GameError("Pick at least one category");
    s.categories = [...new Set(next)];
  }
  room.settings = s;
}

export function applyAction(
  room: Room,
  me: string,
  op: ActionOp,
  args: Record<string, unknown>,
  now: number,
  categories: Category[],
) {
  const isHost = room.hostId === me;
  const needHost = () => {
    if (!isHost) throw new GameError("Only the host can do that");
  };
  const r = room.round;
  const needPhase = (...phases: Phase[]) => {
    if (!phases.includes(room.phase)) throw new GameError("stale");
  };

  switch (op) {
    case "setSettings":
      needHost();
      needPhase("lobby");
      return applySettings(room, args, categories);

    case "start":
      needHost();
      needPhase("lobby");
      room.roundNo = 0;
      room.usedSecrets = [];
      room.lastImpostors = [];
      for (const p of room.players) p.score = 0;
      return dealRound(room, categories);

    case "nextRound":
      needHost();
      needPhase("results");
      if (room.roundNo >= room.settings.rounds) {
        room.phase = "over";
        return;
      }
      return dealRound(room, categories);

    case "ready":
      needPhase("reveal");
      if (!r!.participants.includes(me)) return;
      if (!r!.ready.includes(me)) r!.ready.push(me);
      if (r!.participants.every((id) => r!.ready.includes(id))) startDiscuss(room, r!, now);
      return;

    case "startDiscuss":
      needHost();
      needPhase("reveal");
      return startDiscuss(room, r!, now);

    case "clueDone": {
      needPhase("discuss");
      const cur = r!.clueOrder[r!.clueIndex];
      if (!cur || (cur !== me && !isHost)) throw new GameError("It's not your turn");
      if (args.who !== cur) throw new GameError("stale");
      let i = r!.clueIndex + 1;
      while (i < r!.clueOrder.length && r!.eliminated.includes(r!.clueOrder[i])) i++;
      r!.clueIndex = i;
      return;
    }

    case "clueAgain": {
      needHost();
      needPhase("discuss");
      let i = 0;
      while (i < r!.clueOrder.length && r!.eliminated.includes(r!.clueOrder[i])) i++;
      r!.clueIndex = i;
      return;
    }

    case "callVote":
      needHost();
      needPhase("discuss");
      return startVote(room, r!, now, alive(r!), false);

    case "vote": {
      needPhase("vote");
      const v = r!.vote!;
      if (!alive(r!).includes(me)) throw new GameError("You can't vote this round");
      const target = args.target;
      if (typeof target !== "string" || !v.candidates.includes(target)) throw new GameError("stale");
      if (target === me) throw new GameError("You can't vote for yourself");
      v.ballots[me] = { target, at: now };
      return maybeResolveVote(room, r!, now);
    }

    case "knowIt":
      needPhase("discuss");
      if (r!.mode !== "spyfall" || !aliveImpostors(r!).includes(me)) throw new GameError("Only the impostor can do that");
      room.phase = "guess";
      r!.guess = { by: me, reason: "called", endsAt: now + GUESS_MS };
      return;

    case "guess":
      needPhase("guess");
      if (r!.guess!.by !== me) throw new GameError("It's not your guess");
      if (typeof args.pick !== "string" || !r!.options.includes(args.pick)) throw new GameError("Pick one of the options");
      return resolveGuess(room, r!, args.pick);

    case "endGame":
      needHost();
      if (room.phase === "lobby" || room.phase === "over") return;
      room.round = null;
      room.phase = "over";
      return;

    case "newGame":
      needHost();
      needPhase("over", "results");
      room.phase = "lobby";
      room.round = null;
      room.result = null;
      room.roundNo = 0;
      room.usedSecrets = [];
      room.lastImpostors = [];
      for (const p of room.players) p.score = 0;
      return;

    case "kick": {
      needHost();
      const target = args.target;
      if (typeof target !== "string" || target === me) throw new GameError("Can't remove that player");
      if (!room.players.some((p) => p.id === target)) return;
      return removePlayer(room, target, now);
    }

    case "claimHost": {
      if (isHost) return;
      const host = room.players.find((p) => p.id === room.hostId);
      if (host && now - host.lastSeen < HOST_AWAY_MS) throw new GameError("The host is still here");
      room.hostId = me;
      return;
    }

    case "leave":
      return removePlayer(room, me, now);

    default:
      throw new GameError("Unknown action");
  }
}

// ---------- per-player view ----------

export function viewFor(room: Room, me: string, now: number, categories: Category[]): RoomView {
  const r = room.round;
  const active = !!r && isActive(room.phase);
  const nameOf = (id: string) => room.players.find((p) => p.id === id)?.name ?? "Someone";

  let card: RoomView["card"] = null;
  if (r && active) {
    if (!r.participants.includes(me)) card = { kind: "spectator" };
    else if (r.impostors.includes(me)) {
      card = {
        kind: "impostor",
        mode: r.mode,
        category: r.categoryName,
        fellows: room.settings.knowEachOther ? r.impostors.filter((id) => id !== me).map(nameOf) : [],
      };
    } else {
      card = { kind: "innocent", mode: r.mode, category: r.categoryName, secret: r.secret, role: r.roles[me] ?? null };
    }
  }

  const v = r?.vote;
  return {
    code: room.code,
    version: room.version,
    serverNow: now,
    phase: room.phase,
    meId: me,
    hostId: room.hostId,
    players: [...room.players]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.id === room.hostId,
        online: now - p.lastSeen < ONLINE_MS,
        score: p.score,
        inRound: active ? r!.participants.includes(p.id) : false,
        eliminated: active ? r!.eliminated.includes(p.id) : false,
        ready: active ? r!.ready.includes(p.id) : false,
        voted: room.phase === "vote" && !!v?.ballots[p.id],
      })),
    settings: room.settings,
    limits: { minPlayers: MIN_PLAYERS, maxPlayers: MAX_PLAYERS, maxImpostors: maxImpostors(room.players.length) },
    catalog: categories.map((c) => ({ id: c.id, name: c.name })),
    roundNo: room.roundNo,
    totalRounds: room.settings.rounds,
    category: active ? r!.categoryName : null,
    card,
    discuss:
      r && (room.phase === "discuss" || room.phase === "reveal")
        ? {
            endsAt: r.discussEndsAt,
            clueOrder: r.mode === "word" ? r.clueOrder : [],
            clueIndex: r.clueIndex,
            firstAsker: r.firstAsker,
            lastEliminated: r.lastEliminated,
          }
        : null,
    vote:
      r && v && room.phase === "vote"
        ? {
            endsAt: v.endsAt,
            candidates: v.candidates,
            revote: v.revote,
            myVote: v.ballots[me]?.target ?? null,
            canVote: alive(r).includes(me),
            votedCount: alive(r).filter((id) => v.ballots[id]).length,
            voterCount: alive(r).length,
          }
        : null,
    guess:
      r && r.guess && room.phase === "guess"
        ? { endsAt: r.guess.endsAt, by: r.guess.by, reason: r.guess.reason, options: r.guess.by === me ? r.options : null }
        : null,
    result: room.phase === "results" || room.phase === "over" ? room.result : null,
  };
}
