import type { ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import GlassPanel from "@/components/GlassPanel";
import type { Team } from "../_lib/types";

export function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <GlassPanel className={twMerge("p-4 sm:p-5", className)}>{children}</GlassPanel>;
}

type Tone = "primary" | "blue" | "red" | "good" | "ghost";

const tones: Record<Tone, string> = {
  primary: "bg-violet-600 text-white border-violet-400/60 hover:bg-violet-500",
  blue: "bg-blue-600 text-white border-blue-400/60 hover:bg-blue-500",
  red: "bg-rose-600 text-white border-rose-400/60 hover:bg-rose-500",
  good: "bg-emerald-600 text-white border-emerald-500/60 hover:bg-emerald-500",
  ghost: "glass border-white/40 text-[hsl(var(--color-text))] hover:shadow",
};

export function Btn({
  tone = "ghost",
  big = false,
  className = "",
  ...rest
}: { tone?: Tone; big?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={twMerge(
        "inline-flex select-none items-center justify-center gap-2 rounded-2xl border font-semibold shadow-sm transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))] touch-manipulation",
        big ? "min-h-[64px] px-5 text-lg" : "min-h-[44px] px-4 text-base",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}

export const inputCls =
  "w-full min-h-[48px] rounded-2xl border border-white/40 bg-white/50 px-4 text-base text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] [.dark_&]:bg-white/10 [.dark_&]:text-white [.dark_&]:placeholder:text-white/40";

export const muted = "text-[hsl(var(--color-muted))]";

export const teamText: Record<Team, string> = {
  blue: "text-blue-700 [.dark_&]:text-blue-300",
  red: "text-rose-700 [.dark_&]:text-rose-300",
};

export const teamChip: Record<Team, string> = {
  blue: "bg-blue-600 text-white",
  red: "bg-rose-600 text-white",
};
