import type { CSSProperties, ReactNode } from 'react';

type Props = {
  label: ReactNode;
  corner?: ReactNode;
  style?: CSSProperties;
  className?: string;
};

export function HatchPlaceholder({ label, corner, style, className }: Props) {
  return (
    <div className={'hatch ' + (className || '')} style={style}>
      {corner && <div className="hatch-corner">{corner}</div>}
      <div className="hatch-label">{label}</div>
    </div>
  );
}
