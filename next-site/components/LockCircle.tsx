"use client";

import { useEffect, useState } from "react";
import CircleWidget from "@/components/CircleWidget";

type Props = {
  city: string;
  timeZone: string; // e.g., "America/New_York"
  className?: string;
  sizePx?: number; // circle diameter in pixels
};

function getPartsForZone(date: Date, timeZone: string): { time: string; ampm: string } {
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "";
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value?.toUpperCase?.() ?? "";
  return { time: `${hour}:${minute}`, ampm: dayPeriod };
}

export default function LockCircle({ city, timeZone, className = "", sizePx = 84 }: Props) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { time, ampm } = getPartsForZone(now, timeZone);

  return (
    <CircleWidget sizePx={sizePx} className={"lock-circle " + className}>
      <div className="text-center leading-tight">
        <div className="text-[10px] tracking-wide uppercase text-[--color-muted]">{city}</div>
        <div className="">
          <div className="text-[18px] md:text-[20px] font-semibold leading-tight">{time}</div>
          <div className="text-[11px] md:text-[12px] font-medium leading-none">{ampm}</div>
        </div>
      </div>
    </CircleWidget>
  );
}


