"use client";

import React from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

type Size = "sm" | "md" | "lg";
type Variant = "glass" | "solid";

type BaseProps = {
  size?: Size;
  variant?: Variant;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
};

type LinkProps = BaseProps & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "className">;
type ButtonProps = BaseProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & { href?: never };

const sizeMap: Record<Size, { pad: string; text: string; gap: string }> = {
  sm: { pad: "px-3 py-2", text: "text-sm", gap: "gap-2" },
  md: { pad: "px-5 py-3", text: "text-base", gap: "gap-3" },
  lg: { pad: "px-7 py-4", text: "text-lg", gap: "gap-4" },
};

const base = "inline-flex items-center liquid-pill border rounded-full select-none transition-colors";
const variantMap: Record<Variant, string> = {
  glass: "glass bg-white/20 dark:bg-white/10 border-white/40 hover:bg-white/30 dark:hover:bg-white/15",
  solid: "bg-surface border-border hover:bg-surface/80",
};

export default function Pill(props: LinkProps | ButtonProps) {
  const { size = "md", variant = "glass", className = "", leftIcon, rightIcon, children } = props as BaseProps;
  const cls = twMerge(base, variantMap[variant], sizeMap[size].pad, sizeMap[size].text, sizeMap[size].gap, className);

  if ("href" in props && (props as LinkProps).href) {
    const link = props as LinkProps;
    return (
      <Link
        href={link.href}
        className={cls}
        target={link.target}
        rel={link.rel}
        onClick={link.onClick}
        title={link.title}
        download={link.download}
      >
        {leftIcon ? <span aria-hidden>{leftIcon}</span> : null}
        <span className="font-medium">{children}</span>
        {rightIcon ? <span aria-hidden>{rightIcon}</span> : null}
      </Link>
    );
  }

  const btn = props as ButtonProps;
  return (
    <button
      className={cls}
      type={btn.type}
      onClick={btn.onClick}
      disabled={btn.disabled}
      title={btn.title}
      autoFocus={btn.autoFocus}
      name={btn.name}
      value={btn.value}
      form={btn.form}
      formAction={btn.formAction}
    >
      {leftIcon ? <span aria-hidden>{leftIcon}</span> : null}
      <span className="font-medium">{children}</span>
      {rightIcon ? <span aria-hidden>{rightIcon}</span> : null}
    </button>
  );
}


