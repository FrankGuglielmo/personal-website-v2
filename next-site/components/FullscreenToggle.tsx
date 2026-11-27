"use client";

import { useEffect, useState } from "react";

type FsDoc = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FsEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function isFullscreenEnabled() {
  const d = document as FsDoc;
  return Boolean(d.fullscreenEnabled || d.webkitFullscreenEnabled);
}

function fullscreenElement() {
  const d = document as FsDoc;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

async function requestFullscreen() {
  const el = document.documentElement as FsEl;
  if (el.requestFullscreen) {
    try {
      await el.requestFullscreen({ navigationUI: "hide" });
    } catch {
      await el.requestFullscreen();
    }
    return;
  }
  if (el.webkitRequestFullscreen) await Promise.resolve(el.webkitRequestFullscreen());
}

async function exitFullscreen() {
  const d = document as FsDoc;
  if (d.exitFullscreen && d.fullscreenElement) {
    await d.exitFullscreen();
    return;
  }
  if (d.webkitExitFullscreen && d.webkitFullscreenElement) {
    await Promise.resolve(d.webkitExitFullscreen());
  }
}

const fsCss = `
html:fullscreen,
html:-webkit-full-screen {
  width: 100%;
  height: 100%;
  background-color: var(--page-bg, #000);
}
html:fullscreen body,
html:-webkit-full-screen body {
  min-height: 100%;
  height: 100%;
  background-color: var(--page-bg, #000);
}
html:fullscreen header[class*="z-[999]"],
html:-webkit-full-screen header[class*="z-[999]"],
html:fullscreen aside.fixed,
html:-webkit-full-screen aside.fixed {
  display: none !important;
}
html:fullscreen .site-content,
html:-webkit-full-screen .site-content {
  padding-left: 0 !important;
}
html:fullscreen .party-game-shell,
html:-webkit-full-screen .party-game-shell {
  padding: 0 !important;
}
`;

export default function FullscreenToggle({ className = "" }: { className?: string }) {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setSupported(isFullscreenEnabled());
    const sync = () => setActive(Boolean(fullscreenElement()));
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  if (!supported) return null;

  const label = active ? "Exit full screen" : "Full screen";

  return (
    <>
      <style>{fsCss}</style>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={() => void (active ? exitFullscreen() : requestFullscreen()).catch(() => {})}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl px-3 py-2 text-sm bg-[color-mix(in_hsl,white_10%,transparent)] border border-[--color-border] ${className}`}
      >
        {label}
      </button>
    </>
  );
}
