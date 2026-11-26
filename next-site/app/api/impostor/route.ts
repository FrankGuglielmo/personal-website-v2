import { randomBytes, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import type { ActionOp, ApiResponse } from "@/app/impostor/_lib/types";
import { CATEGORIES } from "./_lib/packs";
import {
  GameError,
  ROOM_TTL_MS,
  addPlayer,
  applyOnce,
  createRoom,
  findByToken,
  tick,
  viewFor,
  type Presence,
  type Room,
} from "./_lib/engine";
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

function okView(room: Room, playerId: string, now: number, seen: Presence, extra: { playerId?: string; token?: string } = {}) {
  const store = getStore();
  return reply({
    ok: true,
    view: viewFor(room, playerId, now, CATEGORIES, seen),
    snapshot: store.kind === "redis" ? undefined : sealRoom(room),
    ...extra,
  });
}

class GoneError extends Error {
  constructor(message: string, readonly rejoin = false) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const BEAT_MS = 10_000;
const PRESENCE_READ_MS = 4_000;
const presenceMemo = new Map<string, { at: number; seen: Presence }>();

/** Presence for the view, recording a heartbeat for `me` every BEAT_MS. */
async function presence(code: string, me: string, now: number): Promise<Presence> {
  const store = getStore();
  let m = presenceMemo.get(code);
  try {
    if (!m || now - m.at > PRESENCE_READ_MS || (me && now - (m.seen[me] ?? 0) >= BEAT_MS)) {
      m = { at: now, seen: await store.getPresence(code) };
      if (me && now - (m.seen[me] ?? 0) >= BEAT_MS) {
        m.seen = { ...m.seen, [me]: now };
        await store.setPresence(code, m.seen);
      }
      if (presenceMemo.size > 500) presenceMemo.clear();
      presenceMemo.set(code, m);
    }
  } catch (err) {
    console.error("impostor presence error", err);
  }
  return m?.seen ?? {};
}

/**
 * Loads a room, runs `fn`, and saves when `fn` changed something.
 * Shared-cache reads can lag a write by a second or two, so polls never write
 * and timers are derived on read (see tick). The caller's sealed snapshot is
 * used only when the store has no copy; it must not mask a lost write, since
 * clients resend actions the stored room doesn't acknowledge.
 */
async function withRoom(
  code: string,
  snapshot: unknown,
  fn: (room: Room, now: number) => boolean,
  writing = false,
): Promise<{ room: Room; now: number }> {
  const store = getStore();
  const snap = store.kind === "redis" ? null : openRoom(snapshot, code);
  const snapFresh = snap && Date.now() - snap.updatedAt < ROOM_TTL_MS ? snap : null;
  // Each read may independently be a lagging copy, so a write starts from the
  // newest of a few reads. Polls only render, so one read is enough.
  const load = async () => {
    if (!writing || store.kind === "redis") return store.get(code);
    const rooms = await Promise.all([store.get(code), store.get(code), store.get(code)]);
    return rooms.reduce((a, b) => (!a || (b && b.version > a.version) ? b : a), null);
  };
  for (let attempt = 0; attempt < 5; attempt++) {
    let stored = await load();
    // A just-created room can take a moment to reach other instances.
    for (let i = 0; i < 2 && !stored && !snapFresh; i++) {
      await sleep(700);
      stored = await load();
    }
    const room = stored ?? (snapFresh ? structuredClone(snapFresh) : null);
    if (!room) throw new GoneError("Room not found. It may have expired.");
    const base = room.version;
    const now = Date.now();
    tick(room, now);
    if (!fn(room, now)) {
      // Restore a room the cache evicted (not one that is merely seconds old).
      if (!stored && now - room.updatedAt > 5_000) await store.put(room, base);
      return { room, now };
    }
    room.version = base + 1;
    room.updatedAt = now;
    if (!(await store.put(room, base))) continue;
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
        return okView(room, host.id, now, await presence(code, host.id, now), { playerId: host.id, token: host.token });
      }
      return reply({ ok: false, error: "Couldn't create a room, try again" }, 503);
    }

    const code = normCode(body.code);
    if (code.length !== 4) return reply({ ok: false, error: "Room codes are 4 letters" }, 400);

    if (op === "join") {
      // A client whose join was overwritten by a concurrent write rejoins with
      // the id and token it was given, so it keeps its seat and session.
      const rejoin =
        typeof body.playerId === "string" && /^[0-9a-f]{12}$/.test(body.playerId) &&
        typeof body.token === "string" && body.token.length >= 20 && body.token.length <= 64;
      const player = rejoin
        ? { id: body.playerId as string, name: body.name, token: body.token as string }
        : { id: newId(), name: body.name, token: newToken() };
      const { room, now } = await withRoom(code, body.snapshot, (r, t) => {
        if (r.kicked?.includes(player.id)) throw new GoneError("You were removed from this room");
        const existing = r.players.find((p) => p.id === player.id);
        if (existing) {
          if (existing.token !== player.token) throw new GameError("Couldn't rejoin this room");
          return false;
        }
        addPlayer(r, player, t);
        return true;
      }, true);
      return okView(room, player.id, now, await presence(code, player.id, now), { playerId: player.id, token: player.token });
    }

    const token = typeof body.token === "string" ? body.token : "";
    if (op !== "sync" && (typeof op !== "string" || !ACTIONS.has(op))) {
      return reply({ ok: false, error: "Unknown action" }, 400);
    }

    const actionId = typeof body.aid === "string" ? body.aid.slice(0, 32) : "";
    const claimedId = typeof body.playerId === "string" ? body.playerId : "";
    const seenForHost = op === "claimHost" ? await presence(code, "", Date.now()) : {};
    let playerId = "";
    const run = () =>
      withRoom(code, body.snapshot, (r, t) => {
        const me = findByToken(r, token);
        if (!me) throw new GoneError("You're no longer in this room", !!claimedId && !r.kicked?.includes(claimedId));
        playerId = me.id;
        if (op === "sync") return false;
        return applyOnce(r, me.id, actionId, op as ActionOp, body, t, CATEGORIES, seenForHost);
      }, op !== "sync");
    // A lagging read may not include a player who joined a moment ago.
    const { room, now } = await run().catch(async (err) => {
      if (!(err instanceof GoneError && err.rejoin)) throw err;
      await sleep(1000);
      return run();
    });
    if (op === "leave" || !room.players.some((p) => p.id === playerId)) {
      return reply({ ok: false, error: "You left the room", gone: true });
    }
    return okView(room, playerId, now, await presence(code, playerId, now));
  } catch (err) {
    if (err instanceof GoneError) return reply({ ok: false, error: err.message, gone: true, rejoin: err.rejoin || undefined }, 404);
    if (err instanceof GameError) return reply({ ok: false, error: err.message }, 409);
    console.error("impostor api error", err);
    return reply({ ok: false, error: "Server error" }, 500);
  }
}
