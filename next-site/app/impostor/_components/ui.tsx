import type { ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import GlassPanel from "@/components/GlassPanel";

export function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <GlassPanel className={twMerge("p-4 sm:p-5", className)}>{children}</GlassPanel>;
}

type Tone = "primary" | "good" | "warn" | "bad" | "ghost";

const tones: Record<Tone, string> = {
  primary: "bg-blue-600 text-white border-blue-500/60 hover:bg-blue-500",
  good: "bg-emerald-600 text-white border-emerald-500/60 hover:bg-emerald-500",
  warn: "bg-amber-500 text-black border-amber-400/60 hover:bg-amber-400",
  bad: "bg-rose-600 text-white border-rose-500/60 hover:bg-rose-500",
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
        big ? "min-h-[72px] px-5 text-xl" : "min-h-[48px] px-4 text-base",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-sm text-black/60 [.dark_&]:text-white/70">{label}</div>
      <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-2xl border border-white/30 bg-white/10 p-1">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={twMerge(
              "min-h-[40px] flex-1 rounded-xl px-2 text-sm font-medium transition disabled:opacity-60",
              o.value === value ? "bg-white/70 text-black shadow [.dark_&]:bg-white/25 [.dark_&]:text-white" : "hover:bg-white/20",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const inputCls =
  "w-full min-h-[48px] rounded-2xl border border-white/40 bg-white/50 px-4 text-base text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-[hsl(var(--color-accent))] [.dark_&]:bg-white/10 [.dark_&]:text-white [.dark_&]:placeholder:text-white/40";
