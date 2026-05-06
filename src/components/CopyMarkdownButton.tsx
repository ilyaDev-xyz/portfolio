import { useEffect, useRef, useState } from 'react';
import type { Ui } from '../content/types';
import { analytics } from '../lib/analytics';

type State = 'idle' | 'copied' | 'error';

type Props = {
  /** Lazily compute the markdown body on click — keeps serialization off the
   * mount path. */
  getMarkdown: () => string;
  /** Identifier persisted in analytics — e.g. 'home', 'case-ai-crm'. */
  trackingId: string;
  ui: Ui;
  className?: string;
};

export function CopyMarkdownButton({ getMarkdown, trackingId, ui, className }: Props) {
  const [state, setState] = useState<State>('idle');
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const onClick = async () => {
    const md = getMarkdown();
    let ok = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(md);
        ok = true;
      }
    } catch {
      ok = false;
    }
    setState(ok ? 'copied' : 'error');
    analytics.interaction('copy_markdown', trackingId);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setState('idle'), 1800);
  };

  const label =
    state === 'copied' ? ui.copyMarkdownDone : ui.copyMarkdown;

  const classes = ['chip', 'case-copy-md', `case-copy-md--${state}`];
  if (className) classes.push(className);

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={onClick}
      aria-live="polite"
    >
      <span className="case-copy-md-icon" aria-hidden="true">
        {state === 'copied' ? <IconCheck /> : state === 'error' ? <IconX /> : <IconCopy />}
      </span>
      <span className="case-copy-md-label">{label}</span>
    </button>
  );
}

function IconCopy() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
      <rect
        x="4.5"
        y="4.5"
        width="8"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M2 8.5V2.5a1 1 0 0 1 1-1h6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
      <path
        d="M2.5 7.5L6 11l5.5-7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
      <path
        d="M3.5 3.5l7 7M10.5 3.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
