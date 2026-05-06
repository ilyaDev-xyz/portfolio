import type { Cv, Ui } from '../content/types';
import { LANG_CONFIG, type Lang } from '../i18n/langConfig';

export function ResumeLink({
  lang,
  ui,
  cv,
  className = '',
}: {
  lang: Lang;
  ui: Ui;
  /** When omitted, the chip does not render. Public and private trees both
   *  populate this field; legacy private builds without it stay hidden. */
  cv?: Cv;
  className?: string;
}) {
  if (!cv) return null;

  const href = cv.pdfPath ?? `/private/${LANG_CONFIG[lang].cvFile}`;
  const cls = ['chip case-copy-md', className].filter(Boolean).join(' ');

  return (
    <a className={cls} href={href} download>
      <span className="case-copy-md-icon" aria-hidden="true">
        <IconDownload />
      </span>
      <span className="case-copy-md-label">{ui.heroResumeDownload}</span>
    </a>
  );
}

function IconDownload() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1.5v8M3.5 6L7 9.5 10.5 6M2.5 12.5h9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
