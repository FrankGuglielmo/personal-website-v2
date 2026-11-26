import { randomBytes, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import type { ActionOp, ApiResponse } from "@/app/codenames/_lib/types";
import {
  GameError,
  TOUCH_MS,
  addPlayer,
  applyAction,
  applyPresence,
  createRoom,
  findByToken,
  viewFor,
  type Room,
} from "./_lib/engine";
import { getStore, openRoom, sealRoom } from "./_lib/store";
import { wordsFor } from "./_lib/words";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS: ReadonlySet<string> = new Set<ActionOp>([
  "setPlayer", "setPack", "start", "select", "reveal", "endTurn", "undo", "newGame", "toLobby", "kick",
  "claimBoard", "leave",
]);

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const newCode = () => Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
const newId = () => randomBytes(6).toString("hex");
const newToken = () => randomBytes(16).toString("base64url");
const normCode = (v: unknown) => (typeof v === "string" ? v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) : "");

function reply(body: ApiResponse, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Codenames-Store": getStore().kind() },
  });
}

function okView(room: Room, playerId: string, now: number, extra: { playerId?: string; token?: string } = {}) {
  return reply({ ok: true, view: viewFor(room, playerId, now), snapshot: sealRoom(room), ...extra });
}

class GoneError extends Error {}

/**
 * Loads the shared copy of a room (falling back to the caller's snapshot only
 * if the shared copy is missing or older), runs `fn`, and saves with a version
 * check, retrying on races. `fn` returns whether the room changed.
 */
async function withRoom(
  code: string,
  snapshot: unknown,
  fn: (room: Room, now: number) => boolean,
): Promise<{ room: Room; now: number }> {
  const store = getStore();
  const snap = openRoom(snapshot, code);
  for (let attempt = 0; attempt < 6; attempt++) {
    let room = await store.get(code);
    if (snap && (!room || snap.version > room.version)) {
      if (!(await store.put(snap, room ? room.version : null))) continue;
      room = structuredClone(snap);
    }
    if (!room) throw new GoneError("Room not found. It may have expired.");
    applyPresence(room, await store.getPresence(code));
    const before = room.version;
    const now = Date.now();
    if (fn(room, now)) {
      room.version = before + 1;
      room.updatedAt = now;
      if (!(await store.put(room, before))) {
        await new Promise((r) => setTimeout(r, 15 + Math.random() * 60));
        continue;
      }
    }
    return { room, now };
  }
  throw new GameError("The room is busy, try again");
}

/** Records that a player is still connected, at most once per TOUCH_MS. */
async function markSeen(room: Room, playerId: string, now: number) {
  const p = room.players.find((x) => x.id === playerId);
  if (!p || now - p.lastSeen < TOUCH_MS) return;
  p.lastSeen = now;
  await getStore().touch(room.code, playerId, now);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return reply({ ok: false, error: "Bad request" }, 400);
  }
  const op = body.op;
  const store = getStore();

  try {
    if (op === "create") {
      for (let i = 0; i < 10; i++) {
        const code = newCode();
        if (await store.get(code)) continue;
        const now = Date.now();
        const host = { id: newId(), token: newToken() };
        const room = createRoom(code, host, now);
        if (!(await store.put(room, null))) continue;
        await store.touch(code, host.id, now);
        return okView(room, host.id, now, { playerId: host.id, token: host.token });
      }
      return reply({ ok: false, error: "Couldn't create a room, try again" }, 503);
    }

    const code = normCode(body.code);
    if (code.length !== 4) return reply({ ok: false, error: "Room codes are 4 letters" }, 400);

    if (op === "join") {
      const token = newToken();
      let playerId = "";
      const { room, now } = await withRoom(code, body.snapshot, (r, t) => {
        playerId = addPlayer(r, { id: newId(), name: body.name, token }, t).id;
        return true;
      });
      await store.touch(code, playerId, now);
      return okView(room, playerId, now, { playerId, token });
    }

    const token = typeof body.token === "string" ? body.token : "";
    if (op !== "sync" && (typeof op !== "string" || !ACTIONS.has(op))) {
      return reply({ ok: false, error: "Unknown action" }, 400);
    }

    let playerId = "";
    const { room, now } = await withRoom(code, body.snapshot, (r, t) => {
      const me = findByToken(r, token);
      if (!me) throw new GoneError("You're no longer in this room");
      playerId = me.id;
      if (op === "sync") return false;
      applyAction(r, me.id, op as ActionOp, body, t, wordsFor);
      return true;
    });
    if (!room.players.some((p) => p.id === playerId)) {
      return reply({ ok: false, error: op === "leave" ? "You left the room" : "You're no longer in this room", gone: true });
    }
    await markSeen(room, playerId, now);
    return okView(room, playerId, now);
  } catch (err) {
    if (err instanceof GoneError) return reply({ ok: false, error: err.message, gone: true }, 404);
    if (err instanceof GameError) return reply({ ok: false, error: err.message }, 409);
    console.error("codenames api error", err);
    return reply({ ok: false, error: "Server error" }, 500);
  }
}
