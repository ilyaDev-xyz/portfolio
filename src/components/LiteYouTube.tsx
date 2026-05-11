import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  activateVideo,
  consumePauseFlag,
  getVideoEntry,
  recordVideoTime,
} from '../state/videoState';
import { claimPlayback } from '../state/currentPlayerState';
import { useCurrentPlayer } from '../hooks/useCurrentPlayer';
import { analytics } from '../lib/analytics';
import type { Lang } from '../i18n/langConfig';

type Provider = 'youtube' | 'rutube';

type Props = {
  videoId: string;
  /** Per-project identity used as the cross-route playback-state key. */
  slug: string;
  title?: string;
  playLabel: string;
  /** Localized loading label. Provider name added in-component. */
  loadingLabel: string;
  autoplayOnActivate?: boolean;
  onActivate?: () => void;
  /** Active provider — defaults to 'youtube'. Toggled by the mirror button. */
  provider?: Provider;
  /** RuTube embed URL — required when provider can be 'rutube'. */
  rutubeEmbedUrl?: string;
  /** Local thumbnail src (e.g. '/demo/case-01.svg'). When set, replaces
   *  the ytimg.com chain — works under RU CDN throttling and avoids any
   *  third-party request before the user clicks play. */
  thumbnail?: string;
  /** Incremented by a parent control that should activate this exact player
   *  without dispatching a synthetic DOM click (e.g. mirror toggle before
   *  the lite facade has loaded the iframe). */
  activationRequest?: number;
};

type VideoLanguageControlsProps = {
  availableLanguages?: Lang[];
  currentLanguage?: Lang;
  onSelectLanguage?: (lang: Lang) => void;
  className?: string;
};

const LANG_PILL_LABEL: Record<Lang, string> = {
  en: 'EN',
  ru: 'RU',
  ar: 'AR',
};

export function VideoLanguageControls({
  availableLanguages,
  currentLanguage,
  onSelectLanguage,
  className,
}: VideoLanguageControlsProps) {
  if (!availableLanguages || availableLanguages.length < 2 || !onSelectLanguage) {
    return null;
  }

  return (
    <div
      className={['lite-yt-langs', className].filter(Boolean).join(' ')}
      role="group"
      aria-label="Video language"
    >
      {availableLanguages.map((lang) => (
        <button
          key={lang}
          type="button"
          className="lite-yt-lang-btn"
          aria-pressed={currentLanguage === lang}
          onClick={(e) => {
            e.stopPropagation();
            onSelectLanguage(lang);
          }}
        >
          {LANG_PILL_LABEL[lang]}
        </button>
      ))}
    </div>
  );
}

/**
 * Convert a RuTube public URL to its embed equivalent.
 *   /video/{id}/?p=…   →  /play/embed/{id}/?p=…
 *   /video/private/…   →  /play/embed/private/…
 */
export function toRutubeEmbedUrl(publicUrl: string): string {
  return publicUrl.replace('/video/', '/play/embed/');
}

/**
 * Loading overlay shown during iframe load + on provider swap. Visual:
 * 8-dot rotating ring (matches hero ember palette — accent dot + glow) +
 * label below ("YouTube Loading..." with animated trailing dots).
 */
function PlayerSpinner({ label }: { label: string }) {
  return (
    <div className="player-spinner" aria-hidden="true">
      <div className="player-spinner-ring">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} style={{ '--i': i } as CSSProperties} />
        ))}
      </div>
      <div className="player-spinner-label">{label}</div>
    </div>
  );
}

