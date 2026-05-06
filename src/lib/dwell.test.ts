/**
 * dwell.ts is a module-level singleton driven by setInterval + window listeners.
 * To exercise its state machine we mock ./analytics so .dwell() captures the
 * flushed payload, then drive time forward with vi.useFakeTimers().
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const dwellSpy = vi.fn();
vi.mock('./analytics', () => ({
  analytics: {
    dwell: (...args: unknown[]) => dwellSpy(...args),
    pageview: vi.fn(),
    video: vi.fn(),
    outbound: vi.fn(),
    interaction: vi.fn(),
  },
}));

let dwellModule: typeof import('./dwell');

beforeEach(async () => {
  vi.resetModules();
  dwellSpy.mockReset();
  vi.useFakeTimers();
  // Default visibility = visible. Definition needed because jsdom returns
  // 'prerender' if visibilityState is not configured on the document.
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => 'visible',
  });
  dwellModule = await import('./dwell');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('dwell state machine', () => {
  it('counts active seconds when visible and inside the 5s idle window', () => {
    dwellModule.dwell.start('/');
    vi.advanceTimersByTime(3_000);
    dwellModule.dwell.flush();

    expect(dwellSpy).toHaveBeenCalledTimes(1);
    const [path, active, total] = dwellSpy.mock.calls[0];
    expect(path).toBe('/');
    expect(total).toBe(3);
    expect(active).toBe(3);
  });

  it('stops accruing active seconds after 5s of no interaction', () => {
    dwellModule.dwell.start('/');
    // tick 1 → still active (last_interaction = start, 1s elapsed)
    // ticks 2-5 → still inside 5s window
    // tick 6 → 6s since last interaction → should NOT count
    vi.advanceTimersByTime(10_000);
    dwellModule.dwell.flush();

    const [, active, total] = dwellSpy.mock.calls[0];
    expect(total).toBe(10);
    expect(active).toBeLessThanOrEqual(5);
    expect(active).toBeGreaterThanOrEqual(4);
  });

  it('pauses active counter when document becomes hidden', () => {
    dwellModule.dwell.start('/');
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    vi.advanceTimersByTime(5_000);
    dwellModule.dwell.flush();

    const [, active, total] = dwellSpy.mock.calls[0];
    expect(total).toBe(5);
    expect(active).toBe(0);
  });

  it('resets counters after flush so subsequent ticks start at zero', () => {
    dwellModule.dwell.start('/');
    vi.advanceTimersByTime(2_000);
    dwellModule.dwell.flush();
    vi.advanceTimersByTime(2_000);
    dwellModule.dwell.flush();

    expect(dwellSpy).toHaveBeenCalledTimes(2);
    const [, , totalSecond] = dwellSpy.mock.calls[1];
    expect(totalSecond).toBe(2);
  });

  it('does not flush when no time has elapsed since reset', () => {
    dwellModule.dwell.start('/');
    dwellModule.dwell.flush();
    expect(dwellSpy).not.toHaveBeenCalled();
  });

  it('starting the same path twice is a no-op', () => {
    dwellModule.dwell.start('/');
    vi.advanceTimersByTime(2_000);
    dwellModule.dwell.start('/');
    vi.advanceTimersByTime(1_000);
    dwellModule.dwell.flush();

    expect(dwellSpy).toHaveBeenCalledTimes(1);
    const [, , total] = dwellSpy.mock.calls[0];
    expect(total).toBe(3);
  });

  it('starting a new path flushes the previous one', () => {
    dwellModule.dwell.start('/');
    vi.advanceTimersByTime(2_000);
    dwellModule.dwell.start('/cases/ai-crm');
    vi.advanceTimersByTime(1_000);
    dwellModule.dwell.flush();

    expect(dwellSpy).toHaveBeenCalledTimes(2);
    expect(dwellSpy.mock.calls[0][0]).toBe('/');
    expect(dwellSpy.mock.calls[1][0]).toBe('/cases/ai-crm');
  });

  it('flushes and stops at the 30 minute hard cap', () => {
    dwellModule.dwell.start('/');
    vi.advanceTimersByTime(1_801_000);

    expect(dwellSpy).toHaveBeenCalledTimes(1);
    const [, , total] = dwellSpy.mock.calls[0];
    expect(total).toBe(1_800);

    // After hard cap: subsequent ticks must not accrue more.
    vi.advanceTimersByTime(60_000);
    dwellModule.dwell.flush();
    expect(dwellSpy).toHaveBeenCalledTimes(1);
  });
});
