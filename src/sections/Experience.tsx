import { SectionHead } from '../components/atoms';
import { useT } from '../i18n/LangContext';

export function Experience() {
  const t = useT();
  const X = t.experience;
  return (
    <section className="section xp" id="timeline" data-screen-label="04 Timeline">
      <div className="container">
        <SectionHead no="04" title={t.ui.sectionTimeline} />
        <div className="xp-list">
          {X.map((r, i) => {
            const yearMatch = r.when.match(/\b(20\d{2})\b/);
            const year = yearMatch ? yearMatch[1] : '';
            return (
              <div className="xp-row" key={i}>
                {year && (
                  <div className="xp-watermark" aria-hidden="true">
                    {year}
                  </div>
                )}
                <div className="when">{r.when}</div>
                <div className="what">
                  <h4>{r.title}</h4>
                  <p>{r.body}</p>
                </div>
                <div className="tag">{r.tag}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
