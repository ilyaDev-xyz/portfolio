import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, ru, ar, type Content } from '../content';
import { analytics } from '../lib/analytics';
import { LANG_CONFIG, isLang, type Lang } from './langConfig';
export type { Lang } from './langConfig';

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Content;
};

const Ctx = createContext<LangCtx | null>(null);

const STORAGE_KEY = 'site.lang';

function readInitial(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (isLang(v)) return v;
  } catch {
    // ignore
  }
  return 'en';
}

const DICTS: Record<Lang, Content> = { en, ru, ar };

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitial);

  useEffect(() => {
    const html = document.documentElement;
    const cfg = LANG_CONFIG[lang];
    html.setAttribute('data-lang', lang);
    html.lang = cfg.htmlLang;
    html.dir = cfg.dir;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState((prev) => {
      if (prev !== next) analytics.interaction('lang_toggle', next);
      return next;
    });
  }, []);

  const value = useMemo<LangCtx>(
    () => ({ lang, setLang, t: DICTS[lang] }),
    [lang, setLang],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLang must be used inside <LangProvider>');
  return v;
}

export function useT(): Content {
  return useLang().t;
}
