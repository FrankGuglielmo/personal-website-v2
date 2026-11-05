"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import ProjectDetailModal from "@/components/ProjectDetailModal";
import type { Project } from "@/data/projects";

type Props = {
  projects: Project[];
  /** Auto-scroll speed in pixels per second */
  speedPxPerSec?: number;
  className?: string;
};

function rotateProjects(projects: Project[], offset: number): Project[] {
  const count = projects.length;
  if (count === 0) return projects;
  const start = ((offset % count) + count) % count;
  if (start === 0) return projects;
  return projects.slice(start).concat(projects.slice(0, start));
}

export default function ProjectCarousel({ projects, speedPxPerSec = 40, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Project | null>(null);
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const pausedRef = useRef(false);
  const draggedRef = useRef(false);
  const rotatingRef = useRef(false);
  const shiftRef = useRef(0);
  const scrollBeforeRef = useRef(0);
  const projectsRef = useRef(projects);
  const maybeRotateRef = useRef<() => void>(() => {});
  projectsRef.current = projects;

  const orderedProjects = useMemo(() => rotateProjects(projects, offset), [projects, offset]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const shift = shiftRef.current;
    if (!container || shift <= 0) return;
    const before = scrollBeforeRef.current;
    shiftRef.current = 0;
    scrollBeforeRef.current = 0;
    // The first card has moved to the end. Put scrollLeft back by that width
    // so the card now at the front stays visually fixed.
    container.scrollLeft = before - shift;
    startScrollLeftRef.current -= shift;
    rotatingRef.current = false;
    maybeRotateRef.current();
  }, [offset]);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const cardShift = () => {
      const first = track.firstElementChild as HTMLElement | null;
      if (!first || first.offsetWidth < 50) return 0;
      const style = getComputedStyle(track);
      const gap = Number.parseFloat(style.columnGap || style.gap || "0");
      return first.offsetWidth + (Number.isFinite(gap) ? gap : 0);
    };

    const maybeRotate = () => {
      if (rotatingRef.current) return;
      const count = projectsRef.current.length;
      if (count < 2) return;
      const shift = cardShift();
      if (shift <= 0) return;
      // Need enough overflow to move a full card off before the scroll clamps.
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll < shift) return;
      if (container.scrollLeft < shift) return;
      rotatingRef.current = true;
      shiftRef.current = shift;
      scrollBeforeRef.current = container.scrollLeft;
      setOffset((n) => (n + 1) % count);
    };
    maybeRotateRef.current = maybeRotate;

    const onScroll = () => {
      maybeRotate();
    };
    container.addEventListener("scroll", onScroll, { passive: true });

    let rafId = 0;
    let lastTs: number | undefined;
    const step = (ts: number) => {
      if (lastTs === undefined) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!pausedRef.current && !isPointerDownRef.current && !rotatingRef.current) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll > 1) {
          container.scrollLeft += speedPxPerSec * dt;
        }
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener("scroll", onScroll);
      maybeRotateRef.current = () => {};
    };
  }, [speedPxPerSec]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerDown = (e: PointerEvent) => {
      isPointerDownRef.current = true;
      startXRef.current = e.clientX;
      startScrollLeftRef.current = container.scrollLeft;
      pausedRef.current = true;
      draggedRef.current = false;
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
        className="overflow-x-auto overflow-y-visible py-2 no-scrollbar select-none [cursor:grab] [touch-action:pan-x] [overflow-anchor:none] [scroll-behavior:auto]"
      >
        <div ref={trackRef} className="flex gap-6 w-max">
          {orderedProjects.map((p) => (
            <ProjectCard key={p.id} project={p} onSelect={setSelected} />
          ))}
        </div>
      </div>
      <ProjectDetailModal project={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
