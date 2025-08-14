import { twMerge } from "tailwind-merge";
import React from "react";

type Props = {
  sizePx?: number;
  className?: string;
  children?: React.ReactNode;
};

export default function CircleWidget({ sizePx = 88, className = "", children }: Props) {
  return (
    <div
      className={twMerge("circle-widget rounded-full grid place-items-center", className)}
      style={{ width: sizePx, height: sizePx }}
    >
      {children}
    </div>
  );
}


