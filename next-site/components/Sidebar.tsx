"use client";

import { useEffect, useMemo, useState } from "react";
// import ThemeToggle from "@/components/ThemeToggle";
import LockCircle from "@/components/LockCircle";
import WeatherGauge from "@/components/WeatherGauge";
import ThemePillClient from "@/components/ThemePillClient";

type NavItem = { href: string; label: string; path: string; id: string };

export default function Sidebar() {
  const items: Array<NavItem> = useMemo(
    () => [
      { href: "#home", id: "home", label: "Home", path: "M12 3l9 8h-3v8h-5v-5H11v5H6v-8H3z" },
      { href: "#projects", id: "projects", label: "Projects", path: "M3 6h18v4H3zM3 14h18v4H3z" },
      { href: "#experience", id: "experience", label: "Experience", path: "M4 7h16v11H4zM8 7V5h8v2" },
    ],
    []
  );

  const [activeId, setActiveId] = useState<string>(items[0].id);

  useEffect(() => {
    const sectionElements = items
      .map((i) => document.getElementById(i.id))
      .filter(Boolean) as HTMLElement[];
    if (sectionElements.length === 0) return;

    // Track visibility ratio for all sections and always pick the max.
    const visibilityByIdRef = new Map<string, number>(
      items.map((it) => [it.id, 0])
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionId = (entry.target as HTMLElement).id;
          const ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
          visibilityByIdRef.set(sectionId, ratio);
        }

        let bestId = items[0]?.id ?? "";
        let bestRatio = -1;
        for (const [id, ratio] of visibilityByIdRef) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestId) setActiveId(bestId);
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <aside className="hidden lg:block fixed left-4 top-4 bottom-4 z-[999]">
      <nav className="glass liquid-glass border rounded-3xl h-full w-80 px-3.5 py-4 flex flex-col">
        <div className="px-1 pb-4">
          <div className="text-3xl font-semibold tracking-tight leading-none">FrankGuglielmo.com</div>
        </div>
        <div className="flex-1 overflow-auto">
          <ul className="flex flex-col divide-y divide-white/25">
            {items.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setActiveId(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      "group flex items-center gap-4 px-3 py-4 rounded-xl transition-colors " +
                      (isActive ? "bg-white/15 text-white shadow-inner" : "hover:bg-white/10")
                    }
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d={item.path} />
                    </svg>
                    <span className="text-lg">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
          <div className="flex items-center justify-center gap-3">
            <LockCircle city="SF" timeZone="America/Los_Angeles" sizePx={84} />
            <LockCircle city="NYC" timeZone="America/New_York" sizePx={84} />
            <WeatherGauge sizePx={84} />
          </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <ThemePillClient />
        </div>
      </nav>
    </aside>
  );
}


