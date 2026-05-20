import { useEffect, useState, useCallback } from 'react';

export type ThemeId = 'scifi' | 'sunset' | 'minimal' | 'cyberpunk';

export const THEMES: { id: ThemeId; name: string; emoji: string; sub: string }[] = [
  { id: 'scifi',     name: 'Sci-Fi',      emoji: '🛸', sub: 'Blu cyan scuro (default)' },
  { id: 'sunset',    name: 'Warm Sunset', emoji: '🌅', sub: 'Arancio ambra' },
  { id: 'minimal',   name: 'Minimal Light', emoji: '☀️', sub: 'Bianco grigio' },
  { id: 'cyberpunk', name: 'Neon Cyberpunk', emoji: '🌃', sub: 'Magenta verde acido' },
];

const KEY = 'nova_theme';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => (localStorage.getItem(KEY) as ThemeId) || 'scifi');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t: ThemeId) => setThemeState(t), []);
  return { theme, setTheme };
}
