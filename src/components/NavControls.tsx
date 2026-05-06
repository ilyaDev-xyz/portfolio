import { useLang } from '../i18n/LangContext';
import { LANG_CONFIG, LANGS } from '../i18n/langConfig';
import { useTheme } from '../theme/ThemeContext';

export function NavControls() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLang();

  return (
    <div className="nav-ctrls" role="group" aria-label="settings">
      <button
        className="nav-ctrl nav-ctrl-theme"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
      >
        <span className={'nav-ctrl-icon nav-ctrl-icon--' + theme} aria-hidden="true">
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.8" stroke="currentColor" strokeWidth="1.2" />
              <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <path d="M7 1.5v1.2M7 11.3v1.2M1.5 7h1.2M11.3 7h1.2M3 3l.9.9M10.1 10.1l.9.9M3 11l.9-.9M10.1 3.9l.9-.9" />
              </g>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M12 9.2A5 5 0 0 1 4.8 2a5 5 0 1 0 7.2 7.2Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </button>

      <div className="nav-ctrl nav-ctrl-lang">
        {LANGS.map((l) => (
          <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
            {LANG_CONFIG[l].label}
          </button>
        ))}
      </div>
    </div>
  );
}
