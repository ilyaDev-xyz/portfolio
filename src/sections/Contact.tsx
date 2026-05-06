import { ResumeLink } from '../components/ResumeLink';
import { useLang } from '../i18n/LangContext';

export function Contact() {
  const { lang, t } = useLang();
  const C = t.contact;
  return (
    <section className="contact bg-edge" id="contact" data-screen-label="06 Contact">
      <span className="edge-tick edge-tick--tl" aria-hidden="true" />
      <span className="edge-tick edge-tick--tr" aria-hidden="true" />
      <span className="edge-tick edge-tick--bl" aria-hidden="true" />
      <span className="edge-tick edge-tick--br" aria-hidden="true" />
      <div className="container">
        <div className="mono" style={{ marginBottom: 'var(--space-6)' }}>
          § 06 — Contact
        </div>
        <div className="wrap">
          <div className="pitch">
            <h2 className="display">
              {C.title[0]}
              <em>{C.title[1]}</em>
              {C.title[2]}
            </h2>
            <p>{C.sub}</p>
          </div>
          <div className="contact-side">
            <div className="contact-resume-row">
              <ResumeLink lang={lang} ui={t.ui} cv={t.cv} className="contact-resume" />
            </div>
            <div className="ways">
              {C.ways.map((w, i) => {
                const inner = (
                  <>
                    <span className="k">{w.k}</span>
                    <span className="v">{w.v}{w.href ? ' →' : ''}</span>
                  </>
                );
                return w.href ? (
                  <a key={i} className="way" href={w.href}>
                    {inner}
                  </a>
                ) : (
                  <div key={i} className="way way-static">
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
