import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getCache } from "@vercel/functions";
import { createCacheStore } from "./cacheStore";
import { ROOM_TTL_MS, type Presence, type Room } from "./engine";

export interface RoomStore {
  /** "redis" has a real compare-and-set; the others also lean on client snapshots. */
  readonly kind: "memory" | "runtime-cache" | "redis";
  get(code: string): Promise<Room | null>;
  /** Writes unless the store holds a version newer than `expectedVersion` (null = must not exist). */
  put(room: Room, expectedVersion: number | null): Promise<boolean>;
  /** Last-seen times. Lossy by design: a dropped update only dims an online dot. */
  getPresence(code: string): Promise<Presence>;
  setPresence(code: string, seen: Presence): Promise<void>;
}

// ---------- in-memory (default, zero setup) ----------

type MemState = { rooms: Map<string, Room>; seen?: Map<string, Presence> };
const g = globalThis as unknown as { __impostorRooms?: MemState };
const mem: MemState = g.__impostorRooms ?? (g.__impostorRooms = { rooms: new Map() });
const memSeen = mem.seen ?? (mem.seen = new Map());
const MAX_MEM_ROOMS = 200;

function sweep(now: number) {
  for (const [code, room] of mem.rooms) {
    if (now - room.updatedAt > ROOM_TTL_MS) mem.rooms.delete(code);
  }
  for (const code of memSeen.keys()) if (!mem.rooms.has(code)) memSeen.delete(code);
  if (mem.rooms.size > MAX_MEM_ROOMS) {
    const oldest = [...mem.rooms.values()].sort((a, b) => a.updatedAt - b.updatedAt);
    for (const r of oldest.slice(0, mem.rooms.size - MAX_MEM_ROOMS)) mem.rooms.delete(r.code);
  }
}

const memoryStore: RoomStore = {
  kind: "memory",
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
    if (cur ? expectedVersion === null || cur.version > expectedVersion : false) return false;
    mem.rooms.set(room.code, structuredClone(room));
    sweep(Date.now());
    return true;
  },
  async getPresence(code) {
    return { ...memSeen.get(code) };
  },
  async setPresence(code, seen) {
    memSeen.set(code, { ...seen });
  },
};

// ---------- Vercel Runtime Cache (default on Vercel) ----------

// Shared by every function instance in the region, unlike instance memory.
// On Hobby the cache is shared across the team's projects, hence the namespace.
function runtimeCacheStore(): RoomStore {
  const cache = getCache({ namespace: "impostor", keyHashFunction: (k) => k });
  const store = createCacheStore<Room>(cache, {
    prefix: "room:",
    ttlMs: ROOM_TTL_MS,
    newId: () => randomBytes(8).toString("hex"),
  });
  const seenKey = (code: string) => `seen:${code}`;
  return {
    kind: "runtime-cache",
    get: store.get,
    put: store.put,
    async getPresence(code) {
      const raw = await cache.get(seenKey(code));
      try {
        return typeof raw === "string" ? (JSON.parse(raw) as Presence) : {};
      } catch {
        return {};
      }
    },
    async setPresence(code, seen) {
      await cache.set(seenKey(code), JSON.stringify(seen), { ttl: Math.ceil(ROOM_TTL_MS / 1000), name: "impostor-seen" });
    },
  };
}

// ---------- Upstash Redis over REST (optional) ----------

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
  const key = (code: string) => `impostor:room:${code}`;
  const seenKey = (code: string) => `impostor:seen:${code}`;
  return {
    kind: "redis",
    async get(code) {
      const raw = await call(["GET", key(code)]);
      return typeof raw === "string" ? (JSON.parse(raw) as Room) : null;
    },
    async put(room, expectedVersion) {
      const ok = await call([
        "EVAL",
        CAS_SCRIPT,
        1,
        key(room.code),
        JSON.stringify(room),
        expectedVersion === null ? "new" : String(expectedVersion),
        ROOM_TTL_MS,
      ]);
      return ok === 1;
    },
    async getPresence(code) {
      const raw = await call(["GET", seenKey(code)]);
      return typeof raw === "string" ? (JSON.parse(raw) as Presence) : {};
    },
    async setPresence(code, seen) {
      await call(["SET", seenKey(code), JSON.stringify(seen), "PX", ROOM_TTL_MS]);
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
