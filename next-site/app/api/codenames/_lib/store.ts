import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { ROOM_TTL_MS, type Room } from "./engine";

// Rooms live in this function instance's memory. Every client also carries an
// encrypted copy (see sealRoom), so a cold or recycled instance can rebuild a
// room from the next request instead of losing the game.

type MemState = { rooms: Map<string, Room> };
const g = globalThis as unknown as { __codenamesRooms?: MemState };
const mem: MemState = g.__codenamesRooms ?? (g.__codenamesRooms = { rooms: new Map() });
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

export async function getRoom(code: string): Promise<Room | null> {
  const room = mem.rooms.get(code);
  if (!room) return null;
  if (Date.now() - room.updatedAt > ROOM_TTL_MS) {
    mem.rooms.delete(code);
    return null;
  }
  return structuredClone(room);
}

/** Compare-and-set on `expectedVersion` (null = must not exist). */
export async function putRoom(room: Room, expectedVersion: number | null): Promise<boolean> {
  const cur = mem.rooms.get(room.code);
  if ((cur ? cur.version : null) !== expectedVersion) return false;
  mem.rooms.set(room.code, structuredClone(room));
  sweep(Date.now());
  return true;
}

/** Lets clients re-seed an instance that lost (or never had) the room. */
export async function adoptSnapshot(room: Room): Promise<void> {
  const cur = mem.rooms.get(room.code);
  if (cur && cur.version >= room.version) return;
  if (Date.now() - room.updatedAt > ROOM_TTL_MS) return;
  mem.rooms.set(room.code, structuredClone(room));
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
    return room.code === code ? room : null;
  } catch {
    return null;
  }
}
