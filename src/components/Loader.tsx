import { useEffect, useState } from 'react';

type Phase = 'pulse' | 'rush' | 'reveal' | 'gone';

/**
 * Full-screen loader. Pulsing hairline aligned to the real Hero↔About divider.
 * On fonts ready → two whiteish pulses rush from edges to center → small flash →
 * the whole overlay fades out while the interface runs its own staggered entrance
 * animations (see styles.css). Respects prefers-reduced-motion.
 */
export function Loader() {
  const [phase, setPhase] = useState<Phase>('pulse');

  // Align the loader's hairline Y to the real Hero section's bottom, wait for
  // fonts (with a hard timeout so we never hang), then kick the sequence.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minDelay = new Promise<void>((r) => setTimeout(r, 600));
    const fontsReady = Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      // Fallback: even if Google Fonts never loads, don't hang the loader.
      new Promise<void>((r) => setTimeout(r, 3000)),
    ]).catch(() => undefined);

    let cancelled = false;

    function alignLine() {
      const hero = document.getElementById('home');
      if (!hero) return;
      const y = hero.getBoundingClientRect().bottom;
      document.documentElement.style.setProperty('--loader-line-y', `${y}px`);
    }
    alignLine();

    Promise.all([fontsReady, minDelay]).then(() => {
      if (cancelled) return;
      alignLine();
      setPhase(reduced ? 'reveal' : 'rush');
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Drive the phase sequence.
  //   rush   — pulses travel edges → center (600ms), loader starts fading out
  //            mid-phase so the hero lights up BEFORE the pulses collide.
  //   reveal — reduced-motion path: simple opacity fade (500ms).
  useEffect(() => {
    const timings: Partial<Record<Phase, { next: Phase; ms: number }>> = {
      rush: { next: 'gone', ms: 900 },
      reveal: { next: 'gone', ms: 500 },
    };
    const step = timings[phase];
    if (!step) return;
    const t = setTimeout(() => setPhase(step.next), step.ms);
    return () => clearTimeout(t);
  }, [phase]);

  // Trigger the interface entrance early so the light starts turning on BEFORE
  // the pulses meet at center. Works on both normal (rush) and reduced-motion
  // (reveal) paths — for reduced, remove immediately.
  useEffect(() => {
    if (phase === 'rush') {
      const t = setTimeout(() => {
        document.documentElement.classList.remove('is-loading');
        document.documentElement.style.overflow = '';
      }, 400);
      return () => clearTimeout(t);
    }
    if (phase === 'reveal' || phase === 'gone') {
      document.documentElement.classList.remove('is-loading');
      document.documentElement.style.overflow = '';
    }
  }, [phase]);

  // Lock page scroll on mount. Reveal/gone/cleanup all restore it.
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div className={`loader loader--${phase}`} aria-hidden="true">
      <div className="loader-line" />
      <div className="loader-pulse loader-pulse--left" />
      <div className="loader-pulse loader-pulse--right" />
    </div>
  );
}
