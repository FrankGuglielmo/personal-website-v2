import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { getCache } from "@vercel/functions";
import { ROOM_TTL_MS, type Room } from "./engine";

// Room state lives in a store shared by every function instance (Vercel
// Runtime Cache in production), so all phones see one copy of each room.
// Presence ("last seen") is kept in a separate record: polling only ever
// writes presence, and game state is written only when something changes.
// Clients also carry an encrypted snapshot of the room (see sealRoom) as a
// last resort if the shared copy is ever evicted or a read fails.

export type StoreKind = "runtime-cache" | "runtime-cache-unavailable" | "redis" | "memory";

export interface RoomStore {
  kind(): StoreKind;
  get(code: string): Promise<Room | null>;
  /** Writes only if the stored version still equals `expectedVersion` (null = must not exist). */
  put(room: Room, expectedVersion: number | null): Promise<boolean>;
  getPresence(code: string): Promise<Record<string, number>>;
  touch(code: string, playerId: string, now: number): Promise<void>;
}

const TTL_S = Math.round(ROOM_TTL_MS / 1000);

function prunePresence(p: Record<string, number>, now: number) {
  for (const id of Object.keys(p)) if (now - p[id] > ROOM_TTL_MS) delete p[id];
  return p;
}

// ---------- in-memory (local dev) ----------

type MemState = { rooms: Map<string, Room>; presence: Map<string, Record<string, number>> };
const g = globalThis as unknown as { __codenamesStore?: MemState };
const mem: MemState = g.__codenamesStore ?? (g.__codenamesStore = { rooms: new Map(), presence: new Map() });
const MAX_MEM_ROOMS = 200;

function sweep(now: number) {
  for (const [code, room] of mem.rooms) {
    if (now - room.updatedAt > ROOM_TTL_MS) {
      mem.rooms.delete(code);
      mem.presence.delete(code);
    }
  }
  if (mem.rooms.size > MAX_MEM_ROOMS) {
    const oldest = [...mem.rooms.values()].sort((a, b) => a.updatedAt - b.updatedAt);
    for (const r of oldest.slice(0, mem.rooms.size - MAX_MEM_ROOMS)) mem.rooms.delete(r.code);
  }
}

const memoryStore: RoomStore = {
  kind: () => "memory",
  async get(code) {
    const room = mem.rooms.get(code);
    if (!room) return null;
    if (Date.now() - room.updatedAt > ROOM_TTL_MS) {
      mem.rooms.delete(code);
      return null;
    }
    return structuredClone(room);
  },
  async put(room, expectedVersion) {
    const cur = mem.rooms.get(room.code);
    if ((cur ? cur.version : null) !== expectedVersion) return false;
    mem.rooms.set(room.code, structuredClone(room));
    sweep(Date.now());
    return true;
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

// ---------- Vercel Runtime Cache (production) ----------

type Stored = { room: Room; writeId: string };

function runtimeCacheAvailable(): boolean {
  const ctx = (globalThis as { [k: symbol]: { get?: () => { cache?: unknown } } | undefined })[
    Symbol.for("@vercel/request-context")
  ];
  return !!ctx?.get?.()?.cache || !!(process.env.RUNTIME_CACHE_ENDPOINT && process.env.RUNTIME_CACHE_HEADERS);
}

function runtimeCacheStore(): RoomStore {
  const cache = getCache({ namespace: "codenames" });
  const roomKey = (code: string) => `room:${code}`;
  const presenceKey = (code: string) => `presence:${code}`;
  const read = async (code: string) => {
    const v = (await cache.get(roomKey(code))) as Stored | null;
    return v && typeof v === "object" && v.room ? v : null;
  };
  return {
    kind: () => (runtimeCacheAvailable() ? "runtime-cache" : "runtime-cache-unavailable"),
    async get(code) {
      return (await read(code))?.room ?? null;
    },
    async put(room, expectedVersion) {
      const cur = await read(room.code);
      if ((cur ? cur.room.version : null) !== expectedVersion) return false;
      const writeId = randomUUID();
      await cache.set(roomKey(room.code), { room, writeId } satisfies Stored, { ttl: TTL_S, name: "codenames-room" });
      // Runtime Cache has no compare-and-set. Reading back catches the case where
      // another instance wrote the same version at the same moment; the loser
      // retries on top of the winner's state.
      const back = await read(room.code);
      return !back || back.writeId === writeId;
    },
    async getPresence(code) {
      const v = (await cache.get(presenceKey(code))) as Record<string, number> | null;
      return v && typeof v === "object" ? { ...v } : {};
    },
    async touch(code, playerId, now) {
      const p = await this.getPresence(code);
      p[playerId] = now;
      await cache.set(presenceKey(code), prunePresence(p, now), { ttl: TTL_S, name: "codenames-presence" });
    },
  };
}

// ---------- Upstash Redis over REST (only if already configured) ----------

const CAS_SCRIPT = `
local cur = redis.call('GET', KEYS[1])
if cur then
  if ARGV[2] == 'new' or tostring(cjson.decode(cur).version) ~= ARGV[2] then return 0 end
elseif ARGV[2] ~= 'new' then return 0 end
redis.call('SET', KEYS[1], ARGV[1], 'PX', ARGV[3])
return 1`;

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
  const roomKey = (code: string) => `codenames:room:${code}`;
  const presenceKey = (code: string) => `codenames:presence:${code}`;
  return {
    kind: () => "redis",
    async get(code) {
      const raw = await call(["GET", roomKey(code)]);
      return typeof raw === "string" ? (JSON.parse(raw) as Room) : null;
    },
    async put(room, expectedVersion) {
      const ok = await call([
        "EVAL",
        CAS_SCRIPT,
        1,
        roomKey(room.code),
        JSON.stringify(room),
        expectedVersion === null ? "new" : String(expectedVersion),
        ROOM_TTL_MS,
      ]);
      return ok === 1;
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
  else if (process.env.VERCEL) cached = runtimeCacheStore();
  else cached = memoryStore;
  return cached;
}

// ---------- encrypted snapshots ----------

let warned = false;
function key(): Buffer {
  const secret = process.env.CODENAMES_SECRET;
  if (!secret && process.env.VERCEL_ENV === "production" && !warned) {
    warned = true;
    console.warn("CODENAMES_SECRET is not set; snapshot encryption falls back to a guessable key");
  }
  const seed =
    secret ||
    (process.env.VERCEL
      ? `codenames:${process.env.VERCEL_DEPLOYMENT_ID ?? ""}:${process.env.VERCEL_URL ?? ""}`
      : "codenames:local-dev");
  return createHash("sha256").update(seed).digest();
}

export function sealRoom(room: Room): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(room), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function openRoom(snapshot: unknown, code: string): Room | null {
  if (typeof snapshot !== "string" || snapshot.length > 100_000) return null;
  try {
    const buf = Buffer.from(snapshot, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    const json = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
    const room = JSON.parse(json) as Room;
    return room.code === code && Date.now() - room.updatedAt <= ROOM_TTL_MS ? room : null;
  } catch {
    return null;
  }
}
