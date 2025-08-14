"use client";

import React, { useEffect, useRef, useState } from "react";
import IconButton from "@/components/IconButton";
import ThemeToggle from "@/components/ThemeToggle";
import IOSAppearanceIcon from "@/components/IOSAppearanceIcon";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeId, setActiveId] = useState<string>("home");
  const navRef = useRef<HTMLDivElement | null>(null);
  const homeRef = useRef<HTMLAnchorElement | null>(null);
  const projectsRef = useRef<HTMLAnchorElement | null>(null);
  const experienceRef = useRef<HTMLAnchorElement | null>(null);
  const settingsRef = useRef<HTMLAnchorElement | null>(null);
  const userSelectTsRef = useRef<number>(0);
  const [indicator, setIndicator] = useState<{ left: number; top: number; width: number; height: number; visible: boolean }>({ left: 0, top: 0, width: 0, height: 0, visible: false });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldDark = stored ? stored === "dark" : prefersDark;
      setIsDark(shouldDark);
      document.documentElement.classList.toggle("dark", shouldDark);
      document.documentElement.classList.toggle("light", !shouldDark);
    } catch {}
  }, []);

  const toggleTheme = () => {
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

  // Track which section is closest to viewport center, responsive to clicks and scroll
  useEffect(() => {
    let raf = 0;
    const updateFromScroll = () => {
      if (Date.now() - userSelectTsRef.current < 600) return; // temporary user override
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const ids = ["home", "projects", "experience"] as const;
        let bestId: typeof ids[number] = "home";
        let bestDist = Number.POSITIVE_INFINITY;
        const viewportCenter = window.innerHeight / 2;
        for (const id of ids) {
          const el = document.getElementById(id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const mid = rect.top + rect.height / 2;
          const dist = Math.abs(mid - viewportCenter);
          if (dist < bestDist) {
            bestDist = dist;
            bestId = id;
          }
        }
        setActiveId(bestId);
      });
    };

    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);
    updateFromScroll();
    return () => {
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Animate indicator to active item
  useEffect(() => {
    const map: Record<string, HTMLAnchorElement | null> = {
      home: homeRef.current,
      projects: projectsRef.current,
      experience: experienceRef.current,
      settings: settingsRef.current,
    };
    const activeEl = map[activeId];
    const navEl = navRef.current;
    if (!activeEl || !navEl) {
      setIndicator((i) => ({ ...i, visible: false }));
      return;
    }
    const navRect = navEl.getBoundingClientRect();
    const rect = activeEl.getBoundingClientRect();
    const padX = 10; // expand highlight horizontally
    const padY = 6;  // expand highlight vertically
    const left = rect.left - navRect.left - padX / 2;
    const top = rect.top - navRect.top - padY / 2;
    setIndicator({ left, top, width: rect.width + padX, height: rect.height + padY, visible: true });
  }, [activeId]);
  return (
    <header className="z-[999] relative">
      {/* iPad/Desktop top nav */}
      <div className="hidden md:flex lg:hidden container mx-auto justify-center px-4 sticky top-2 z-[999]">
        {/* Compact frosted nav */}
        <nav className="glass liquid-pill border px-2 py-1.5 rounded-full flex items-center justify-between gap-4">
          <div className="hidden md:flex items-center gap-4">
            <a href="#home" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 8h-3v8h-5v-5H11v5H6v-8H3z"/></svg>
              <span className="text-sm">Home</span>
            </a>
            <a href="#projects" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18v4H3zM3 14h18v4H3z"/></svg>
              <span className="text-sm">Projects</span>
            </a>
            <a href="#experience" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 7h16v11H4zM8 7V5h8v2"/></svg>
              <span className="text-sm">Experience</span>
            </a>
            <a href="#technology" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4.5L19 21l-7-4-7 4 2.5-7.5L2 9h7z"/></svg>
              <span className="text-sm">Tech</span>
            </a>
            <a href="#settings" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94a7.5 7.5 0 0 0 .06-1 7.5 7.5 0 0 0-.06-1l2.03-1.58-2-3.46-2.39.96a7.38 7.38 0 0 0-1.73-1L14.5 2h-5l-.55 2.86a7.38 7.38 0 0 0-1.73 1l-2.39-.96-2 3.46L4.86 11a7.5 7.5 0 0 0 0 2l-2.03 1.58 2 3.46 2.39-.96c.54.42 1.11.77 1.73 1l.55 2.92h5l.55-2.92c.62-.23 1.19-.58 1.73-1l2.39.96 2-3.46zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z"/></svg>
              <span className="text-sm">Settings</span>
            </a>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <IconButton ariaLabel="Open menu" size="sm" className="md:hidden" onClick={()=>setOpen(v=>!v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            </IconButton>
          </div>
        </nav>
      </div>
      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-2 left-0 right-0 flex justify-center px-4 pointer-events-none z-[999]">
        <nav ref={navRef} className="relative pointer-events-auto glass liquid-pill border px-3 py-2 rounded-full w-full max-w-md flex items-center justify-between">
          {indicator.visible && (
            <span
              aria-hidden
              className="absolute rounded-2xl bg-white/25 dark:bg-white/20 border border-white/40 backdrop-blur-sm shadow-md transition-all duration-300 ease-out"
              style={{ left: indicator.left, top: indicator.top, width: indicator.width, height: indicator.height }}
            />
          )}
          {/* 1: Home */}
          <a
            ref={homeRef}
            href="#home"
            aria-current={activeId === "home" ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              userSelectTsRef.current = Date.now();
              setActiveId("home");
              document.getElementById("home")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={"relative z-[1] flex flex-col items-center px-2 py-1 rounded-xl text-[11px] transition-colors hover:bg-white/10"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 8h-3v8h-5v-5H11v5H6v-8H3z"/></svg>
            <span>Home</span>
          </a>
          {/* 2: Projects */}
          <a
            ref={projectsRef}
            href="#projects"
            aria-current={activeId === "projects" ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              userSelectTsRef.current = Date.now();
              setActiveId("projects");
              document.getElementById("projects")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={"relative z-[1] flex flex-col items-center px-2 py-1 rounded-xl text-[11px] transition-colors hover:bg-white/10"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18v4H3zM3 14h18v4H3z"/></svg>
            <span>Projects</span>
          </a>
          {/* 3: Work */}
          <a
            ref={experienceRef}
            href="#experience"
            aria-current={activeId === "experience" ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              userSelectTsRef.current = Date.now();
              setActiveId("experience");
              document.getElementById("experience")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={"relative z-[1] flex flex-col items-center px-2 py-1 rounded-xl text-[11px] transition-colors hover:bg-white/10"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 7h16v11H4zM8 7V5h8v2"/></svg>
            <span>Work</span>
          </a>
          {/* 4: Settings (moved to 4th slot) */}
          <a
            ref={settingsRef}
            href="#settings"
            onClick={(e) => {
              e.preventDefault();
              userSelectTsRef.current = Date.now();
              setActiveId("settings");
              document.getElementById("settings")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            aria-current={activeId === "settings" ? "page" : undefined}
            className={"relative z-[1] flex flex-col items-center px-2 py-1 rounded-xl text-[11px] transition-colors hover:bg-white/10"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94a7.5 7.5 0 0 0 .06-1 7.5 7.5 0 0 0-.06-1l2.03-1.58-2-3.46-2.39.96a7.38 7.38 0 0 0-1.73-1L14.5 2h-5l-.55 2.86a7.38 7.38 0 0 0-1.73 1l-2.39-.96-2 3.46L4.86 11a7.5 7.5 0 0 0 0 2l-2.03 1.58 2 3.46 2.39-.96c.54.42 1.11.77 1.73 1l.55 2.92h5l.55-2.92c.62-.23 1.19-.58 1.73-1l2.39.96 2-3.46zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z"/></svg>
            <span>Settings</span>
          </a>
          {/* 5: Dark mode toggle icon */}
          <button type="button" onClick={toggleTheme} aria-label="Toggle dark mode" className="flex flex-col items-center px-2 py-1 rounded-xl hover:bg-white/10 text-[11px]">
            <span className={`inline-grid place-items-center rounded-full h-7 w-7 ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
              <IOSAppearanceIcon size={18} />
            </span>
            <span>{isDark ? "Dark" : "Light"}</span>
          </button>
        </nav>
      </div>
      {open && (
        <div className="md:hidden container mx-auto px-4">
          <div className="glass liquid-glass bg-white/20 dark:bg-white/10 rounded-2xl border border-white/40 p-3 mt-2">
            <a href="#projects" className="block px-3 py-2 rounded-xl hover:bg-surface/60">Projects</a>
            <a href="#experience" className="block px-3 py-2 rounded-xl hover:bg-surface/60">Experience</a>
            <a href="#settings" className="block px-3 py-2 rounded-xl hover:bg-surface/60">Settings</a>
          </div>
        </div>
      )}
    </header>
  );
}


