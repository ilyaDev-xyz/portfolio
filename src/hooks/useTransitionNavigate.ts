import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, type NavigateOptions } from 'react-router-dom';

/**
 * Wraps react-router's navigate() in document.startViewTransition() so the
 * browser captures snapshots of the old + new DOM and morphs between matching
 * `view-transition-name` elements (FLIP) plus crossfades the rest.
 *
 * flushSync forces React to commit the route change synchronously inside the
 * transition callback — without it, navigate() returns before the new DOM
 * exists and the browser captures the wrong "after" snapshot.
 *
 * Falls back to a plain navigate() when:
 *   - the browser has no startViewTransition (Firefox <127, etc)
 *   - the user prefers reduced motion
 */
export function useTransitionNavigate() {
  const navigate = useNavigate();

  return useCallback(
    (to: string, options?: NavigateOptions) => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || !('startViewTransition' in document)) {
        navigate(to, options);
        return;
      }
      document.startViewTransition(() => {
        flushSync(() => navigate(to, options));
      });
    },
    [navigate],
  );
}
