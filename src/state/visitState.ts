/**
 * Module-level flag for "has the user opened any case-study page yet?"
 * Used to drive the first-card CTA pulse on home — once the user has clicked
 * into any /cases/:slug, the pulse is no longer shown for the rest of the
 * session. Resets on full page reload (intentional — each fresh tab gets
 * the affordance again).
 */

let hasVisitedWork = false;

export function getHasVisitedWork(): boolean {
  return hasVisitedWork;
}

export function markVisitedWork(): void {
  hasVisitedWork = true;
}
