"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResponse, RoomView } from "../_lib/types";

export type Session = { code: string; playerId: string; token: string };

const sessionKey = (code: string) => `codenames:session:${code}`;
const snapKey = (code: string) => `codenames:snap:${code}`;
const LAST_KEY = "codenames:last";

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

async function post(body: Record<string, unknown>): Promise<ApiResponse> {
  const r = await fetch("/api/codenames", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  try {
    return (await r.json()) as ApiResponse;
  } catch {
    return { ok: false, error: `Server error (${r.status})` };
  }
}

/** Owns the session and polling loop for one room. */
export function useRoom() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<RoomView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const snapshotRef = useRef<string | undefined>(undefined);
  const sessionRef = useRef<Session | null>(null);
  const versionRef = useRef(0);
  sessionRef.current = session;

  const absorb = useCallback((res: ApiResponse, s: Session) => {
    if (!res.ok) return false;
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
    setOffline(false);
    return true;
  }, []);

  const leaveLocal = useCallback((code: string, message: string | null) => {
    clearSession(code);
    setSession(null);
    setView(null);
    versionRef.current = 0;
    snapshotRef.current = undefined;
    setError(message);
  }, []);

  const enter = useCallback(
    async (op: "create" | "join", name?: string, code?: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await post({ op, name, code });
        if (!res.ok || !res.playerId || !res.token) {
          setError(res.ok ? "Something went wrong" : res.error);
          return;
        }
        const s = { code: res.view.code, playerId: res.playerId, token: res.token };
        saveSession(s);
        versionRef.current = 0;
        setSession(s);
        absorb(res, s);
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
    try {
      snapshotRef.current = localStorage.getItem(snapKey(s.code)) ?? undefined;
    } catch {}
    versionRef.current = 0;
    setSession(s);
  }, []);

  const send = useCallback(
    async (op: string, args: Record<string, unknown> = {}) => {
      const s = sessionRef.current;
      if (!s) return false;
      try {
        const res = await post({ op, code: s.code, token: s.token, snapshot: snapshotRef.current, ...args });
        if (!res.ok) {
          if (res.gone) leaveLocal(s.code, op === "leave" ? null : res.error);
          else if (op !== "sync") setError(res.error);
          return false;
        }
        if (op !== "sync") setError(null);
        return absorb(res, s);
      } catch {
        setOffline(true);
        return false;
      }
    },
    [absorb, leaveLocal],
  );

  useEffect(() => {
    if (!session) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let gen = 0;
    const loop = async (g: number) => {
      await send("sync");
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
  }, [session, send]);

  return { session, view, error, setError, offline, busy, enter, resume, send, leaveLocal };
}

/** Keeps the screen awake while in a room (best-effort; re-acquired on return). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        if (document.visibilityState !== "visible" || cancelled) return;
        lock = await navigator.wakeLock.request("screen");
      } catch {}
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}
