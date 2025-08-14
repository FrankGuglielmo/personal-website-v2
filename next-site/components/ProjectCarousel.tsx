"use client";

import { useEffect, useRef, useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import type { Project } from "@/data/projects";

type Props = {
  projects: Project[];
  /** Auto-scroll speed in pixels per second */
  speedPxPerSec?: number;
  className?: string;
};

export default function ProjectCarousel({ projects, speedPxPerSec = 40, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [selected, setSelected] = useState<Project | null>(null);
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const pausedRef = useRef(false);
  const draggedRef = useRef(false);
  const downTsRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      // Half of total scrollWidth because content is duplicated once
      const half = container.scrollWidth / 2;
      setContentWidth(half);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);

    const onScroll = () => {
      if (contentWidth === 0) return;
      if (container.scrollLeft >= contentWidth) {
        container.scrollLeft -= contentWidth;
      } else if (container.scrollLeft < 0) {
        container.scrollLeft += contentWidth;
      }
    };
    container.addEventListener("scroll", onScroll, { passive: true });

    let rafId = 0;
    let lastTs: number | undefined;
    const step = (ts: number) => {
      if (lastTs === undefined) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!pausedRef.current && !isPointerDownRef.current && contentWidth > 0) {
        // Increase scrollLeft so content appears to move right->left
        container.scrollLeft += speedPxPerSec * dt;
        if (container.scrollLeft >= contentWidth) {
          container.scrollLeft -= contentWidth;
        }
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [speedPxPerSec, contentWidth]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerDown = (e: PointerEvent) => {
      isPointerDownRef.current = true;
      startXRef.current = e.clientX;
      startScrollLeftRef.current = container.scrollLeft;
      pausedRef.current = true;
      draggedRef.current = false;
      downTsRef.current = performance.now();
      (container as HTMLElement).style.cursor = "grabbing";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return;
      const dx = e.clientX - startXRef.current;
      if (!draggedRef.current && Math.abs(dx) > 10) {
        draggedRef.current = true;
        try { container.setPointerCapture(e.pointerId); } catch {}
      }
      if (draggedRef.current) {
        container.scrollLeft = startScrollLeftRef.current - dx;
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      isPointerDownRef.current = false;
      pausedRef.current = false;
      try { container.releasePointerCapture(e.pointerId); } catch {}
      (container as HTMLElement).style.cursor = "grab";
    };
    const onClickCapture = (e: MouseEvent) => {
      // If the interaction was a drag, suppress click. Otherwise allow.
      if (draggedRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
      draggedRef.current = false;
    };
    const onDragStart = (e: DragEvent) => { e.preventDefault(); };
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    container.addEventListener("click", onClickCapture, true);
    container.addEventListener("dragstart", onDragStart, true);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      container.removeEventListener("click", onClickCapture, true);
      container.removeEventListener("dragstart", onDragStart, true);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-visible py-2 no-scrollbar select-none [cursor:grab] [touch-action:pan-x]"
      >
        <div className="flex gap-6">
          {projects.map((p) => (
            <ProjectCard key={`a-${p.id}`} project={p} onSelect={setSelected} />
          ))}
          {projects.map((p) => (
            <ProjectCard key={`b-${p.id}`} project={p} onSelect={setSelected} />
          ))}
        </div>
      </div>
      <ProjectDetailModal project={selected} onClose={()=>setSelected(null)} />
    </div>
  );
}


