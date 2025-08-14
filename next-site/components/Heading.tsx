import React from "react";

type Props = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: React.ReactNode;
};

export default function Heading({ level = 2, className = "", children }: Props) {
  const Tag = ("h" + level) as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return <Tag className={`font-semibold tracking-tight text-3xl md:text-4xl ${className}`}>{children}</Tag>;
}