export function LiteYouTube({
  videoId,
  slug,
  title,
  playLabel,
  loadingLabel,
  autoplayOnActivate = true,
  onActivate,
  provider = 'youtube',
  rutubeEmbedUrl,
  thumbnail,
  activationRequest,
}: Props) {
  const providerName = provider === 'youtube' ? 'YouTube' : 'RuTube';
  const fullLoadingLabel = `${providerName} ${loadingLabel}`;
  // Initial state mirrors the cross-route store: if the matching card was
  // activated on home, the case-hero mounts straight into iframe mode.
  const initialEntry = getVideoEntry(slug);
  const [active, setActive] = useState(initialEntry?.active ?? false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // "Only one plays at a time" — drives autoplay gating in the src below
  // and broadcasts via claimPlayback() so others reload without autoplay.
  const currentSlug = useCurrentPlayer();
  const isCurrent = currentSlug === slug;

  const activateFromUser = () => {
    claimPlayback(slug);
    activateVideo(slug);
    setActive(true);
    if (!active) analytics.video(slug, 'play');
    onActivate?.();
  };

  const activationRequestRef = useRef(activationRequest);
  useEffect(() => {
    if (activationRequest === undefined) return;
    if (activationRequestRef.current === activationRequest) return;
    activationRequestRef.current = activationRequest;
    activateFromUser();
  });

  // Loader gating: spinner overlay appears on first activation and on every
  // provider swap, hides on iframe load (with min 300ms anti-flicker).
  const [loading, setLoading] = useState(false);
  const loadingStartRef = useRef<number>(0);
  const loadingTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    setLoading(true);
    loadingStartRef.current = Date.now();
    if (loadingTimerRef.current !== null) {
      window.clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, [active, provider]);
  const handleIframeLoad = () => {
    const elapsed = Date.now() - loadingStartRef.current;
    const remaining = Math.max(300 - elapsed, 0);
    if (remaining === 0) {
      setLoading(false);
    } else {
      loadingTimerRef.current = window.setTimeout(() => {
        setLoading(false);
        loadingTimerRef.current = null;
      }, remaining);
    }
  };
  // Captured on mount so steady re-renders don't shift the start param
  // (which would force the iframe to reload mid-playback). Refreshed
  // ONLY when videoId/slug changes — i.e. on language switch or case swap —
  // so the new clip resumes from the matching stored playback position.
  const startTimeRef = useRef<number | undefined>(initialEntry?.lastTime);
  const prevVideoIdRef = useRef<string>(videoId);
  // One-shot pause flag from the home-bound back navigation. Read once
  // synchronously so the iframe URL gets autoplay=0 on this mount; cleared
  // in a useEffect below so subsequent mounts behave normally.
  const startsPausedRef = useRef<boolean>(
    (initialEntry?.active ?? false) && initialEntry?.paused === true,
  );
  const prevSlugRef = useRef<string>(slug);
  if (prevVideoIdRef.current !== videoId || prevSlugRef.current !== slug) {
    const nextEntry = getVideoEntry(slug);
    startTimeRef.current = nextEntry?.lastTime;
    startsPausedRef.current = (nextEntry?.active ?? false) && nextEntry?.paused === true;
    prevVideoIdRef.current = videoId;
    prevSlugRef.current = slug;
  }

  // Consume the pause flag once we've baked it into the URL. Subsequent
  // navigations to the case page should autoplay again.
  useEffect(() => {
    if (startsPausedRef.current) consumePauseFlag(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to YouTube's postMessage `infoDelivery` broadcasts so we can
  // record currentTime continuously. The iframe must include `enablejsapi=1`
  // (set in the src below). Sending `{event:"listening"}` triggers the
  // player to start broadcasting state every ~250ms.
  // Re-runs on provider change so a YouTube → RuTube → YouTube swap re-attaches
  // listeners to the freshly-mounted YouTube iframe.
  useEffect(() => {
    if (!active) return;
    if (provider !== 'youtube') return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    const sendListening = () => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening', id: slug }),
        '*',
      );
    };

    // Send on iframe load and once immediately — handles both cases (already
    // loaded from cache vs about to load).
    iframe.addEventListener('load', sendListening);
    sendListening();

    const onMessage = (e: MessageEvent) => {
      // Critical: filter to messages from THIS iframe's contentWindow.
      // window-level listeners receive every YouTube iframe's broadcasts;
      // without this check, all N mounted players would record each other's
      // currentTime AND claim playback on each other's playerState=1 events
      // — last handler to fire wins, swapping autoplay onto the wrong card.
      if (e.source !== iframe.contentWindow) return;
      if (typeof e.origin !== 'string') return;
      if (!/^https:\/\/(www\.)?youtube(-nocookie)?\.com$/.test(e.origin)) return;
      if (typeof e.data !== 'string') return;
      try {
        const d = JSON.parse(e.data);
        if (d?.event === 'infoDelivery') {
          if (typeof d?.info?.currentTime === 'number') {
            recordVideoTime(slug, d.info.currentTime);
          }
          // playerState 1 = playing — claim the global single-play slot so
          // any previously-playing card reloads without autoplay.
          if (d?.info?.playerState === 1) {
            claimPlayback(slug);
          }
          // playerState 0 = ended. Track per-slug completion + position.
          if (d?.info?.playerState === 0) {
            const pos =
              typeof d?.info?.currentTime === 'number' ? d.info.currentTime : undefined;
            analytics.video(slug, 'completed', pos);
          }
        }
      } catch {
        // YT also sends non-JSON noise — ignore.
      }
    };
    window.addEventListener('message', onMessage);

    return () => {
      iframe.removeEventListener('load', sendListening);
      window.removeEventListener('message', onMessage);
    };
  }, [active, slug, provider]);

  if (active) {
    if (provider === 'rutube' && rutubeEmbedUrl) {
      const sep = rutubeEmbedUrl.includes('?') ? '&' : '?';
      // Autoplay only if I'm the current global player. When another card
      // claims, isCurrent flips false, src reloads without autoplay → paused.
      const src = isCurrent ? `${rutubeEmbedUrl}${sep}autoplay=1` : rutubeEmbedUrl;
      return (
        <>
          <iframe
            ref={iframeRef}
            className="lite-yt-frame"
            src={src}
            title={title ?? 'Video'}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={handleIframeLoad}
          />
          {loading && <PlayerSpinner label={fullLoadingLabel} />}
        </>
      );
    }
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      enablejsapi: '1',
    });
    if (autoplayOnActivate && isCurrent && !startsPausedRef.current) {
      params.set('autoplay', '1');
    }
    const t = startTimeRef.current;
    if (typeof t === 'number' && t > 1) {
      params.set('start', String(Math.floor(t)));
    }
    const src = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
    return (
      <>
        <iframe
          ref={iframeRef}
          className="lite-yt-frame"
          src={src}
          title={title ?? 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
        />
        {loading && <PlayerSpinner label={fullLoadingLabel} />}
      </>
    );
  }

  // Cascade: local thumbnail (RU-resilient, no third-party hit) > ytimg
  // maxresdefault > ytimg hqdefault. Local skips the ytimg fallbacks entirely
  // — failing local means a deploy bug, not a missing CDN frame.
  const thumb = thumbnail ?? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const ytimgFallback = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <>
      <button
        type="button"
        className="lite-yt-btn"
        onClick={activateFromUser}
        aria-label={title ? `${playLabel}: ${title}` : playLabel}
      >
        <img
          className="lite-yt-thumb"
          src={thumb}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => {
            // Only fall back to ytimg if we were on the maxres ytimg URL —
            // local thumbnails should not silently swap to YouTube CDN.
            const img = e.currentTarget;
            if (!thumbnail && img.src !== ytimgFallback) img.src = ytimgFallback;
          }}
        />
        <span className="lite-yt-play" aria-hidden="true">
          ▶
        </span>
      </button>
    </>
  );
}
