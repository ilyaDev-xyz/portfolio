import { forwardRef, type MouseEvent } from 'react';
import { Link, useLocation, type LinkProps } from 'react-router-dom';
import { useTransitionNavigate } from '../hooks/useTransitionNavigate';
import { setSuppressVideoMorph } from '../state/transitionState';
import { pauseAllActiveVideos } from '../state/videoState';

/**
 * Drop-in replacement for react-router's <Link>. When the browser supports
 * startViewTransition, intercepts the click and routes through
 * useTransitionNavigate so view-transition snapshots fire. Otherwise lets
 * <Link> handle the navigation normally.
 */
export const TransitionLink = forwardRef<HTMLAnchorElement, LinkProps>(
  function TransitionLink({ to, onClick, children, ...rest }, ref) {
    const location = useLocation();
    const navigate = useTransitionNavigate();

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (typeof to !== 'string') return;

      // Home-bound navigation (`/`, `/#hash`, `/?query`): pre-pause every
      // active video so cards re-mount with autoplay=0 instead of all
      // bursting into playback at once.
      const isHomeBound =
        to === '/' || to.startsWith('/#') || to.startsWith('/?');
      if (isHomeBound) pauseAllActiveVideos();

      if (!('startViewTransition' in document)) return;

      // Case→case: strip view-transition-name from both pages so the named
      // morph collapses into a clean root crossfade. Without this, two
      // independent fade groups (old `video-X` + new `video-Y`) play at the
      // same screen position with different content + on a different
      // timeline than root — visibly chaotic. Same applies to the title and
      // lede that share names with the next case's elements.
      // OLD page: clear inline name via DOM right before snapshot.
      // NEW page: ProjectDetailPage reads the suppress flag on its key={slug}
      // remount and renders without the name.
      const isCaseToCase =
        location.pathname.startsWith('/cases/') && to.startsWith('/cases/');
      if (isCaseToCase) {
        document
          .querySelectorAll('.case-video-frame, .case-hero-top h1, .case-hero-top .lede')
          .forEach((el) => {
            (el as HTMLElement).style.viewTransitionName = '';
          });
        setSuppressVideoMorph(true);
      }

      e.preventDefault();
      navigate(to);
    };

    return (
      <Link to={to} onClick={handleClick} ref={ref} {...rest}>
        {children}
      </Link>
    );
  },
);
