/**
 * One-shot flag set by TransitionLink before a case→case navigation.
 * Signals ProjectDetailPage to render its `.case-video-frame` WITHOUT a
 * `view-transition-name`, so the case→case view-transition becomes a clean
 * root crossfade instead of three overlapping fade groups (root + old
 * named video + new named video at different durations).
 *
 * Consumed by ProjectDetailPage on mount via useState init; cleared in
 * useEffect so the subsequent re-render restores the name — needed for
 * the next home↔case morph to find a matching source/target.
 *
 * Requires `<ProjectDetailPage key={slug} />` (see App.tsx) so the
 * component remounts on slug change and re-runs the useState init.
 */

let suppressVideoMorph = false;

export function getSuppressVideoMorph(): boolean {
  return suppressVideoMorph;
}

export function setSuppressVideoMorph(v: boolean): void {
  suppressVideoMorph = v;
}
