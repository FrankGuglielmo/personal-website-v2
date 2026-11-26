// Combines copies of one room that may disagree. The shared cache can serve a
// stale copy for a second or two and has no compare-and-set, so two writes can
// race and one can be dropped. Instead of trusting any single copy, every
// request merges all the copies it can see (shared cache, this instance's
// memory, the caller's snapshot) piece by piece:
//   - game state (phase, turn, scores, settings, host…) comes from the copy with the newest gameAt
//   - each player comes from the copy with that player's newest seatAt
//   - removed player ids (kicked, left) are a grow-only set
// Whoever made a change keeps it in their snapshot and sends it on every poll,
// so a dropped write is restored on that device's next request.
// No value imports, so `node --test` can load it directly; the route passes
// the engine's repair step in.

import type { Player, Room } from "./engine";

const gameAt = (r: Room) => r.gameAt ?? r.updatedAt ?? 0;

export function mergeRooms(rooms: readonly (Room | null | undefined)[], repair: (room: Room) => void = () => {}): Room | null {
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
  out.players = [...players.values()].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
  out.removed = [...removed];
  out.version = Math.max(...list.map((r) => r.version));
  out.updatedAt = Math.max(...list.map((r) => r.updatedAt));
  repair(out);
  return out;
}

const NOT_GAME = new Set(["players", "version", "updatedAt", "removed", "gameAt"]);
const gameKey = (r: Room) =>
  JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !NOT_GAME.has(k)).sort(([a], [b]) => a.localeCompare(b))));
const seatKey = (p: Player) => `${p.name}|${p.team}|${p.token}|${p.joinedAt}`;

/** Stamps what an action changed so later merges know which copy is newer. */
export function stampChanges(before: Room, after: Room, now: number) {
  if (gameKey(before) !== gameKey(after)) after.gameAt = Math.max(now, gameAt(before) + 1);
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
  if (stored.players.length !== merged.players.length) return false;
  const seats = new Map(stored.players.map((p) => [p.id, p]));
  return merged.players.every((p) => {
    const s = seats.get(p.id);
    return !!s && (s.seatAt ?? 0) === (p.seatAt ?? 0) && seatKey(s) === seatKey(p);
  });
}
