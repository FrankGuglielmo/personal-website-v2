import React from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  variant?: "subtle" | "solid" | "glass" | "destructive";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode; // SVG icon
  ariaLabel: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const sizeMap = {
  sm: "h-8 w-8 text-[16px]",
  md: "h-10 w-10 text-[18px]",
  lg: "h-12 w-12 text-[20px]",
};

const base = "inline-grid place-items-center rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

const variantMap = {
  subtle: "bg-surface/60 border border-border hover:bg-surface/80 active:scale-[0.98]",
  solid: "bg-surface border border-border hover:bg-surface/90 active:scale-[0.98]",
  glass: "glass border border-white/40 hover:shadow active:scale-[0.98]",
  destructive: "bg-red-500/90 text-white hover:bg-red-500 active:scale-[0.98]",
};

export default function IconButton({ variant = "subtle", size = "md", className = "", children, ariaLabel, ...rest }: Props) {
  const cls = twMerge(base, sizeMap[size], variantMap[variant], className);
  return (
    <button aria-label={ariaLabel} className={cls} {...rest}>
      <span className="pointer-events-none" aria-hidden>
        {children}
      </span>
    </button>
  );
}


