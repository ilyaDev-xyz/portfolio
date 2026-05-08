import { useLang } from '../i18n/LangContext';
import { IS_SANITIZED } from '../content';
import { LANG_CONFIG } from '../i18n/langConfig';

export function Footer() {
  const { t, lang } = useLang();
  const F = t.footer;
  const llmsFile = LANG_CONFIG[lang].llmsFile;
  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          {F.leftHref ? (
            <a href={F.leftHref} target="_blank" rel="noreferrer">
              {F.left}
            </a>
          ) : (
            <span>{F.left}</span>
          )}
          <span>{F.mid}</span>
          <span>{F.right}</span>
        </div>
        <a className="footer-agent-notice" href={`/${llmsFile}`}>
          /{llmsFile}
        </a>
        {IS_SANITIZED ? (
          <p className="footer-sanitized">
            Public repo uses fictional demo content and placeholder media.
            Private portfolio content is excluded from this build.
          </p>
        ) : null}
      </div>
    </footer>
  );
}
