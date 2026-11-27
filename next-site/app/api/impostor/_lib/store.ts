import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getCache } from "@vercel/functions";
import { ROOM_TTL_MS, type Room } from "./engine";
import { mergeRooms } from "./merge";

// Room state lives in a store shared by every function instance (Vercel
// Runtime Cache in production). That cache can briefly serve stale copies and
// has no compare-and-set, so callers never trust a single read: route.ts
// merges the shared copy, this instance's last-known copy and the caller's
// snapshot (see merge.ts). Presence ("last seen") is a separate record, so
// polling never rewrites game state.

export interface RoomStore {
  readonly kind: "memory" | "runtime-cache" | "redis";
  get(code: string): Promise<Room | null>;
  set(room: Room): Promise<void>;
  getPresence(code: string): Promise<Record<string, number>>;
  touch(code: string, playerId: string, now: number): Promise<void>;
}

const TTL_S = Math.round(ROOM_TTL_MS / 1000);
const fresh = (room: Room | null | undefined, now = Date.now()) => !!room && now - room.updatedAt <= ROOM_TTL_MS;

function prunePresence(p: Record<string, number>, now: number) {
  for (const id of Object.keys(p)) if (now - p[id] > ROOM_TTL_MS) delete p[id];
  return p;
}

// ---------- this instance's last-known copy of each room ----------

type MemState = { rooms: Map<string, Room>; presence: Map<string, Record<string, number>> };
const g = globalThis as unknown as { __impostorStore?: MemState };
const mem: MemState = g.__impostorStore ?? (g.__impostorStore = { rooms: new Map(), presence: new Map() });
const MAX_MEM_ROOMS = 200;

function sweep(now: number) {
  for (const [code, room] of mem.rooms) {
    if (!fresh(room, now)) {
      mem.rooms.delete(code);
      mem.presence.delete(code);
    }
  }
  if (mem.rooms.size > MAX_MEM_ROOMS) {
    const oldest = [...mem.rooms.values()].sort((a, b) => a.updatedAt - b.updatedAt);
    for (const r of oldest.slice(0, mem.rooms.size - MAX_MEM_ROOMS)) mem.rooms.delete(r.code);
  }
}

export function recallLocal(code: string): Room | null {
  const room = mem.rooms.get(code);
  return fresh(room) ? structuredClone(room!) : null;
}

export function rememberLocal(room: Room) {
  const cur = mem.rooms.get(room.code);
  mem.rooms.set(room.code, (fresh(cur) && mergeRooms([cur, room])) || structuredClone(room));
  sweep(Date.now());
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
    return { ...(mem.presence.get(code) ?? {}) };
  },
  async touch(code, playerId, now) {
    const p = mem.presence.get(code) ?? {};
    p[playerId] = now;
    mem.presence.set(code, p);
  },
};

// ---------- Vercel Runtime Cache (default on Vercel) ----------

// On Hobby the cache is shared across the team's projects, hence the namespace.
function runtimeCacheStore(): RoomStore {
  const cache = getCache({ namespace: "impostor", keyHashFunction: (k) => k });
  const roomKey = (code: string) => `room:${code}`;
  const presenceKey = (code: string) => `seen:${code}`;
  return {
    kind: "runtime-cache",
    async get(code) {
      let v = await cache.get(roomKey(code));
      if (typeof v === "string") {
        try {
          v = JSON.parse(v);
        } catch {
          return null;
        }
      }
      const room = v && typeof v === "object" ? (v as { room?: Room }).room : null;
      return room && fresh(room) ? room : null;
    },
    async set(room) {
      await cache.set(roomKey(room.code), { room }, { ttl: TTL_S, name: "impostor-room" });
    },
    async getPresence(code) {
      const v = (await cache.get(presenceKey(code))) as Record<string, number> | null;
      return v && typeof v === "object" ? { ...v } : {};
    },
    async touch(code, playerId, now) {
      const p = await this.getPresence(code);
      p[playerId] = now;
      await cache.set(presenceKey(code), prunePresence(p, now), { ttl: TTL_S, name: "impostor-presence" });
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
  const roomKey = (code: string) => `impostor:room:${code}`;
  const presenceKey = (code: string) => `impostor:presence:${code}`;
  return {
    kind: "redis",
    async get(code) {
      const raw = await call(["GET", roomKey(code)]);
      return typeof raw === "string" ? (JSON.parse(raw) as Room) : null;
    },
    async set(room) {
      await call(["SET", roomKey(room.code), JSON.stringify(room), "PX", ROOM_TTL_MS]);
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
  const forced = process.env.IMPOSTOR_STORE;
  if (url && token && forced !== "memory" && forced !== "runtime-cache") cached = redisStore(url, token);
  else if (forced === "runtime-cache" || (forced !== "memory" && process.env.VERCEL)) cached = runtimeCacheStore();
  else cached = memoryStore;
  return cached;
}

// ---------- encrypted snapshots ----------

function key(): Buffer {
  const seed = process.env.IMPOSTOR_SECRET || `impostor:${process.env.VERCEL_DEPLOYMENT_ID ?? ""}:${process.env.VERCEL_URL ?? "local"}`;
  return createHash("sha256").update(seed).digest();
}

export function sealRoom(room: Room): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(room), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function openRoom(snapshot: unknown, code: string): Room | null {
  if (typeof snapshot !== "string" || snapshot.length > 200_000) return null;
  try {
    const buf = Buffer.from(snapshot, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    const json = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
    const room = JSON.parse(json) as Room;
    return room.code === code ? room : null;
  } catch {
    return null;
  }
}
