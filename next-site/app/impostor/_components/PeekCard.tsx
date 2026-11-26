"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import type { CardView } from "../_lib/types";
import { vibrate } from "./feedback";

const AUTO_HIDE_MS = 3000;

// Face-down and face-up states look identical for impostors and innocents
// (same size, same colors) so a glance from a neighbor gives nothing away.
export default function PeekCard({ card, compact = false }: { card: CardView; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    setOpen(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const show = useCallback(() => {
    setOpen(true);
    vibrate(25);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(hide, AUTO_HIDE_MS);
  }, [hide]);

  useEffect(() => {
    const onHide = () => hide();
    window.addEventListener("blur", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("blur", onHide);
      document.removeEventListener("visibilitychange", onHide);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [hide]);

  if (card.kind === "spectator") {
    return (
      <div className="rounded-3xl border border-white/30 bg-white/10 p-5 text-center text-black/60 [.dark_&]:text-white/70">
        You joined mid-round. You&apos;ll be dealt in next round. Watch and listen for now.
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={open ? "Release to hide your card" : "Press and hold to see your secret card"}
      onPointerDown={(e) => {
        e.preventDefault();
        show();
      }}
      onPointerUp={hide}
      onPointerCancel={hide}
      onPointerLeave={hide}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          show();
        }
      }}
      onKeyUp={hide}
      onBlur={hide}
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
      className={twMerge(
        "relative w-full border-rose-200/40 bg-gradient-to-br from-rose-600/85 via-red-700/85 to-rose-950/90 backdrop-blur-md select-none touch-none overflow-hidden rounded-3xl border text-white shadow-lg transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300",
        compact ? "h-36" : "h-60",
      )}
    >
      {open ? <Face card={card} compact={compact} /> : <Back compact={compact} />}
    </button>
  );
}

function Back({ compact }: { compact: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4">
      <div className={twMerge("font-black tracking-[0.3em] opacity-90", compact ? "text-2xl" : "text-4xl")}>? ? ?</div>
      <div className="text-sm font-semibold uppercase tracking-wider opacity-90">Press &amp; hold to peek</div>
      {!compact && <div className="text-xs opacity-70">Shield your screen. It hides when you let go.</div>}
    </div>
  );
}

function Face({ card, compact }: { card: Exclude<CardView, { kind: "spectator" }>; compact: boolean }) {
  const big = compact ? "text-2xl" : "text-3xl sm:text-4xl";
  if (card.kind === "impostor") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
        <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Category: {card.category}</div>
        <div className={twMerge("font-black leading-tight", big)}>You are the Impostor</div>
        <div className="text-sm opacity-90">
          {card.mode === "spyfall" ? "Blend in and figure out the location." : "Blend in and figure out the secret word."}
        </div>
        {card.fellows.length > 0 && <div className="text-sm opacity-90">Fellow impostor{card.fellows.length > 1 ? "s" : ""}: {card.fellows.join(", ")}</div>}
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
      <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Category: {card.category}</div>
      <div className="text-sm opacity-90">{card.mode === "spyfall" ? "The location is" : "The secret word is"}</div>
      <div className={twMerge("font-black leading-tight", big)}>{card.secret}</div>
      {card.role && <div className="text-sm opacity-90">Your role: {card.role}</div>}
    </div>
  );
}
