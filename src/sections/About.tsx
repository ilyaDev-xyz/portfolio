import { SectionHead } from '../components/atoms';
import { useT } from '../i18n/LangContext';

export function About() {
  const t = useT();
  const A = t.about;
  return (
    <section className="section about has-top-glow" id="about" data-screen-label="02 About">
      <div className="about-glow" aria-hidden="true" />
      <div className="container">
        <SectionHead no="02" title={t.ui.sectionAbout} />
        <div className="grid">
          <div className="pull">
            <div className="q">
              {A.pullQuote[0]}
              <span className="ac">{A.pullQuote[1]}</span>
              {A.pullQuote[2]}
            </div>
          </div>
          <div className="body">
            {A.paragraphs.map((p, i) => (
              <p key={i} style={{ margin: 0 }}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
