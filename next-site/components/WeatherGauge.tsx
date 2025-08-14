"use client";

import { useEffect, useState } from "react";
import CircleWidget from "@/components/CircleWidget";
import { twMerge as tw } from "tailwind-merge";

type WeatherData = {
  tempF: number;
  lowF?: number;
  highF?: number;
};

type Props = {
  lat?: number;
  lon?: number;
  className?: string;
  sizePx?: number; // overall square size
};

// Simple open-meteo fetcher (no key required). Uses latitude/longitude if provided, else NYC.
async function fetchWeather(lat = 40.7128, lon = -74.006, signal?: AbortSignal): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current_weather", "true");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", "auto");
  const res = await fetch(url, { signal, cache: "no-store" });
  const data = await res.json();
  return {
    tempF: Math.round(data?.current_weather?.temperature ?? 0),
    lowF: Math.round(data?.daily?.temperature_2m_min?.[0] ?? 0),
    highF: Math.round(data?.daily?.temperature_2m_max?.[0] ?? 0),
  };
}

export default function WeatherGauge({ lat, lon, className = "", sizePx = 84 }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchWeather(lat, lon, ctrl.signal)
      .then(setWeather)
      .catch(() => {});
    const id = setInterval(() => {
      fetchWeather(lat, lon, ctrl.signal).then(setWeather).catch(() => {});
    }, 10 * 60 * 1000); // refresh every 10 minutes
    return () => {
      ctrl.abort();
      clearInterval(id);
    };
  }, [lat, lon]);

  const temp = weather?.tempF ?? 0;
  const low = weather?.lowF ?? undefined;
  const high = weather?.highF ?? undefined;

  // Gauge sweep from 0..100 mapped to 220deg arc
  const clamped = Math.max(0, Math.min(100, temp));
  const sweep = (clamped / 100) * 220; // deg
  // Shift arc to sit cleanly in the upper half of the circle
  const startDeg = -180; // top-left
  const radius = 42;

  const startX = Math.cos((startDeg * Math.PI) / 180) * radius;
  const startY = Math.sin((startDeg * Math.PI) / 180) * radius;
  const span = 180; // target top-half span
  const endTrackX = Math.cos(((startDeg + span) * Math.PI) / 180) * radius;
  const endTrackY = Math.sin(((startDeg + span) * Math.PI) / 180) * radius;
  const endValueX = Math.cos(((startDeg + (sweep * (span / 220))) * Math.PI) / 180) * radius;
  const endValueY = Math.sin(((startDeg + (sweep * (span / 220))) * Math.PI) / 180) * radius;
  const largeArc = (sweep * (span / 220)) > 180 ? 1 : 0;

  return (
    <CircleWidget sizePx={sizePx} className={tw("relative overflow-visible", className)}>
      {/* Centered 120x120 viewbox scaled to container via preserveAspectRatio */}
      <svg viewBox="0 0 120 120" className="absolute inset-0" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.6)" />
            <stop offset="50%" stopColor="rgba(236,72,153,0.6)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0.6)" />
          </linearGradient>
        </defs>
        <g transform="translate(60,60)">
          {/* Static track and dynamic arc share the same start and curvature */}
          <path d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endTrackX} ${endTrackY}`} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="9" strokeLinecap="round"/>
          <path d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endValueX} ${endValueY}`} fill="none" stroke="url(#g)" strokeWidth="9" strokeLinecap="round"/>
          <circle cx={endValueX} cy={endValueY} r={4} fill="white" opacity={0.9} />
        </g>
      </svg>
      <div className="relative grid place-items-center h-full">
        <div className="text-[20px] font-semibold">{temp}</div>
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] text-[--color-muted]">
          {low !== undefined && high !== undefined ? (
            <span>
              {low}
              <span className="mx-1">/</span>
              {high}
            </span>
          ) : (
            <span>--</span>
          )}
        </div>
      </div>
    </CircleWidget>
  );
}


