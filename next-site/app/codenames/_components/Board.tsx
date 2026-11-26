"use client";

import { FaCheck, FaSkull, FaUser, FaUserSecret } from "react-icons/fa";
import { twMerge } from "tailwind-merge";
import type { CardColor, CardView } from "../_lib/types";

/**
 * - "board": the TV / operative view. Unrevealed cards are plain glass.
 * - "key": the spymaster view. Every card shows its color; revealed ones are dimmed.
 */
export type BoardMode = "board" | "key";

const solid: Record<CardColor, string> = {
  blue: "bg-blue-600 text-white border-blue-300/60",
  red: "bg-rose-600 text-white border-rose-300/60",
  neutral: "bg-[#eadfc8] text-stone-800 border-stone-300/70 [.dark_&]:bg-stone-500 [.dark_&]:text-white [.dark_&]:border-stone-400/60",
  assassin: "bg-neutral-900 text-white border-neutral-500",
};

const outlined: Record<CardColor, string> = {
  blue: "bg-blue-600/60 text-white border-blue-300 border-dashed",
  red: "bg-rose-600/60 text-white border-rose-300 border-dashed",
  neutral: "bg-stone-400/50 text-stone-900 border-stone-300 border-dashed [.dark_&]:text-white",
  assassin: "bg-neutral-900/70 text-white border-neutral-900 border-dashed",
};

const colorName: Record<CardColor, string> = {
  blue: "blue agent",
  red: "red agent",
  neutral: "bystander",
  assassin: "assassin",
};

function Icon({ color, className }: { color: CardColor; className?: string }) {
  if (color === "assassin") return <FaSkull className={className} aria-hidden />;
  if (color === "neutral") return <FaUser className={className} aria-hidden />;
  return <FaUserSecret className={className} aria-hidden />;
}

export default function Board({
  cards,
  mode,
  selected = null,
  onTap,
  fill = false,
}: {
  cards: CardView[];
  mode: BoardMode;
  selected?: number | null;
  onTap?: (index: number) => void;
  /** Stretch rows to fill the parent's height (TV layout) instead of using a fixed aspect. */
  fill?: boolean;
}) {
  return (
    <div
      className={twMerge("grid w-full grid-cols-5 gap-[clamp(4px,1vmin,12px)]", fill && "h-full grid-rows-5")}
      role="group"
      aria-label="Word board"
    >
      {cards.map((card, i) => {
        const c = card.color;
        const isSel = selected === i && !card.revealed;
        let tone: string;
        if (card.revealed && c) tone = twMerge(solid[c], mode === "key" && "opacity-35");
        else if (c) tone = mode === "key" ? solid[c] : outlined[c];
        else tone = "glass border-white/50 text-[hsl(var(--color-text))]";
        const clickable = !!onTap && !card.revealed;
        const len = Math.max(card.word.length, 6);
        const label = `${card.word}${c ? `, ${colorName[c]}` : ""}${card.revealed ? ", revealed" : ""}`;
        return (
          <button
            key={i}
            type="button"
            aria-label={label}
            aria-pressed={isSel}
            disabled={!clickable}
            onClick={() => onTap?.(i)}
            className={twMerge(
              "relative flex min-w-0 select-none items-center justify-center overflow-hidden rounded-[clamp(6px,1.4vmin,18px)] border px-1 text-center font-bold uppercase tracking-wide shadow-sm transition touch-manipulation",
              !fill && "aspect-[4/3]",
              clickable && "cursor-pointer active:scale-[0.97] hover:brightness-110",
              !clickable && "cursor-default",
              isSel && "z-[1] scale-[1.04] ring-4 ring-amber-400 ring-offset-2 ring-offset-transparent",
              tone,
            )}
            style={{ containerType: "size" }}
          >
            {(card.revealed || (c && mode === "key")) && c && (
              <Icon
                color={c}
                className={twMerge(
                  "absolute left-[6%] top-[8%] h-[22cqh] w-[22cqh] opacity-80",
                  card.revealed && mode === "board" && "left-1/2 top-[12%] h-[34cqh] w-[34cqh] -translate-x-1/2 opacity-90",
                )}
              />
            )}
            {card.revealed && mode === "key" && (
              <FaCheck className="absolute right-[6%] top-[8%] h-[20cqh] w-[20cqh]" aria-hidden />
            )}
            <span
              className={twMerge(
                "block max-w-full leading-none",
                card.revealed && mode === "board" && "mt-[38cqh] opacity-90",
                card.revealed && mode === "key" && "line-through",
              )}
              style={{
                fontSize: card.revealed && mode === "board"
                  ? `min(${100 / len}cqw, 20cqh)`
                  : `min(${120 / len}cqw, 30cqh)`,
              }}
            >
              {card.word}
            </span>
          </button>
        );
      })}
    </div>
  );
}
