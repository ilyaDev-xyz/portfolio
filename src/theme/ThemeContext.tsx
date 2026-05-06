import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { analytics } from '../lib/analytics';

export type Theme = 'light' | 'dark';
export type Palette = 'ochre' | 'electric';

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  palette: Palette;
};

const Ctx = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = 'site.theme';

function readInitial(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    // ignore
  }
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitial);

  // Palette derivation mirrors portfolio_design/app.jsx:63
  const palette: Palette = theme === 'dark' ? 'ochre' : 'electric';

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    html.setAttribute('data-palette', palette);
    html.setAttribute('data-density', 'comfortable');
    html.setAttribute('data-font-pair', 'swiss');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme, palette]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState((prev) => {
      if (prev !== next) analytics.interaction('theme_toggle', next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({ theme, setTheme, palette }),
    [theme, palette, setTheme],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used inside <ThemeProvider>');
  return v;
}
