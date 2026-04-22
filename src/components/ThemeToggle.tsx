'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'kidsnote:theme';

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', mode);
  }
}

function readInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto';
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === 'light' || v === 'dark') return v;
  return 'auto';
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('auto');

  useEffect(() => {
    setMode(readInitialMode());
  }, []);

  const handleChange = (next: ThemeMode) => {
    setMode(next);
    try {
      if (next === 'auto') window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
    applyTheme(next);
  };

  const options: { value: ThemeMode; label: string; description: string }[] = [
    { value: 'auto', label: '自動', description: '端末のOS設定に従う' },
    { value: 'light', label: 'ライト', description: '常に明るい配色' },
    { value: 'dark', label: 'ダーク', description: '常に暗い配色(夜間や屋外向け)' },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-headline">表示テーマ</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map(opt => {
          const selected = mode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChange(opt.value)}
              aria-pressed={selected}
              className={`min-h-12 px-4 py-2 rounded-lg border transition-colors text-left ${
                selected
                  ? 'border-button bg-button/10 text-headline'
                  : 'border-secondary/40 bg-surface text-paragraph hover:bg-secondary/10'
              }`}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-paragraph/60">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
