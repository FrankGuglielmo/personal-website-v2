"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { Project } from "@/data/projects";

type Props = {
  project: Project | null;
  onClose: () => void;
};

export default function ProjectDetailModal({ project, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
      <div className="relative w-full max-w-3xl animate-modal-in">
        <div className="glass liquid-glass bg-white/10 dark:bg-white/5 border rounded-3xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative h-56 md:h-full min-h-[260px]">
              <Image src={project.imageSrc} alt={project.title} fill className="object-cover" />
            </div>
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-xl md:text-2xl font-semibold">{project.title}</h3>
                <button onClick={onClose} className="inline-flex items-center justify-center rounded-xl px-2 py-1.5 border border-border hover:bg-white/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              {project.cardDescription && (
                <p className="text-muted mb-2">{project.cardDescription}</p>
              )}
              {project.projectDescription && (
                <p className="mb-3">{project.projectDescription}</p>
              )}
              {project.blurb && (
                <p className="text-sm text-muted mb-4">{project.blurb}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies?.map((t) => (
                  <span key={t} className="inline-flex items-center px-3 py-1 glass liquid-pill border border-border text-xs">{t}</span>
                ))}
              </div>
              <div className="flex gap-2">
                {project.url && (
                  <a href={project.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z"/></svg>
                    Visit
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


