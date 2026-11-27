"use client";

import { QRCodeSVG } from "qrcode.react";
import { twMerge } from "tailwind-merge";

/** Client-side QR with a white quiet zone so it stays scannable in dark mode. */
export default function JoinQr({
  url,
  size = 200,
  label,
  className,
}: {
  url: string;
  size?: number;
  label?: string;
  className?: string;
}) {
  if (!url) return null;
  return (
    <div className={twMerge("inline-flex flex-col items-center gap-2", className)}>
      <div className="rounded-2xl bg-white p-2 shadow-sm">
        <QRCodeSVG
          value={url}
          size={size}
          bgColor="#ffffff"
          fgColor="#111111"
          marginSize={4}
          level="M"
          title={label ?? `QR code to join: ${url}`}
        />
      </div>
      {label ? <div className="text-sm font-medium">{label}</div> : null}
    </div>
  );
}
