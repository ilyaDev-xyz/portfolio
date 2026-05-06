/**
 * Privacy-first analytics client. See docs/analytics.md.
 *
 * Browser sends:  { ts, session_id, kind, ...payload }  →  POST /api/track
 * Server adds:    visitor_id (daily-salted SHA256 from IP+UA at hash-time),
 *                 country_code (reserved, nullable).
 *
 * Failures are silent — tracking is best-effort, never throws.
 */

// Same-origin ingest endpoint. Disabled in dev builds so DevTools doesn't show
// /api/track 404s when the analytics server isn't running locally.
const ENDPOINT: string | null = import.meta.env.PROD ? '/api/track' : null;
const SESSION_KEY = 'analytics.session';

export type EventKind = 'pageview' | 'dwell' | 'video' | 'outbound' | 'interaction';
export type DeviceClass = 'mobile' | 'tablet' | 'desktop';
export type OutboundKind = 'email' | 'telegram' | 'github';
export type InteractionKind =
  | 'lang_toggle'
  | 'theme_toggle'
  | 'video_provider_toggle'
  | 'case_card_click'
  | 'case_tab_click'
  | 'copy_markdown';
export type VideoAction = 'play' | 'completed' | 'mirror_toggle';

function randomSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const memSessionFallback = `mem-${randomSessionId()}`;

function sessionId(): string {
  if (typeof window === 'undefined') return memSessionFallback;
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        window.crypto && 'randomUUID' in window.crypto
          ? window.crypto.randomUUID()
          : randomSessionId();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return memSessionFallback;
  }
}

function deviceClass(): DeviceClass {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobile|iPhone|Android.+Mobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function referrerHost(): string | null {
  if (typeof document === 'undefined') return null;
  if (!document.referrer) return null;
  try {
    const u = new URL(document.referrer);
    if (u.hostname === window.location.hostname) return null;
    return u.hostname;
  } catch {
    return null;
  }
}

function send(payload: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  if (!ENDPOINT) return; // analytics disabled in dev builds
  let body: string;
  try {
    body = JSON.stringify(payload);
  } catch {
    return;
  }
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
  } catch {
    // fall through
  }
  try {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => undefined);
  } catch {
    // best-effort
  }
}

function track(kind: EventKind, payload: Record<string, unknown>): void {
  send({
    ts: Math.floor(Date.now() / 1000),
    session_id: sessionId(),
    kind,
    ...payload,
  });
}

export const analytics = {
  pageview(path: string, lang: string, theme: string): void {
    track('pageview', {
      path,
      referrer_host: referrerHost(),
      lang,
      theme,
      device_class: deviceClass(),
    });
  },
  dwell(
    path: string,
    active_seconds: number,
    total_seconds: number,
    max_scroll_pct: number,
    interaction_count: number,
  ): void {
    track('dwell', {
      path,
      active_seconds,
      total_seconds,
      max_scroll_pct,
      interaction_count,
    });
  },
  video(slug: string, action: VideoAction, position_s?: number): void {
    const payload: Record<string, unknown> = { slug, action };
    if (typeof position_s === 'number') payload.position_s = Math.floor(position_s);
    track('video', payload);
  },
  outbound(kind: OutboundKind, href: string): void {
    track('outbound', { kind, href });
  },
  interaction(kind: InteractionKind, value?: string): void {
    const payload: Record<string, unknown> = { kind };
    if (value !== undefined) payload.value = value;
    track('interaction', payload);
  },
};

export function classifyOutbound(href: string | undefined): OutboundKind | null {
  if (!href) return null;
  if (href.startsWith('mailto:')) return 'email';
  try {
    const u = new URL(href, window.location.origin);
    if (u.hostname.endsWith('t.me') || u.hostname.endsWith('telegram.org')) return 'telegram';
    if (u.hostname.endsWith('github.com')) return 'github';
  } catch {
    return null;
  }
  return null;
}
