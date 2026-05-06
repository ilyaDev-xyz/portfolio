/**
 * Module-level store for LiteYouTube playback state, keyed by project slug.
 *
 * Why module-level: lives outside React's reconciliation, so it survives
 * route changes (HomePage unmount → ProjectDetailPage mount). The case-hero
 * LiteYouTube reads it once during initial useState and renders the iframe
 * directly if the matching card was already activated on home.
 *
 * Why keyed by slug, not videoId: slug is the per-project identity that
 * the home card and case-hero share; videoId can collide across cards
 * (e.g. when two projects mirror the same upload), and keying by it would
 * activate every match at once.
 *
 * Reset on full page reload (intentional — fresh tab, fresh state).
 */

type Entry = {
  active: boolean;
  /** Last currentTime reported by the YouTube iframe via postMessage. */
  lastTime?: number;
  /**
   * One-shot "do not autoplay on next mount" flag. Set by `pauseVideo()` from
   * home-bound navigation buttons (back, case-next-home) so a video that was
   * actively playing on the case page resumes paused on the home card.
   * Consumed on the first iframe mount that reads it, then cleared.
   */
  paused?: boolean;
};

const store = new Map<string, Entry>();

export function activateVideo(slug: string): void {
  const existing = store.get(slug);
  if (!existing) store.set(slug, { active: true });
  else {
    existing.active = true;
    existing.paused = false;
  }
}

export function recordVideoTime(slug: string, time: number): void {
  const e = store.get(slug);
  if (e) e.lastTime = time;
}

/** Mark the next mount as "do not autoplay". No-op if no entry exists. */
export function pauseVideo(slug: string): void {
  const e = store.get(slug);
  if (e?.active) e.paused = true;
}

/**
 * Mark every currently-active video as "do not autoplay on next mount".
 * Called from TransitionLink for any home-bound navigation — prevents the
 * autoplay-burst when several cards were activated on home and the user
 * returns from a case page.
 */
export function pauseAllActiveVideos(): void {
  store.forEach((entry) => {
    if (entry.active) entry.paused = true;
  });
}

/** Read+clear the one-shot pause flag. Returns true if it was set. */
export function consumePauseFlag(slug: string): boolean {
  const e = store.get(slug);
  if (e?.paused) {
    e.paused = false;
    return true;
  }
  return false;
}

export function getVideoEntry(slug: string): Entry | undefined {
  return store.get(slug);
}

export function isVideoActive(slug: string): boolean {
  return store.get(slug)?.active === true;
}
