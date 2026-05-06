/**
 * Global video-provider preference, persisted in localStorage and broadcast
 * to all currently-mounted players. One toggle on any card swaps the entire
 * site to that provider for the rest of the session — and remembers it on the
 * next visit.
 *
 * Default: 'youtube'. Updated only by user clicking the mirror toggle.
 */

import { analytics } from '../lib/analytics';

export type VideoProvider = 'youtube' | 'rutube';

const KEY = 'video-provider';

let cached: VideoProvider | null = null;
const subscribers = new Set<(p: VideoProvider) => void>();

function readStorage(): VideoProvider {
  if (typeof window === 'undefined') return 'youtube';
  try {
    return window.localStorage.getItem(KEY) === 'rutube' ? 'rutube' : 'youtube';
  } catch {
    return 'youtube';
  }
}

export function getVideoProvider(): VideoProvider {
  if (cached === null) cached = readStorage();
  return cached;
}

export function setVideoProvider(p: VideoProvider): void {
  const prev = cached ?? readStorage();
  cached = p;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(KEY, p);
    } catch {
      // private mode / quota — silent; in-memory cache keeps the session sticky
    }
  }
  subscribers.forEach((fn) => fn(p));
  if (prev !== p) analytics.interaction('video_provider_toggle', p);
}

export function subscribeVideoProvider(fn: (p: VideoProvider) => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}
