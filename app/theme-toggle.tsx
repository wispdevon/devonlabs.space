'use client';

import { useEffect, useRef } from 'react';

const preferenceKey = 'devon-portfolio-theme';

export default function ThemeToggle() {
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const canvas = button.current?.closest<HTMLElement>('.portfolio');
    if (!canvas) return;
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    let preference: string | null = null;
    try { preference = localStorage.getItem(preferenceKey); } catch { /* Use the system theme when storage is unavailable. */ }
    const apply = () => {
      const dark = preference === 'dark' || (preference !== 'light' && system.matches);
      canvas.dataset.theme = dark ? 'dark' : 'light';
      button.current?.setAttribute('aria-pressed', String(dark));
    };
    const onSystemChange = () => {
      try { preference = localStorage.getItem(preferenceKey); } catch { /* Keep the current preference. */ }
      apply();
    };
    apply();
    system.addEventListener('change', onSystemChange);
    return () => system.removeEventListener('change', onSystemChange);
  }, []);

  function toggle() {
    const canvas = button.current?.closest<HTMLElement>('.portfolio');
    if (!canvas) return;
    const theme = canvas.dataset.theme === 'dark' ? 'light' : 'dark';
    canvas.dataset.theme = theme;
    button.current?.setAttribute('aria-pressed', String(theme === 'dark'));
    try { localStorage.setItem(preferenceKey, theme); } catch { /* The toggle still works without storage. */ }
  }

  return <button ref={button} type="button" className="theme-toggle" aria-label="Dark mode" aria-pressed="false" title="Toggle light and dark theme" onClick={toggle}>
    <svg className="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
    <svg className="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 13.4A8.5 8.5 0 0 1 10.6 3.5 8.5 8.5 0 1 0 20.5 13.4Z"/></svg>
  </button>;
}
