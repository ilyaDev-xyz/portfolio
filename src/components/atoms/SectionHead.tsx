type Props = { no: string; title: string; sub?: string };

export function SectionHead({ no, title, sub }: Props) {
  return (
    <div className="section-head">
      <div className="no">§ {no}</div>
      <div className="title">
        <h2>{title}</h2>
        {sub && <span className="sub">{sub}</span>}
      </div>
    </div>
  );
}
