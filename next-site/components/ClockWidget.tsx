"use client";

import { useEffect, useState } from "react";

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function ClockWidget() {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass glass-flat rounded-2xl p-4">
      <div className="text-3xl font-semibold leading-tight">{formatTime(now)}</div>
      <div className="text-sm text-[--color-muted]">{formatDate(now)}</div>
    </div>
  );
}



