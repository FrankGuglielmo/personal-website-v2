import { randomBytes, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import type { ActionOp, ApiResponse } from "@/app/impostor/_lib/types";
import { CATEGORIES } from "./_lib/packs";
import { GameError, ROOM_TTL_MS, addPlayer, applyAction, createRoom, findByToken, tick, touch, viewFor, type Room } from "./_lib/engine";
import { getStore, openRoom, sealRoom } from "./_lib/store";

// Every room operation lives in this one handler. Production state lives in a
// shared store (Runtime Cache or Redis); each client also carries an encrypted
// snapshot so a room survives cache eviction or a cold dev server.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS: ReadonlySet<string> = new Set<ActionOp>([
  "setSettings", "start", "ready", "startDiscuss", "clueDone", "clueAgain", "callVote", "vote", "knowIt",
  "guess", "nextRound", "endGame", "newGame", "kick", "claimHost", "leave",
]);

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const newCode = () => Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
const newId = () => randomBytes(6).toString("hex");
const newToken = () => randomBytes(16).toString("base64url");
const normCode = (v: unknown) => (typeof v === "string" ? v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) : "");

function reply(body: ApiResponse, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function okView(room: Room, playerId: string, now: number, extra: { playerId?: string; token?: string } = {}) {
  const store = getStore();
  return reply({
    ok: true,
    view: viewFor(room, playerId, now, CATEGORIES),
    snapshot: store.kind === "redis" ? undefined : sealRoom(room),
    ...extra,
  });
}

class GoneError extends Error {}

/** Loads a room, runs `fn`, and saves with compare-and-set, retrying on races. */
async function withRoom(
  code: string,
  snapshot: unknown,
  fn: (room: Room, now: number) => boolean,
): Promise<{ room: Room; now: number }> {
  const store = getStore();
  const snap = store.kind === "redis" ? null : openRoom(snapshot, code);
  const snapFresh = snap && Date.now() - snap.updatedAt < ROOM_TTL_MS ? snap : null;
  for (let attempt = 0; attempt < 6; attempt++) {
    let room = await store.get(code);
    if (snapFresh && (!room || snapFresh.version > room.version)) {
      if (!(await store.put(snapFresh, room ? room.version : null))) continue;
      room = structuredClone(snapFresh);
    }
    if (!room) throw new GoneError("Room not found. It may have expired.");
    const before = room.version;
    const now = Date.now();
    const ticked = tick(room, now);
    const changed = fn(room, now);
    if (ticked || changed) {
      room.version = before + 1;
      room.updatedAt = now;
      if (!(await store.put(room, before))) continue;
    }
    return { room, now };
  }
  throw new GameError("The room is busy, try again");
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
        const host = { id: newId(), name: body.name, token: newToken() };
        const room = createRoom(code, host, now, CATEGORIES);
        if (!(await store.put(room, null))) continue;
        return okView(room, host.id, now, { playerId: host.id, token: host.token });
      }
      return reply({ ok: false, error: "Couldn't create a room, try again" }, 503);
    }

    const code = normCode(body.code);
    if (code.length !== 4) return reply({ ok: false, error: "Room codes are 4 letters" }, 400);

    if (op === "join") {
      const player = { id: newId(), name: body.name, token: newToken() };
      const { room, now } = await withRoom(code, body.snapshot, (r, t) => {
        if (r.players.some((p) => p.id === player.id)) return false;
        addPlayer(r, player, t);
        return true;
      });
      return okView(room, player.id, now, { playerId: player.id, token: player.token });
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
      const seen = touch(r, me.id, t);
      if (op === "sync") return seen;
      applyAction(r, me.id, op as ActionOp, body, t, CATEGORIES);
      return true;
    });
    if (op === "leave" || !room.players.some((p) => p.id === playerId)) {
      return reply({ ok: false, error: "You left the room", gone: true });
    }
    return okView(room, playerId, now);
  } catch (err) {
    if (err instanceof GoneError) return reply({ ok: false, error: err.message, gone: true }, 404);
    if (err instanceof GameError) return reply({ ok: false, error: err.message }, 409);
    console.error("impostor api error", err);
    return reply({ ok: false, error: "Server error" }, 500);
  }
}
