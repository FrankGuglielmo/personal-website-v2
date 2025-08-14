"use client";

import React, { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * When true, the element will stay visible after the first reveal
   * and will not animate out when leaving the viewport.
   */
  once?: boolean;
  /** Optional delay (ms) applied to the transition */
  delayMs?: number;
};

export default function Reveal({ children, className = "", once = false, delayMs }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [hasRevealed, setHasRevealed] = useState<boolean>(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasRevealed(true);
          } else if (!once) {
            setIsVisible(false);
          }
        }
      },
      {
        root: null,
        // Reveal slightly before fully in view to feel snappy
        rootMargin: "0px 0px -10% 0px",
        threshold: [0, 0.15, 0.4, 0.75, 1],
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const revealClass = isVisible ? "reveal-in" : "";
  const style = delayMs ? { transitionDelay: `${delayMs}ms` } : undefined;

  return (
    <div ref={ref} className={`reveal ${revealClass} ${className}`} style={style}>
      {children}
    </div>
  );
}


