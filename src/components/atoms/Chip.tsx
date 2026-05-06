type Props = { k?: string; v: string; glyph?: string };

export function Chip({ k, v, glyph }: Props) {
  return (
    <span className="chip">
      {glyph && <span className="glyph">{glyph}</span>}
      {k && <span style={{ color: 'var(--fg-mute)' }}>{k}</span>}
      <span>{v}</span>
    </span>
  );
}
