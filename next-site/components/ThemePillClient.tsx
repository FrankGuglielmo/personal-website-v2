"use client";

import { useEffect, useState } from "react";
import IOSAppearanceIcon from "@/components/IOSAppearanceIcon";

export default function ThemePillClient({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldDark = stored ? stored === "dark" : prefersDark;
      setIsDark(shouldDark);
      document.documentElement.classList.toggle("dark", shouldDark);
    } catch {}
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      document.documentElement.classList.add("theme-animate");
      document.documentElement.classList.toggle("dark", next);
      document.documentElement.classList.toggle("light", !next);
      localStorage.setItem("theme", next ? "dark" : "light");
      window.setTimeout(() => document.documentElement.classList.remove("theme-animate"), 350);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle appearance"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 border border-white/40 glass liquid-pill ${className}`}
    >
      <span className={`inline-grid place-items-center rounded-full h-7 w-7 ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
        <IOSAppearanceIcon size={18} />
      </span>
      <span className="text-sm font-medium">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

