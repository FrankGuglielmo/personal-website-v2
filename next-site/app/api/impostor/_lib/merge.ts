// Combines copies of one room that may disagree. The shared cache can serve a
// stale copy for a second or two and has no compare-and-set, so two writes can
// race and one can be dropped. Instead of trusting any single copy, every
// request merges all the copies it can see (shared cache, this instance's
// memory, the caller's snapshot) piece by piece:
//   - game state (phase, round, host, settings…) comes from the copy with the newest gameAt
//   - each player comes from the copy with that player's newest seatAt
//   - ready taps and ballots for the current round are combined per player,
//     since several phones tap them at the same moment
//   - removed player ids (kicked, left) are a grow-only set
// Whoever made a change keeps it in their snapshot and sends it on every poll,
// so a dropped write is restored on that device's next request.
// Same approach as app/api/codenames/_lib/merge.ts.
// No value imports, so `node --test` can load it directly.

import type { Player, Room, Round } from "./engine";

const gameAt = (r: Room) => r.gameAt ?? r.updatedAt ?? 0;

const sameVote = (a: Round, b: Round) =>
  !!a.vote && !!b.vote && a.vote.endsAt === b.vote.endsAt && a.vote.revote === b.vote.revote;

export function mergeRooms(rooms: readonly (Room | null | undefined)[]): Room | null {
  const list = rooms.filter((r): r is Room => !!r);
  if (!list.length) return null;
  const base = list.reduce((a, b) => (gameAt(b) > gameAt(a) || (gameAt(b) === gameAt(a) && b.version > a.version) ? b : a));
  const out: Room = structuredClone(base);
  const removed = new Set(list.flatMap((r) => r.removed ?? []));

  const players = new Map<string, Player>();
  for (const r of list) {
    for (const p of r.players) {
      if (removed.has(p.id)) continue;
      const cur = players.get(p.id);
      if (!cur) {
        players.set(p.id, structuredClone(p));
        continue;
      }
      const winner = (p.seatAt ?? 0) > (cur.seatAt ?? 0) ? structuredClone(p) : cur;
      winner.lastSeen = Math.max(cur.lastSeen, p.lastSeen);
      players.set(p.id, winner);
    }
  }
  // Scores move with the game (results, new game), so they follow the game copy.
  const baseScores = new Map(base.players.map((p) => [p.id, p.score]));
  for (const p of players.values()) if (baseScores.has(p.id)) p.score = baseScores.get(p.id)!;
  out.players = [...players.values()].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
  out.removed = [...removed];

  const r = out.round;
  if (r && (out.phase === "reveal" || out.phase === "vote")) {
    for (const c of list) {
      const cr = c.round;
      if (!cr || c.roundNo !== out.roundNo || cr.no !== r.no || cr.secret !== r.secret) continue;
      if (out.phase === "reveal") {
        for (const id of cr.ready) if (r.participants.includes(id) && !r.ready.includes(id)) r.ready.push(id);
      } else if (sameVote(r, cr)) {
        for (const [voter, b] of Object.entries(cr.vote!.ballots)) {
          const mine = r.vote!.ballots[voter];
          if (!r.participants.includes(voter) || removed.has(voter) || !r.vote!.candidates.includes(b.target)) continue;
          if (!mine || b.at > mine.at) r.vote!.ballots[voter] = b;
        }
      }
    }
  }

  out.version = Math.max(...list.map((x) => x.version));
  out.updatedAt = Math.max(...list.map((x) => x.updatedAt));
  return out;
}

const NOT_GAME = new Set(["players", "version", "updatedAt", "removed", "gameAt"]);
const gameKey = (r: Room) =>
  JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !NOT_GAME.has(k)).sort(([a], [b]) => a.localeCompare(b))));
const seatKey = (p: Player) => `${p.name}|${p.token}`;

/** Stamps what an action changed so later merges know which copy is newer. */
export function stampChanges(before: Room, after: Room, now: number) {
  const scores = (r: Room) => r.players.map((p) => `${p.id}:${p.score}`).join();
  if (gameKey(before) !== gameKey(after) || scores(before) !== scores(after)) {
    after.gameAt = Math.max(now, gameAt(before) + 1);
  }
  const prev = new Map(before.players.map((p) => [p.id, p]));
  for (const p of after.players) {
    const b = prev.get(p.id);
    if (!b || seatKey(b) !== seatKey(p)) p.seatAt = Math.max(now, (b?.seatAt ?? 0) + 1);
  }
  const ids = new Set(after.players.map((p) => p.id));
  const removed = new Set(after.removed ?? []);
  for (const p of before.players) if (!ids.has(p.id)) removed.add(p.id);
  after.removed = [...removed];
}

/** True when `stored` already holds everything `merged` knows (so no write is needed). */
export function covers(stored: Room | null, merged: Room): boolean {
  if (!stored) return false;
  if (gameAt(stored) !== gameAt(merged) || gameKey(stored) !== gameKey(merged)) return false;
  const removed = new Set(stored.removed ?? []);
  if ((merged.removed ?? []).some((id) => !removed.has(id))) return false;
  const seats = new Map(stored.players.map((p) => [p.id, p]));
  if (stored.players.length !== merged.players.length) return false;
  return merged.players.every((p) => {
    const s = seats.get(p.id);
    return !!s && (s.seatAt ?? 0) === (p.seatAt ?? 0) && seatKey(s) === seatKey(p) && s.score === p.score;
  });
}
