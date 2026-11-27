import { getCache } from "@vercel/functions";
import { ROOM_TTL_MS, normalizeRoom, repairRoom, type Room } from "./engine";
import { mergeRooms } from "./merge";
import { openRoom as openWithKeys, sealRoom as sealWithKeys, snapshotKeys } from "./snapshot";

// Rooms live in a store shared by every function instance (Vercel Runtime
// Cache in production). That cache can briefly serve stale copies and has no
// compare-and-set, so the route never trusts a single read: it merges the
// shared copy, this instance's last-known copy and the caller's snapshot
// (see merge.ts). Presence ("last seen") is kept in a separate record, so
// polling never writes the room and can't write back an old copy of it.
export interface RoomStore {
  /** `redis` is always current; the others also hand phones encrypted snapshots as a fallback. */
  readonly kind: "memory" | "shared" | "redis";
  get(code: string): Promise<Room | null>;
  set(room: Room): Promise<void>;
  getPresence(code: string): Promise<Record<string, number>>;
  touch(code: string, playerId: string, now: number): Promise<void>;
}

const fresh = (room: Room | null | undefined, now = Date.now()): room is Room => !!room && now - room.updatedAt <= ROOM_TTL_MS;

// ---------- this instance's last-known copy of each room ----------

type MemState = { rooms: Map<string, Room>; presence: Map<string, Record<string, number>> };
const g = globalThis as unknown as { __tabooStore?: MemState };
const mem: MemState = g.__tabooStore ?? (g.__tabooStore = { rooms: new Map(), presence: new Map() });
const MAX_MEM_ROOMS = 200;

function sweep(now: number) {
  for (const [code, room] of mem.rooms) {
    if (!fresh(room, now)) {
      mem.rooms.delete(code);
      mem.presence.delete(code);
    }
  }
  if (mem.rooms.size <= MAX_MEM_ROOMS) return;
  const oldest = [...mem.rooms.values()].sort((a, b) => a.updatedAt - b.updatedAt);
  for (const r of oldest.slice(0, mem.rooms.size - MAX_MEM_ROOMS)) mem.rooms.delete(r.code);
}

export function recallLocal(code: string): Room | null {
  const room = mem.rooms.get(code);
  return fresh(room) ? structuredClone(room) : null;
}

export function rememberLocal(room: Room) {
  const cur = mem.rooms.get(room.code);
  mem.rooms.set(room.code, (fresh(cur) && mergeRooms([normalizeRoom(cur), room], (r) => repairRoom(normalizeRoom(r)))) || structuredClone(room));
  sweep(Date.now());
}

function mergePresence(...records: (Record<string, number> | null | undefined)[]): Record<string, number> {
  const out: Record<string, number> = {};
  const cutoff = Date.now() - ROOM_TTL_MS;
  for (const r of records) for (const [id, t] of Object.entries(r ?? {})) if (typeof t === "number" && t > cutoff) out[id] = Math.max(out[id] ?? 0, t);
  return out;
}

const localPresence = (code: string) => ({ ...(mem.presence.get(code) ?? {}) });
function touchLocal(code: string, playerId: string, now: number) {
  mem.presence.set(code, mergePresence(mem.presence.get(code), { [playerId]: now }));
}

// ---------- in-memory (local dev) ----------

const memoryStore: RoomStore = {
  kind: "memory",
  async get(code) {
    return recallLocal(code);
  },
  async set(room) {
    mem.rooms.set(room.code, structuredClone(room));
    sweep(Date.now());
  },
  async getPresence(code) {
    return localPresence(code);
  },
  async touch(code, playerId, now) {
    touchLocal(code, playerId, now);
  },
};

// ---------- Vercel Runtime Cache (shared by every instance in a region) ----------

// Free on Hobby within the monthly allotment; if it is paused or unavailable,
// reads return null and writes are skipped, which degrades to memory + snapshots.
function sharedStore(): RoomStore {
  const cache = getCache({ namespace: "taboo" });
  const key = (code: string) => `room:${code}`;
  const presenceKey = (code: string) => `presence:${code}`;
  const readPresence = async (code: string) => {
    try {
      const raw = await cache.get(presenceKey(code));
      return typeof raw === "string" ? (JSON.parse(raw) as Record<string, number>) : null;
    } catch {
      return null;
    }
  };
  return {
    kind: "shared",
    async get(code) {
      try {
        const raw = await cache.get(key(code));
        const entry = typeof raw === "string" ? (JSON.parse(raw) as { room?: Room }) : null;
        return fresh(entry?.room) ? entry.room : null;
      } catch {
        return null;
      }
    },
    async set(room) {
      try {
        await cache.set(key(room.code), JSON.stringify({ room }), { ttl: Math.round(ROOM_TTL_MS / 1000), name: "taboo-room" });
      } catch {}
    },
    // A stale presence read can drop someone else's latest touch; that only delays
    // their "last seen" by one touch interval, which the timeouts in engine.ts allow for.
    async getPresence(code) {
      return mergePresence(await readPresence(code), localPresence(code));
    },
    async touch(code, playerId, now) {
      touchLocal(code, playerId, now);
      const merged = mergePresence(await readPresence(code), localPresence(code));
      try {
        await cache.set(presenceKey(code), JSON.stringify(merged), { ttl: Math.round(ROOM_TTL_MS / 1000), name: "taboo-presence" });
      } catch {}
    },
  };
}

// ---------- Upstash Redis over REST (only if already configured) ----------

function redisStore(url: string, token: string): RoomStore {
  const call = async (cmd: (string | number)[]) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmd),
      cache: "no-store",
    });
    const json = (await res.json()) as { result?: unknown; error?: string };
    if (!res.ok || json.error) throw new Error(json.error || `Redis ${res.status}`);
    return json.result;
  };
  const key = (code: string) => `taboo:room:${code}`;
  const presenceKey = (code: string) => `taboo:presence:${code}`;
  return {
    kind: "redis",
    async get(code) {
      const raw = await call(["GET", key(code)]);
      return typeof raw === "string" ? (JSON.parse(raw) as Room) : null;
    },
    async set(room) {
      await call(["SET", key(room.code), JSON.stringify(room), "PX", ROOM_TTL_MS]);
    },
    async getPresence(code) {
      const raw = (await call(["HGETALL", presenceKey(code)])) as string[] | null;
      const out: Record<string, number> = {};
      for (let i = 0; raw && i < raw.length; i += 2) out[raw[i]] = Number(raw[i + 1]);
      return out;
    },
    async touch(code, playerId, now) {
      await call(["HSET", presenceKey(code), playerId, now]);
      await call(["PEXPIRE", presenceKey(code), ROOM_TTL_MS]);
    },
  };
}

let cached: RoomStore | null = null;
export function getStore(): RoomStore {
  if (cached) return cached;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) cached = redisStore(url, token);
  else if (process.env.VERCEL) cached = sharedStore();
  else cached = memoryStore;
  return cached;
}

// ---------- encrypted snapshots ----------

let keys: Buffer[] | null = null;
const getKeys = () => (keys ??= snapshotKeys(process.env));

export const sealRoom = (room: Room) => sealWithKeys(room, getKeys());
export const openRoom = (snapshot: unknown, code: string) => openWithKeys(snapshot, code, getKeys());
