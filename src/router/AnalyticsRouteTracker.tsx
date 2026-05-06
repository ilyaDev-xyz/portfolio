import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../i18n/LangContext';
import { useTheme } from '../theme/ThemeContext';
import { analytics } from '../lib/analytics';
import { dwell } from '../lib/dwell';

// Fires `pageview` and (re)starts the dwell heartbeat on every SPA route change.
// Mounts inside <BrowserRouter> so useLocation is available; renders nothing.
export function AnalyticsRouteTracker() {
  const { pathname } = useLocation();
  const { lang } = useLang();
  const { theme } = useTheme();

  useEffect(() => {
    analytics.pageview(pathname, lang, theme);
    dwell.start(pathname);
    // lang/theme intentionally NOT in deps: a toggle inside the same path
    // is captured separately as `interaction.lang_toggle` / `theme_toggle`.
    // Re-firing pageview on toggle would double-count navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
