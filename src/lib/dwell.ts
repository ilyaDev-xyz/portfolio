/**
 * Heartbeat dwell tracker — Parse.ly model with 5s idle window, 30 min hard cap.
 * See docs/analytics.md §2.
 *
 * Counts active seconds only when document.visibilityState === 'visible' AND
 * the user interacted within the last 5s. Mousemove explicitly excluded — see
 * §2 "What's NOT collected".
 */

import { analytics } from './analytics';

const IDLE_THRESHOLD_MS = 5_000;
const HARD_CAP_S = 1_800;

interface State {
  active_seconds: number;
  total_seconds: number;
  max_scroll_pct: number;
  interaction_count: number;
  last_interaction: number;
  current_path: string;
}

let state: State | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let listenersAttached = false;

function fresh(path: string): State {
  return {
    active_seconds: 0,
    total_seconds: 0,
    max_scroll_pct: 0,
    interaction_count: 0,
    last_interaction: Date.now(),
    current_path: path,
  };
}

function noteInteraction(): void {
  if (!state) return;
  state.last_interaction = Date.now();
  state.interaction_count += 1;
}

function noteScroll(): void {
  if (!state) return;
  state.last_interaction = Date.now();
  state.interaction_count += 1;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return;
  const pct = Math.round((window.scrollY / max) * 100);
  const clamped = pct < 0 ? 0 : pct > 100 ? 100 : pct;
  if (clamped > state.max_scroll_pct) state.max_scroll_pct = clamped;
}

function tick(): void {
  if (!state) return;
  state.total_seconds += 1;
  if (state.total_seconds >= HARD_CAP_S) {
    flush();
    stop();
    return;
  }
  if (
    document.visibilityState === 'visible' &&
    Date.now() - state.last_interaction <= IDLE_THRESHOLD_MS
  ) {
    state.active_seconds += 1;
  }
}

export function flush(): void {
  if (!state) return;
  if (state.total_seconds === 0) return;
  analytics.dwell(
    state.current_path,
    state.active_seconds,
    state.total_seconds,
    state.max_scroll_pct,
    state.interaction_count,
  );
  // Reset counters but keep current_path — re-flush after visibilitychange
  // continues counting from zero, server sums per (session_id, path).
  state.active_seconds = 0;
  state.total_seconds = 0;
  state.max_scroll_pct = 0;
  state.interaction_count = 0;
  state.last_interaction = Date.now();
}

function attachListeners(): void {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;
  window.addEventListener('scroll', noteScroll, { passive: true });
  window.addEventListener('click', noteInteraction);
  window.addEventListener('keydown', noteInteraction);
  window.addEventListener('touchstart', noteInteraction, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
}

export function start(path: string): void {
  if (state?.current_path === path) return;
  if (state) flush();
  state = fresh(path);
  attachListeners();
  if (intervalId === null && typeof window !== 'undefined') {
    intervalId = window.setInterval(tick, 1000);
  }
}

function stop(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  state = null;
}

export const dwell = { start, flush };
