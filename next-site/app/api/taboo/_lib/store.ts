import { randomUUID } from "node:crypto";
import { getCache } from "@vercel/functions";
import { ROOM_TTL_MS, type Room } from "./engine";
import { openRoom as openWithKeys, sealRoom as sealWithKeys, snapshotKeys } from "./snapshot";

export interface RoomStore {
  /** `redis` is authoritative; the others also hand phones encrypted snapshots as a fallback. */
  readonly kind: "memory" | "shared" | "redis";
  get(code: string): Promise<Room | null>;
  /** Compare-and-set on `expectedVersion` (null = must not exist). */
  put(room: Room, expectedVersion: number | null): Promise<boolean>;
}

const newer = (a: Room | null, b: Room | null) => (!a ? b : !b ? a : a.version >= b.version ? a : b);

// ---------- per-instance memory ----------

type MemState = { rooms: Map<string, Room> };
const g = globalThis as unknown as { __tabooRooms?: MemState };
const mem: MemState = g.__tabooRooms ?? (g.__tabooRooms = { rooms: new Map() });
const MAX_MEM_ROOMS = 200;

function memGet(code: string): Room | null {
  const room = mem.rooms.get(code);
  if (!room) return null;
  if (Date.now() - room.updatedAt > ROOM_TTL_MS) {
    mem.rooms.delete(code);
    return null;
  }
  return room;
}

function memSet(room: Room) {
  mem.rooms.set(room.code, structuredClone(room));
  if (mem.rooms.size <= MAX_MEM_ROOMS) return;
  const oldest = [...mem.rooms.values()].sort((a, b) => a.updatedAt - b.updatedAt);
  for (const r of oldest.slice(0, mem.rooms.size - MAX_MEM_ROOMS)) mem.rooms.delete(r.code);
}

const memoryStore: RoomStore = {
  kind: "memory",
  async get(code) {
    const room = memGet(code);
    return room ? structuredClone(room) : null;
  },
  async put(room, expectedVersion) {
    if ((memGet(room.code)?.version ?? null) !== expectedVersion) return false;
    memSet(room);
    return true;
  },
};

// ---------- Vercel Runtime Cache (shared by every instance in a region) ----------

// Free on Hobby within the monthly allotment; if it is paused or unavailable,
// reads return null and writes are skipped, which degrades to memory + snapshots.
function sharedStore(): RoomStore {
  const cache = getCache({ namespace: "taboo" });
  const key = (code: string) => `room:${code}`;
  type Entry = { w: string; room: Room };
  const readEntry = async (code: string): Promise<Entry | null> => {
    try {
      const raw = await cache.get(key(code));
      const entry = typeof raw === "string" ? (JSON.parse(raw) as Entry) : null;
      return entry?.room && Date.now() - entry.room.updatedAt <= ROOM_TTL_MS ? entry : null;
    } catch {
      return null;
    }
  };
  const read = async (code: string) => (await readEntry(code))?.room ?? null;
  return {
    kind: "shared",
    async get(code) {
      const best = newer(await read(code), memGet(code));
      if (!best) return null;
      if (best !== memGet(code)) memSet(best);
      return structuredClone(best);
    },
    async put(room, expectedVersion) {
      const current = newer(await read(room.code), memGet(room.code));
      if ((current?.version ?? null) !== expectedVersion) return false;
      memSet(room);
      const w = randomUUID();
      try {
        await cache.set(key(room.code), JSON.stringify({ w, room } satisfies Entry), { ttl: Math.round(ROOM_TTL_MS / 1000), name: "taboo-room" });
      } catch {
        return true;
      }
      // The cache has no compare-and-set, so two instances can both pass the version
      // check; the one whose write didn't stick adopts the winner's state and retries.
      const back = await readEntry(room.code);
      if (back && back.w !== w && back.room.version >= room.version) {
        memSet(back.room);
        return false;
      }
      return true;
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
  const key = (code: string) => `taboo:room:${code}`;
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
  };
}

let cached: RoomStore | null = null;
export function getStore(): RoomStore {
  if (cached) return cached;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) cached = redisStore(url, token);
  else {
    try {
      cached = sharedStore();
    } catch {
      cached = memoryStore;
    }
  }
  return cached;
}

/** Re-seeds the store from a phone's snapshot when it is newer than what the store has. */
export async function adoptSnapshot(room: Room): Promise<void> {
  const store = getStore();
  if (store.kind === "redis" || Date.now() - room.updatedAt > ROOM_TTL_MS) return;
  for (let i = 0; i < 3; i++) {
    const cur = await store.get(room.code);
    if (cur && cur.version >= room.version) return;
    if (await store.put(room, cur ? cur.version : null)) return;
  }
}

// ---------- encrypted snapshots ----------

let keys: Buffer[] | null = null;
const getKeys = () => (keys ??= snapshotKeys(process.env));

export const sealRoom = (room: Room) => sealWithKeys(room, getKeys());
export const openRoom = (snapshot: unknown, code: string) => openWithKeys(snapshot, code, getKeys());
