import React from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  className?: string;
  variant?: "glass" | "solid";
  density?: "compact" | "comfortable" | "spacious";
  header?: React.ReactNode; // top row: title, pills, icons
  footer?: React.ReactNode; // bottom row: actions, metadata
  children?: React.ReactNode; // content body
};

export default function Card({ className = "", variant = "glass", density = "comfortable", header, footer, children }: Props) {
  const base = variant === "glass" ? "glass liquid-glass bg-white/10 dark:bg-white/5 border" : "bg-surface border border-border";
  const pad = density === "compact" ? "pad-compact" : density === "spacious" ? "pad-spacious" : "pad-comfortable";
  return (
    <section className={twMerge("rounded-3xl", base, pad, className)}>
      {header && <div className="mb-3">{header}</div>}
      {children}
      {footer && <div className="mt-4">{footer}</div>}
    </section>
  );
}


