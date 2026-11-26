import { randomBytes, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import type { ActionOp, ApiResponse } from "@/app/taboo/_lib/types";
import { CARDS, CARD_BY_ID } from "./_lib/deck";
import {
  GameError,
  addPlayer,
  applyAction,
  createRoom,
  findByToken,
  tick,
  touch,
  viewFor,
  type DeckSource,
  type Room,
} from "./_lib/engine";
import { adoptSnapshot, getStore, openRoom, sealRoom } from "./_lib/store";

// Every room operation lives in this one handler so they share a function
// instance (and its memory) when no Redis store is configured.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deck: DeckSource = {
  ids: () => CARDS.map((c) => c.id),
  get: (id) => {
    const c = CARD_BY_ID.get(id);
    return c ? { id: c.id, word: c.word, taboo: c.taboo } : undefined;
  },
};

const ACTIONS: ReadonlySet<string> = new Set<ActionOp>([
  "setTeam", "setTeamName", "setSettings", "shuffleTeams", "start", "beginTurn", "correct", "skip", "buzz",
  "undo", "pause", "resume", "toggleResult", "confirmReview", "kick", "claimHost", "endGame", "newGame", "leave",
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
    view: viewFor(room, playerId, now, deck),
    snapshot: store.kind === "memory" ? sealRoom(room) : undefined,
    ...extra,
  });
}

class GoneError extends Error {}

/** Loads a room, runs `fn`, and saves with compare-and-set, retrying on races. */
async function withRoom<T>(
  code: string,
  snapshot: unknown,
  fn: (room: Room, now: number) => { changed: boolean; result: T },
): Promise<{ room: Room; now: number; result: T }> {
  const store = getStore();
  if (store.kind === "memory") {
    const snap = openRoom(snapshot, code);
    if (snap) await adoptSnapshot(snap);
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const room = await store.get(code);
    if (!room) throw new GoneError("Room not found. It may have expired.");
    const before = room.version;
    const now = Date.now();
    const ticked = tick(room, now);
    const { changed, result } = fn(room, now);
    if (ticked || changed) {
      room.version = before + 1;
      room.updatedAt = now;
      if (!(await store.put(room, before))) continue;
    }
    return { room, now, result };
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
        const host = { id: newId(), name: String(body.name ?? ""), token: newToken() };
        const room = createRoom(code, host, now);
        if (!(await store.put(room, null))) continue;
        return okView(room, host.id, now, { playerId: host.id, token: host.token });
      }
      return reply({ ok: false, error: "Couldn't create a room, try again" }, 503);
    }

    const code = normCode(body.code);
    if (code.length !== 4) return reply({ ok: false, error: "Room codes are 4 letters" }, 400);

    if (op === "join") {
      const player = { id: newId(), name: String(body.name ?? ""), token: newToken() };
      const { room, now } = await withRoom(code, body.snapshot, (r, t) => {
        addPlayer(r, player, t);
        return { changed: true, result: null };
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
      if (op === "sync") return { changed: seen, result: null };
      applyAction(r, me.id, op as ActionOp, body, t, deck);
      return { changed: true, result: null };
    });
    if (op === "leave" || !room.players.some((p) => p.id === playerId)) {
      return reply({ ok: false, error: "You left the room", gone: true });
    }
    return okView(room, playerId, now);
  } catch (err) {
    if (err instanceof GoneError) return reply({ ok: false, error: err.message, gone: true }, 404);
    if (err instanceof GameError) return reply({ ok: false, error: err.message }, 409);
    console.error("taboo api error", err);
    return reply({ ok: false, error: "Server error" }, 500);
  }
}
