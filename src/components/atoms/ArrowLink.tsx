import type { ReactNode } from 'react';
import { TransitionLink } from '../TransitionLink';
import { analytics, classifyOutbound } from '../../lib/analytics';

type Props = {
  children: ReactNode;
  href?: string;
  external?: boolean;
  className?: string;
};

export function ArrowLink({ children, href, external, className }: Props) {
  const cls = 'link ' + (className || '');
  const arrow = external ? '↗' : '→';
  const target = href || '#';

  // External links, hash links, and placeholder "#" — use <a>.
  // Internal routed paths (start with "/") — use <Link>.
  const isInternal = !external && target.startsWith('/');

  if (isInternal) {
    return (
      <TransitionLink className={cls} to={target}>
        <span>{children}</span>
        <span>{arrow}</span>
      </TransitionLink>
    );
  }

  const onClick = external
    ? () => {
        const kind = classifyOutbound(target);
        if (kind) analytics.outbound(kind, target);
      }
    : undefined;

  return (
    <a
      className={cls}
      href={target}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={onClick}
    >
      <span>{children}</span>
      <span>{arrow}</span>
    </a>
  );
}
