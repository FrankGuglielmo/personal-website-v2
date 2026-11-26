"use client";

// iOS only allows audio after a user gesture, so the context is created lazily
// on the first tap and reused; every call is best-effort and never throws.
let ctx: AudioContext | null = null;

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
  } catch {}
}

export function beep(freq = 880, ms = 180, volume = 0.15) {
  try {
    if (!ctx || ctx.state !== "running") return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000 + 0.02);
  } catch {}
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

export function timeUpAlert() {
  beep(660, 220);
  setTimeout(() => beep(440, 420), 240);
  vibrate([200, 100, 300]);
}

export function phaseAlert() {
  beep(740, 140);
  vibrate(80);
}

type WakeLockSentinelLike = { release(): Promise<void> };

export function keepAwake(): () => void {
  let lock: WakeLockSentinelLike | null = null;
  let stopped = false;
  const request = async () => {
    try {
      const wl = (navigator as unknown as { wakeLock?: { request(t: "screen"): Promise<WakeLockSentinelLike> } }).wakeLock;
      if (wl && !document.hidden) lock = await wl.request("screen");
      if (stopped) void lock?.release();
    } catch {}
  };
  const onVisible = () => {
    if (!document.hidden) void request();
  };
  void request();
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    stopped = true;
    document.removeEventListener("visibilitychange", onVisible);
    void lock?.release().catch(() => {});
  };
}
