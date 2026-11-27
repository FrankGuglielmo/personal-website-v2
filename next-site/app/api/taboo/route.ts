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
  normalizeRoom,
  repairRoom,
  tick,
  TOUCH_MS,
  viewFor,
  type DeckSource,
  type Room,
} from "./_lib/engine";
import { covers, mergeRooms, stampChanges } from "./_lib/merge";
import { getStore, openRoom, recallLocal, rememberLocal, sealRoom } from "./_lib/store";

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
  "undo", "pause", "resume", "toggleResult", "confirmReview", "kick", "transferHost", "claimHost", "endGame", "newGame", "leave",
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
    snapshot: store.kind !== "redis" ? sealRoom(room) : undefined,
    ...extra,
  });
}

/** The room isn't on this instance/store and no usable snapshot came with the request. Clients keep their session and retry. */
class MissingRoomError extends Error {}
/** The player was kicked or left. Clients drop their session. */
class RemovedError extends Error {}

/** Records that a player is still connected, at most once per TOUCH_MS. */
async function markSeen(room: Room, playerId: string, now: number) {
  const p = room.players.find((x) => x.id === playerId);
  if (!p || now - p.lastSeen < TOUCH_MS) return;
  p.lastSeen = now;
  await getStore().touch(room.code, playerId, now);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const upgrade = (r: Room | null) => (r ? normalizeRoom(r) : null);
const merge = (rooms: (Room | null)[]) => mergeRooms(rooms, (r) => repairRoom(normalizeRoom(r)));

/**
 * Builds the room from every copy this request can see (shared store, this
 * instance's memory, the caller's snapshot), runs `fn`, and writes the result
 * back whenever the shared copy is missing anything. Presence lives in its own
 * record (see markSeen), so a poll never writes the room.
 * See merge.ts for why there is no compare-and-set.
 */
async function withRoom(
  code: string,
  snapshot: unknown,
  fn: (room: Room, now: number) => boolean,
): Promise<{ room: Room; now: number }> {
  const store = getStore();
  const snap = upgrade(openRoom(snapshot, code));
  let stored = upgrade(await store.get(code));
  let room = merge([stored, upgrade(recallLocal(code)), snap]);
  // A missing room can be a brief cache miss; look again before giving up.
  for (let i = 0; !room && i < 3; i++) {
    await sleep(150 + i * 150);
    stored = upgrade(await store.get(code));
    room = merge([stored, upgrade(recallLocal(code))]);
  }
  if (!room) throw new MissingRoomError("Room not found. It may have expired.");
  const presence = await store.getPresence(code);
  for (const p of room.players) p.lastSeen = Math.max(p.lastSeen, presence[p.id] ?? 0);
  const now = Date.now();
  const before = structuredClone(room);
  const ticked = tick(room, now);
  if (fn(room, now) || ticked) stampChanges(before, room, now);
  if (!covers(stored, room)) {
    room.version += 1;
    room.updatedAt = now;
    await store.set(room);
  }
  rememberLocal(room);
  return { room, now };
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
        if (recallLocal(code) || (await store.get(code))) continue;
        const now = Date.now();
        const host = { id: newId(), name: String(body.name ?? ""), token: newToken() };
        const room = createRoom(code, host, now);
        room.gameAt = now;
        room.removed = [];
        for (const p of room.players) p.seatAt = now;
        await store.set(room);
        rememberLocal(room);
        await store.touch(code, host.id, now);
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
        return true;
      });
      await store.touch(code, player.id, now);
      return okView(room, player.id, now, { playerId: player.id, token: player.token });
    }

    const token = typeof body.token === "string" ? body.token : "";
    if (op !== "sync" && (typeof op !== "string" || !ACTIONS.has(op))) {
      return reply({ ok: false, error: "Unknown action" }, 400);
    }

    let playerId = "";
    const { room, now } = await withRoom(code, body.snapshot, (r, t) => {
      const me = findByToken(r, token);
      if (!me) throw new RemovedError("You're no longer in this room");
      playerId = me.id;
      if (op === "sync") return false;
      applyAction(r, me.id, op as ActionOp, body, t, deck);
      return true;
    });
    if (op === "leave" || !room.players.some((p) => p.id === playerId)) {
      return reply({ ok: false, error: "You left the room", gone: true, removed: true });
    }
    await markSeen(room, playerId, now);
    return okView(room, playerId, now);
  } catch (err) {
    if (err instanceof MissingRoomError) return reply({ ok: false, error: err.message, missing: true }, 404);
    if (err instanceof RemovedError) return reply({ ok: false, error: err.message, gone: true, removed: true }, 404);
    if (err instanceof GameError) return reply({ ok: false, error: err.message }, 409);
    console.error("taboo api error", err);
    return reply({ ok: false, error: "Server error" }, 500);
  }
}
