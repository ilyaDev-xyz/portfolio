import { useEffect, useRef, useState } from 'react';

type Result = { activeId: string; progress: number };

/**
 * Returns the active section id + progress (0..1) by dividing the scrollable
 * range [0, maxScroll] into sub-ranges weighted by each section's height.
 * Guarantees: scrollY = 0 → first section at progress 0; scrollY = maxScroll →
 * last section at progress 1. Every scroll pixel maps to some section.
 */
export function useActiveSection(ids: string[]): Result {
  const [state, setState] = useState<Result>({ activeId: ids[0] ?? '', progress: 0 });
  const rafRef = useRef<number | null>(null);
  const idsKey = ids.join('|');

  useEffect(() => {
    const list = idsKey.split('|').filter(Boolean);
    if (list.length === 0) return;

    function update() {
      const scrollY = window.scrollY;
      const viewH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const maxScroll = Math.max(1, docH - viewH);

      let totalHeight = 0;
      const heights: number[] = [];
      for (const id of list) {
        const el = document.getElementById(id);
        const h = el ? el.getBoundingClientRect().height : 0;
        heights.push(h);
        totalHeight += h;
      }
      if (totalHeight <= 0) return;

      // Weighted sub-ranges in scroll-space.
      let cumStart = 0;
      let activeIdx = 0;
      let progress = 0;
      for (let i = 0; i < list.length; i++) {
        const span = (heights[i] / totalHeight) * maxScroll;
        const start = cumStart;
        const end = i === list.length - 1 ? maxScroll : cumStart + span;
        if (scrollY >= start && (i === list.length - 1 || scrollY < end)) {
          activeIdx = i;
          progress = Math.max(0, Math.min(1, (scrollY - start) / Math.max(1, end - start)));
          break;
        }
        cumStart = end;
      }

      const activeId = list[activeIdx];
      setState((p) =>
        p.activeId === activeId && p.progress === progress ? p : { activeId, progress },
      );
    }

    function onScroll() {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        update();
      });
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [idsKey]);

  return state;
}
