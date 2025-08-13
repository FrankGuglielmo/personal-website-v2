"use client";

import React, { useState } from "react";
import IconButton from "@/components/IconButton";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 bg-transparent">
      <div className="container mx-auto px-4 md:px-8 py-3">
        {/* Segmented glass nav */}
        <nav className="liquid-pill glass bg-white/20 dark:bg-white/10 border border-white/40 flex items-center justify-between px-3 py-2">
          <div className="hidden md:flex items-center gap-6">
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
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <IconButton ariaLabel="Open menu" className="md:hidden" onClick={()=>setOpen(v=>!v)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            </IconButton>
          </div>
        </nav>
      </div>
      {open && (
        <div className="md:hidden container mx-auto px-4">
          <div className="glass liquid-glass bg-white/20 dark:bg-white/10 rounded-2xl border border-white/40 p-3 mt-2">
            <a href="#projects" className="block px-3 py-2 rounded-xl hover:bg-surface/60">Projects</a>
            <a href="#experience" className="block px-3 py-2 rounded-xl hover:bg-surface/60">Experience</a>
            <a href="#technology" className="block px-3 py-2 rounded-xl hover:bg-surface/60">Tech</a>
          </div>
        </div>
      )}
    </header>
  );
}


