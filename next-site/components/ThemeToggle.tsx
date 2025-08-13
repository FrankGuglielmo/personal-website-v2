"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldDark = stored ? stored === "dark" : prefersDark;
      setIsDark(shouldDark);
      if (shouldDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      // Add transient animation class to enable smooth cross-fade
      document.documentElement.classList.add("theme-animate");
      if (next) {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        localStorage.setItem("theme", "light");
      }
      // Remove the animation class after the transition window
      window.setTimeout(() => {
        document.documentElement.classList.remove("theme-animate");
      }, 350);
    } catch {}
  };

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={toggle}
      className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm bg-[color-mix(in_hsl,white_10%,transparent)] border border-[--color-border] ${className}`}
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}


