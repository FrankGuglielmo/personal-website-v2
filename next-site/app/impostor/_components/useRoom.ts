"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResponse, RoomView } from "../_lib/types";

export type Session = { code: string; playerId: string; token: string };

const sessionKey = (code: string) => `impostor:session:${code}`;
const snapKey = (code: string) => `impostor:snap:${code}`;
const LAST_KEY = "impostor:last";
// The shared store can briefly serve an older room, so a write can be lost to a
// concurrent one. Actions carry an id; if the room hasn't applied it after
// RESEND_MS the client sends it again (the server applies each id once).
const RESEND_MS = 3000;
const MAX_TRIES = 3;
const newActionId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

type Pending = { aid: string; op: string; args: Record<string, unknown>; sentAt: number; tries: number };

export function loadSession(code: string): Session | null {
  try {
    const raw = localStorage.getItem(sessionKey(code));
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function lastRoomCode(): string | null {
  try {
    return localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

function saveSession(s: Session) {
  try {
    localStorage.setItem(sessionKey(s.code), JSON.stringify(s));
    localStorage.setItem(LAST_KEY, s.code);
  } catch {}
}

function clearSession(code: string) {
  try {
    localStorage.removeItem(sessionKey(code));
    localStorage.removeItem(snapKey(code));
    if (localStorage.getItem(LAST_KEY) === code) localStorage.removeItem(LAST_KEY);
  } catch {}
}

async function post(body: Record<string, unknown>): Promise<{ res: ApiResponse; rtt: number; receivedAt: number }> {
  const sentAt = Date.now();
  const r = await fetch("/api/impostor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const receivedAt = Date.now();
  let res: ApiResponse;
  try {
    res = (await r.json()) as ApiResponse;
  } catch {
    res = { ok: false, error: `Server error (${r.status})` };
  }
  return { res, rtt: receivedAt - sentAt, receivedAt };
}

/** Owns the session, polling loop, and server clock offset for one room. */
export function useRoom() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<RoomView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const snapshotRef = useRef<string | undefined>(undefined);
  const offsetRef = useRef(0);
  const samplesRef = useRef<{ rtt: number; offset: number }[]>([]);
  const sessionRef = useRef<Session | null>(null);
  const versionRef = useRef(0);
  const pendingRef = useRef<Pending[]>([]);
  const nameRef = useRef("");
  const rejoinRef = useRef<Promise<boolean> | null>(null);
  sessionRef.current = session;

  const absorb = useCallback((res: ApiResponse, rtt: number, receivedAt: number, s: Session) => {
    if (!res.ok) return false;
    const offset = res.view.serverNow + rtt / 2 - receivedAt;
    const samples = [...samplesRef.current, { rtt, offset }].slice(-10);
    samplesRef.current = samples;
    offsetRef.current = samples.reduce((best, x) => (x.rtt < best.rtt ? x : best)).offset;
    if (res.snapshot) {
      snapshotRef.current = res.snapshot;
      try {
        localStorage.setItem(snapKey(s.code), res.snapshot);
      } catch {}
    }
    if (res.view.version >= versionRef.current) {
      versionRef.current = res.view.version;
      setView(res.view);
    }
    const acks = res.view.acks ?? [];
    if (pendingRef.current.length) pendingRef.current = pendingRef.current.filter((p) => !acks.includes(p.aid));
    nameRef.current = res.view.players.find((p) => p.id === res.view.meId)?.name ?? nameRef.current;
    setOffline(false);
    return true;
  }, []);

  const leaveLocal = useCallback((code: string, message: string | null) => {
    clearSession(code);
    setSession(null);
    setView(null);
    versionRef.current = 0;
    snapshotRef.current = undefined;
    pendingRef.current = [];
    setError(message);
  }, []);

  /** Takes our seat back after a concurrent write dropped our join. */
  const rejoin = useCallback(
    (s: Session) => {
      rejoinRef.current ??= (async () => {
        try {
          const { res, rtt, receivedAt } = await post({
            op: "join",
            code: s.code,
            name: nameRef.current,
            playerId: s.playerId,
            token: s.token,
            snapshot: snapshotRef.current,
          });
          return absorb(res, rtt, receivedAt, s);
        } catch {
          return true;
        } finally {
          setTimeout(() => (rejoinRef.current = null), 2000);
        }
      })();
      return rejoinRef.current;
    },
    [absorb],
  );

  const enter = useCallback(
    async (op: "create" | "join", name: string, code?: string) => {
      setBusy(true);
      setError(null);
      try {
        const { res, rtt, receivedAt } = await post({ op, name, code });
        if (!res.ok || !res.playerId || !res.token) {
          setError(res.ok ? "Something went wrong" : res.error);
          return;
        }
        const s = { code: res.view.code, playerId: res.playerId, token: res.token };
        saveSession(s);
        versionRef.current = 0;
        setSession(s);
        absorb(res, rtt, receivedAt, s);
        const url = new URL(window.location.href);
        url.searchParams.set("room", s.code);
        window.history.replaceState(null, "", url.toString());
      } catch {
        setError("Couldn't reach the server. Check your connection.");
      } finally {
        setBusy(false);
      }
    },
    [absorb],
  );

  const resume = useCallback((s: Session) => {
    pendingRef.current = [];
    try {
      snapshotRef.current = localStorage.getItem(snapKey(s.code)) ?? undefined;
    } catch {}
    versionRef.current = 0;
    setSession(s);
  }, []);

  const request = useCallback(
    async (s: Session, op: string, args: Record<string, unknown>, pending: Pending | null) => {
      const drop = () => {
        if (pending) pendingRef.current = pendingRef.current.filter((p) => p !== pending);
      };
      try {
        const { res, rtt, receivedAt } = await post({
          ...args,
          op,
          code: s.code,
          token: s.token,
          playerId: s.playerId,
          aid: pending?.aid,
          snapshot: snapshotRef.current,
        });
        if (!res.ok) {
          if (res.error.includes("busy")) return false;
          drop();
          if (res.gone && op !== "leave" && res.rejoin && (await rejoin(s))) return false;
          if (res.gone) leaveLocal(s.code, op === "leave" ? null : res.error);
          else if (res.error !== "stale" && op !== "sync" && (!pending || pending.tries === 1)) setError(res.error);
          return false;
        }
        if (op !== "sync" && pending?.tries === 1) setError(null);
        return absorb(res, rtt, receivedAt, s);
      } catch {
        setOffline(true);
        return false;
      }
    },
    [absorb, leaveLocal, rejoin],
  );

  const send = useCallback(
    async (op: string, args: Record<string, unknown> = {}) => {
      const s = sessionRef.current;
      if (!s) return false;
      let pending: Pending | null = null;
      if (op !== "sync") {
        pending = { aid: newActionId(), op, args, sentAt: Date.now(), tries: 1 };
        pendingRef.current = [...pendingRef.current, pending];
      }
      return request(s, op, args, pending);
    },
    [request],
  );

  const resendLost = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    const now = Date.now();
    for (const p of pendingRef.current) {
      if (now - p.sentAt < RESEND_MS) continue;
      if (p.tries >= MAX_TRIES) {
        pendingRef.current = pendingRef.current.filter((x) => x !== p);
        continue;
      }
      p.tries += 1;
      p.sentAt = now;
      await request(s, p.op, p.args, p);
    }
  }, [request]);

  useEffect(() => {
    if (!session) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let gen = 0;
    const loop = async (g: number) => {
      await send("sync");
      await resendLost();
      if (stopped || g !== gen) return;
      timer = setTimeout(() => loop(g), document.hidden ? 5000 : 1000);
    };
    loop(gen);
    const onVisible = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        loop(++gen);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session, send, resendLost]);

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  return { session, view, error, setError, offline, busy, enter, resume, send, serverNow, leaveLocal };
}
