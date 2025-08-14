import React, { useMemo, useState } from 'react';
import Section from '../components/Section';
import GlassPanel from '../components/GlassPanel';
import Heading from '../components/Heading';
import ThemeToggle from '../components/ThemeToggle';

const SIZES = [
  { key: 'xs', label: 'XS', className: 'max-w-xs' },
  { key: 'sm', label: 'SM', className: 'max-w-sm' },
  { key: 'md', label: 'MD', className: 'max-w-md' },
  { key: 'lg', label: 'LG', className: 'max-w-lg' },
  { key: 'xl', label: 'XL', className: 'max-w-xl' },
  { key: '2xl', label: '2XL', className: 'max-w-2xl' },
  { key: '3xl', label: '3XL', className: 'max-w-3xl' },
  { key: '4xl', label: '4XL', className: 'max-w-4xl' },
  { key: 'full', label: 'Full', className: 'w-full' },
];

const CONTENT_TYPES = [
  { key: 'text', label: 'Text' },
  { key: 'media', label: 'Media + Text' },
  { key: 'list', label: 'List' },
];

export default function Playground() {
  const [sizeKey, setSizeKey] = useState('lg');
  const [contentKey, setContentKey] = useState('text');
  const [padding, setPadding] = useState('p-6 md:p-10');
  const [radius, setRadius] = useState('rounded-3xl');
  const [shadow, setShadow] = useState('shadow-glass');

  const sizeClass = useMemo(() => (SIZES.find(s => s.key === sizeKey) || SIZES[3]).className, [sizeKey]);

  return (
    <div className="min-h-screen bg-[hsl(0_0%_96%)] dark:bg-background text-text">
      <Section id="playground" ariaLabel="Design system playground">
        <div className="flex items-center justify-between mb-8">
          <Heading level={2}>Design Playground</Heading>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <GlassPanel className="p-4">
              <Heading level={3} className="text-xl mb-3">Container</Heading>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(s => (
                  <button
                    key={s.key}
                    className={`px-3 py-1 rounded-xl border border-border text-sm ${s.key===sizeKey? 'bg-accent/20' : 'bg-surface/60'}`}
                    onClick={() => setSizeKey(s.key)}
                  >{s.label}</button>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-4">
              <Heading level={3} className="text-xl mb-3">Content</Heading>
              <div className="flex gap-2">
                {CONTENT_TYPES.map(c => (
                  <button
                    key={c.key}
                    className={`px-3 py-1 rounded-xl border border-border text-sm ${c.key===contentKey? 'bg-accent/20' : 'bg-surface/60'}`}
                    onClick={() => setContentKey(c.key)}
                  >{c.label}</button>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-4 space-y-3">
              <Heading level={3} className="text-xl">Styles</Heading>
              <div className="space-y-2">
                <label className="block text-sm">Padding</label>
                <select className="w-full rounded-xl bg-surface/60 border border-border p-2" value={padding} onChange={e=>setPadding(e.target.value)}>
                  <option value="p-4 md:p-6">Tight</option>
                  <option value="p-6 md:p-10">Comfortable</option>
                  <option value="p-10 md:p-14">Spacious</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm">Radius</label>
                <select className="w-full rounded-xl bg-surface/60 border border-border p-2" value={radius} onChange={e=>setRadius(e.target.value)}>
                  <option value="rounded-2xl">2xl</option>
                  <option value="rounded-3xl">3xl</option>
                  <option value="rounded-[28px]">Custom 28px</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm">Shadow</label>
                <select className="w-full rounded-xl bg-surface/60 border border-border p-2" value={shadow} onChange={e=>setShadow(e.target.value)}>
                  <option value="shadow-none">None</option>
                  <option value="shadow">Default</option>
                  <option value="shadow-glass">Glass</option>
                  <option value="shadow-elevation">Elevation</option>
                </select>
              </div>
            </GlassPanel>
          </div>

          <div className="lg:col-span-3">
            <GlassPanel className={`${padding} ${radius} ${shadow} ${sizeClass} mx-auto`}
              aria-label="Preview panel"
            >
              {contentKey === 'text' && (
                <div className="space-y-4">
                  <Heading level={2} className="text-3xl">Liquid Glass Panel</Heading>
                  <p className="text-muted">This panel demonstrates the translucent layered surface with a subtle inner highlight and soft shadow.</p>
                  <p>
                    Use the controls on the left to experiment with container width, padding, radius, and shadows. Toggle dark mode to validate contrast and glow.
                  </p>
                </div>
              )}
              {contentKey === 'media' && (
                <div className="grid gap-6 md:grid-cols-2 items-center">
                  <img src={require('../images/hero/profilePicture.webp')} alt="Sample media" className="rounded-2xl w-full h-auto" />
                  <div>
                    <Heading level={3} className="text-2xl mb-2">Media + Text</Heading>
                    <p className="text-muted">Show how media sits on glass. Check for halos and edge clarity on both themes.</p>
                  </div>
                </div>
              )}
              {contentKey === 'list' && (
                <div>
                  <Heading level={3} className="text-2xl mb-4">List content</Heading>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Accessible focus states</li>
                    <li>Responsive container scales</li>
                    <li>Consistent spacing tokens</li>
                  </ul>
                </div>
              )}
            </GlassPanel>
          </div>
        </div>
      </Section>
    </div>
  );
}


