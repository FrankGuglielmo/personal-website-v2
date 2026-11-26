import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { ROOM_TTL_MS, type Room } from "./engine";

export interface RoomStore {
  readonly kind: "memory" | "redis";
  get(code: string): Promise<Room | null>;
  /** Compare-and-set on `expectedVersion` (null = must not exist). */
  put(room: Room, expectedVersion: number | null): Promise<boolean>;
}

// ---------- in-memory (default, zero setup) ----------

type MemState = { rooms: Map<string, Room> };
const g = globalThis as unknown as { __tabooRooms?: MemState };
const mem: MemState = g.__tabooRooms ?? (g.__tabooRooms = { rooms: new Map() });
const MAX_MEM_ROOMS = 200;

function sweep(now: number) {
  for (const [code, room] of mem.rooms) {
    if (now - room.updatedAt > ROOM_TTL_MS) mem.rooms.delete(code);
  }
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
    if ((cur ? cur.version : null) !== expectedVersion) return false;
    mem.rooms.set(room.code, structuredClone(room));
    sweep(Date.now());
    return true;
  },
};

/** Lets clients re-seed an instance that lost (or never had) the room. */
export async function adoptSnapshot(room: Room): Promise<void> {
  const cur = mem.rooms.get(room.code);
  if (cur && cur.version >= room.version) return;
  if (Date.now() - room.updatedAt > ROOM_TTL_MS) return;
  mem.rooms.set(room.code, structuredClone(room));
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
  cached = url && token ? redisStore(url, token) : memoryStore;
  return cached;
}

// ---------- encrypted snapshots ----------

function key(): Buffer {
  const seed = process.env.TABOO_SECRET || `taboo:${process.env.VERCEL_DEPLOYMENT_ID ?? ""}:${process.env.VERCEL_URL ?? "local"}`;
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
