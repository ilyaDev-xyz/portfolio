/**
 * Module-level "currently playing slug" — at most one across the whole site.
 * When a player claims playback, others observing this slot see they're no
 * longer current and pause themselves (via iframe src reload without autoplay).
 *
 * Lives outside React so home cards and the case-page hero share one slot.
 */

let currentSlug: string | null = null;
const subscribers = new Set<(slug: string | null) => void>();

export function getCurrentPlayer(): string | null {
  return currentSlug;
}

export function claimPlayback(slug: string): void {
  if (currentSlug === slug) return;
  currentSlug = slug;
  subscribers.forEach((fn) => fn(currentSlug));
}

export function releasePlayback(slug: string): void {
  if (currentSlug !== slug) return;
  currentSlug = null;
  subscribers.forEach((fn) => fn(null));
}

export function subscribeCurrentPlayer(fn: (slug: string | null) => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}
