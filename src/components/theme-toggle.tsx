/**
 * Theme toggle — switches between system / dark.
 *
 * (Light mode would require a full color palette redesign for gh-* tokens.
 *  Current palette is GitHub-dark only.)
 *
 * Persists choice in localStorage under `gpush_theme`.
 * Reads from OS via matchMedia('prefers-color-scheme: dark') when in 'system'.
 */

'use client';

import { useEffect, useState } from 'react';
import { Moon, Monitor } from 'lucide-react';

export type Theme = 'system' | 'dark';

const STORAGE_KEY = 'gpush_theme';

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
    html.classList.remove('light');
  } else {
    // system — follow OS
    const sysTheme = getSystemTheme();
    if (sysTheme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      // Light mode — show light tokens if defined, else keep dark
      html.classList.remove('dark');
      html.classList.add('light');
    }
  }
  html.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
    setTheme(stored);
    applyTheme(stored);
    setMounted(true);
  }, []);

  // Listen for OS theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const cycle = () => {
    const next: Theme = theme === 'system' ? 'dark' : 'system';
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  if (!mounted) return null;

  const Icon = theme === 'system' ? Monitor : Moon;
  const label = theme === 'system' ? 'System theme' : 'Dark theme';

  return (
    <button
      onClick={cycle}
      title={`${label} (click to switch)`}
      className="btn-ghost text-xs p-1.5"
      aria-label="Toggle theme"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

/**
 * Inline script to set theme class BEFORE React hydrates,
 * preventing flash-of-wrong-theme. Place in <head>.
 */
export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}') || 'system';
    var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    document.documentElement.dataset.theme = stored;
  } catch (e) {}
})();
`;