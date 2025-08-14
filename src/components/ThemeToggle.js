import React, { useEffect, useState } from 'react';

export default function ThemeToggle({ className = '' }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldDark = stored ? stored === 'dark' : prefersDark;
      setIsDark(shouldDark);
    } catch (e) {
      /* no-op */
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {
      /* no-op */
    }
  };

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={toggle}
      className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-text bg-surface/60 hover:bg-surface/80 border border-border shadow-sm backdrop-blur ${className}`}
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}


