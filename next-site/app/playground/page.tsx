"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";

const SIZES = [
  { key: "xs", label: "XS", className: "max-w-xs" },
  { key: "sm", label: "SM", className: "max-w-sm" },
  { key: "md", label: "MD", className: "max-w-md" },
  { key: "lg", label: "LG", className: "max-w-lg" },
  { key: "xl", label: "XL", className: "max-w-xl" },
  { key: "2xl", label: "2XL", className: "max-w-2xl" },
  { key: "3xl", label: "3XL", className: "max-w-3xl" },
  { key: "4xl", label: "4XL", className: "max-w-4xl" },
  { key: "5xl", label: "5XL", className: "max-w-5xl" },
  { key: "6xl", label: "6XL", className: "max-w-6xl" },
  { key: "7xl", label: "7XL", className: "max-w-7xl" },
  { key: "full", label: "Full", className: "w-full" },
] as const;

const CONTENT_TYPES = [
  { key: "text", label: "Text" },
  { key: "media", label: "Media + Text" },
  { key: "list", label: "List" },
  { key: "pill", label: "Pill" },
] as const;

export default function PlaygroundPage() {
  const [sizeKey, setSizeKey] = useState<(typeof SIZES)[number]["key"]>("lg");
  const [contentKey, setContentKey] = useState("text");
  const [padding, setPadding] = useState("pad-comfortable");
  const [radius, setRadius] = useState("rounded-3xl");
  const [shadow, setShadow] = useState("shadow-[0_8px_30px_rgba(0,0,0,0.15)]");
  const [backgroundMode, setBackgroundMode] = useState<"glass" | "solid">("glass");
  const [iconCount, setIconCount] = useState<number>(3);
  // Shape control simplified: pills are a content type, not a container shape
  const [pillText, setPillText] = useState("Focus");
  const [pillSize, setPillSize] = useState<"sm" | "md" | "lg">("md");
  const [pillGroup, setPillGroup] = useState(false);
  const [pillCount, setPillCount] = useState(3);
  const [pillSelected, setPillSelected] = useState(0);

  const sizeClass = useMemo(() => (SIZES.find(s => s.key === sizeKey) || SIZES[3]).className, [sizeKey]);

  const backgroundClass = backgroundMode === "glass" ? "glass liquid-glass bg-white/30 dark:bg-white/10" : "bg-surface";

  const btn = (active: boolean) => `px-3 py-1 rounded-xl border text-sm ${active ? 'bg-accent/20 border-accent' : 'bg-surface/60 border-border'}`;

  const pillSizeClasses = {
    sm: { pad: "px-4 py-2", text: "text-sm", icon: 14, gap: "gap-2" },
    md: { pad: "px-6 py-3", text: "text-base", icon: 18, gap: "gap-3" },
    lg: { pad: "px-8 py-4", text: "text-lg", icon: 20, gap: "gap-4" },
  } as const;

  return (
    <div className="min-h-dvh bg-background text-text transition-colors duration-300">
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-semibold tracking-tight text-3xl md:text-4xl">Design Playground</h2>
            <ThemeToggle />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6 md:sticky md:top-20 self-start">
              <div className="glass rounded-3xl border border-border p-4">
                <h3 className="text-xl mb-3">Presets</h3>
                <div className="flex flex-wrap gap-2">
                  <button className={btn(false)} onClick={() => { setSizeKey("md"); setPadding("pad-compact"); setRadius("rounded-2xl"); setShadow("shadow"); setBackgroundMode("glass"); setIconCount(2); }}>
                    Mobile compact
                  </button>
                  <button className={btn(false)} onClick={() => { setSizeKey("4xl"); setPadding("pad-comfortable"); setRadius("rounded-3xl"); setShadow("shadow-[0_8px_30px_rgba(0,0,0,0.15)]"); setBackgroundMode("glass"); setIconCount(3); }}>
                    Desktop comfy
                  </button>
                  <button className={btn(false)} onClick={() => { setSizeKey("full"); setPadding("pad-spacious"); setRadius("rounded-[28px]"); setShadow("shadow-[0_10px_20px_rgba(0,0,0,0.08),_0_6px_6px_rgba(0,0,0,0.06)]"); setBackgroundMode("solid"); setIconCount(0); setPillCount(0); setContentKey("text"); }}>
                    Reset
                  </button>
                </div>
              </div>
              <div className="glass rounded-3xl border border-border p-4">
                <h3 className="text-xl mb-3">Width</h3>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s.key}
                      className={btn(s.key === sizeKey)}
                      onClick={() => setSizeKey(s.key)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass rounded-3xl border border-border p-4">
                <h3 className="text-xl mb-3">Content</h3>
                <div className="flex gap-2">
                  {CONTENT_TYPES.map((c) => (
                    <button
                      key={c.key}
                      className={btn(c.key === contentKey)}
                      onClick={() => setContentKey(c.key)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass rounded-3xl border border-border p-4 space-y-4">
                <h3 className="text-xl">Styles</h3>
                <div className="space-y-2">
                  <label className="block text-sm">Density</label>
                  <div className="flex gap-2">
                    <button className={btn(padding==='pad-compact')} onClick={()=>setPadding('pad-compact')}>Compact</button>
                    <button className={btn(padding==='pad-comfortable')} onClick={()=>setPadding('pad-comfortable')}>Comfortable</button>
                    <button className={btn(padding==='pad-spacious')} onClick={()=>setPadding('pad-spacious')}>Spacious</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm">Background</label>
                  <div className="flex gap-2">
                    <button className={btn(backgroundMode==='glass')} onClick={() => setBackgroundMode('glass')}>Glass</button>
                    <button className={btn(backgroundMode==='solid')} onClick={() => setBackgroundMode('solid')}>Solid</button>
                  </div>
                </div>
                {/* Removed shape: pill is a content type, not a container shape */}
                <div className="space-y-2">
                  <label className="block text-sm">Radius</label>
                  <select
                    className="w-full rounded-xl bg-surface/60 border border-border p-2"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                  >
                    <option value="rounded-2xl">2xl</option>
                    <option value="rounded-3xl">3xl</option>
                    <option value="rounded-[28px]">Custom 28px</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm">Shadow</label>
                  <select
                    className="w-full rounded-xl bg-surface/60 border border-border p-2"
                    value={shadow}
                    onChange={(e) => setShadow(e.target.value)}
                  >
                    <option value="shadow-none">None</option>
                    <option value="shadow">Default</option>
                    <option value="shadow-[0_8px_30px_rgba(0,0,0,0.15)]">Glass</option>
                    <option value="shadow-[0_10px_20px_rgba(0,0,0,0.08),_0_6px_6px_rgba(0,0,0,0.06)]">Elevation</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm">Icons (0–5)</label>
                  <select
                    className="w-full rounded-xl bg-surface/60 border border-border p-2"
                    value={iconCount}
                    onChange={(e) => setIconCount(parseInt(e.target.value))}
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm">Pills overlay (0–5)</label>
                  <select
                    className="w-full rounded-xl bg-surface/60 border border-border p-2"
                    value={pillCount}
                    onChange={(e) => setPillCount(parseInt(e.target.value))}
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </div>
                {contentKey === 'pill' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm">Pill label</label>
                      <input className="w-full rounded-xl bg-surface/60 border border-border p-2" value={pillText} onChange={(e)=>setPillText(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm">Pill size</label>
                      <div className="flex gap-2">
                        <button className={btn(pillSize==='sm')} onClick={()=>setPillSize('sm')}>Small</button>
                        <button className={btn(pillSize==='md')} onClick={()=>setPillSize('md')}>Medium</button>
                        <button className={btn(pillSize==='lg')} onClick={()=>setPillSize('lg')}>Large</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm">Pill group</label>
                      <div className="flex items-center gap-2">
                        <button className={btn(pillGroup)} onClick={()=>setPillGroup(!pillGroup)}>{pillGroup? 'On':'Off'}</button>
                        {pillGroup && (
                          <>
                            <select className="rounded-xl bg-surface/60 border border-border p-2" value={pillCount} onChange={(e)=>setPillCount(parseInt(e.target.value))}>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                              <option value={5}>5</option>
                            </select>
                            <select className="rounded-xl bg-surface/60 border border-border p-2" value={pillSelected} onChange={(e)=>setPillSelected(parseInt(e.target.value))}>
                              {Array.from({length: pillCount}).map((_,i)=>(<option key={i} value={i}>{i+1}</option>))}
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className={`${backgroundClass} ${padding} ${radius} ${shadow} ${sizeClass} w-full mx-auto`}>
                {iconCount > 0 && contentKey !== 'pill' && (
                  <div className="flex justify-end gap-2 mb-4">
                    {Array.from({ length: iconCount }).map((_, i) => (
                      <button key={i} aria-label={`icon-${i}`} className="h-10 w-10 rounded-full bg-surface/80 border border-border grid place-items-center">
                        {(() => {
                          switch (i % 5) {
                            case 0:
                              return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-text/70"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>);
                            case 1:
                              return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-text/70"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1.01 4.22 2.53C11.09 5.01 12.76 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>);
                            case 2:
                              return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-text/70"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6v-5a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>);
                            case 3:
                              return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-text/70"><path d="M3.5 12a3.5 3.5 0 0 1 5-3.162V7h2v3.5a3.5 3.5 0 1 1-2 6.5h-3a4.5 4.5 0 1 0 0-9H4a1 1 0 0 0 0 2h-.5z"/></svg>);
                            default:
                              return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-text/70"><path d="M19.14,12.94a7.43,7.43,0,0,0,.05-1,7.43,7.43,0,0,0-.05-1l2.11-1.65a.5.5,0,0,0,.12-.63l-2-3.46a.5.5,0,0,0-.6-.22l-2.49,1a7.28,7.28,0,0,0-1.73-1L14.5,2.5a.5.5,0,0,0-.5-.5H10a.5.5,0,0,0-.5.5l-.38,2.49a7.28,7.28,0,0,0-1.73,1l-2.49-1a.5.5,0,0,0-.6.22l-2,3.46a.5.5,0,0,0,.12.63L2.94,10a7.43,7.43,0,0,0,0,2l-2.11,1.65a.5.5,0,0,0-.12.63l2,3.46a.5.5,0,0,0,.6.22l2.49-1a7.28,7.28,0,0,0,1.73,1l.38,2.49a.5.5,0,0,0,.5.5h4a.5.5,0,0,0,.5-.5l.38-2.49a7.28,7.28,0,0,0,1.73-1l2.49,1a.5.5,0,0,0,.6-.22l2-3.46a.5.5,0,0,0-.12-.63ZM12,15.5A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/></svg>);
                          }
                        })()}
                      </button>
                    ))}
                  </div>
                )}
                {pillCount > 0 && contentKey !== 'pill' && (
                  <div className="flex flex-wrap justify-end gap-2 mb-4">
                    {Array.from({length: Math.min(pillCount,5)}).map((_,i)=> (
                      <span key={`chip-${i}`} className={`inline-flex items-center ${pillSizeClasses.sm.gap} ${pillSizeClasses.sm.pad} glass liquid-pill border border-border`}>
                        <span className="text-xs font-medium select-none">{pillText} {i+1}</span>
                      </span>
                    ))}
                  </div>
                )}
                {contentKey === "text" && (
                  <div className="space-y-4">
                    <h2 className="text-3xl">Liquid Glass Panel</h2>
                    <p className="text-muted">
                      This panel demonstrates the translucent layered surface with a subtle inner highlight and soft shadow.
                    </p>
                    <p>
                      Use the controls on the left to experiment with container width, padding, radius, and shadows. Toggle dark mode to validate contrast and glow.
                    </p>
                  </div>
                )}
                {contentKey === "media" && (
                  <div className="grid gap-6 md:grid-cols-2 items-center">
                    <Image
                      src="/images/hero/heroBackground.webp"
                      alt="Placeholder scene"
                      width={1200}
                      height={800}
                      className="rounded-2xl w-full h-auto object-cover"
                      priority
                    />
                    <div>
                      <h3 className="text-2xl mb-2">Media + Text</h3>
                      <p className="text-muted">Show how media sits on glass. Check for halos and edge clarity on both themes.</p>
                    </div>
                  </div>
                )}
                {contentKey === "list" && (
                  <div>
                    <h3 className="text-2xl mb-4">List content</h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Accessible focus states</li>
                      <li>Responsive container scales</li>
                      <li>Consistent spacing tokens</li>
                    </ul>
                  </div>
                )}
                {contentKey === 'pill' && (
                  <div className="flex items-center justify-center">
                    {!pillGroup ? (
                      <div className={`inline-flex items-center ${pillSizeClasses[pillSize].gap} ${pillSizeClasses[pillSize].pad} ${backgroundClass} liquid-pill shadow`}> 
                        <svg width={pillSizeClasses[pillSize].icon} height={pillSizeClasses[pillSize].icon} viewBox="0 0 24 24" fill="currentColor" className="text-text/80"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z"/></svg>
                        <span className={`font-medium select-none ${pillSizeClasses[pillSize].text}`}>{pillText}</span>
                        <svg width={pillSizeClasses[pillSize].icon - 2} height={pillSizeClasses[pillSize].icon - 2} viewBox="0 0 24 24" fill="currentColor" className="text-text/60"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {Array.from({length: pillCount}).map((_,i)=> (
                          <button key={i} onClick={()=>setPillSelected(i)} className={`inline-flex items-center ${pillSizeClasses[pillSize].gap} ${pillSizeClasses[pillSize].pad} ${backgroundClass} liquid-pill shadow border ${i===pillSelected? 'border-accent' : 'border-border'}`}>
                            <svg width={pillSizeClasses[pillSize].icon} height={pillSizeClasses[pillSize].icon} viewBox="0 0 24 24" fill="currentColor" className="text-text/80"><path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Z"/></svg>
                            <span className={`font-medium select-none ${pillSizeClasses[pillSize].text}`}>{pillText} {i+1}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


