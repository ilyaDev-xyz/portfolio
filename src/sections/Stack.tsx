import { Chip, SectionHead } from '../components/atoms';
import { useT } from '../i18n/LangContext';

export function Stack() {
  const t = useT();
  const S = t.stack;
  const preface = t.stackPreface;
  return (
    <section className="section stack" id="stack" data-screen-label="05 Stack">
      <div className="container">
        <SectionHead no="05" title={t.ui.sectionStack} />
        {preface && <p className="stack-preface">{preface}</p>}
        <div className="stack-strata">
          {S.map((c) => (
            <div key={c.label} className="stratum">
              <div className="stratum-label">{c.label}</div>
              <div className="stratum-items">
                {c.items.map((it) => (
                  <Chip key={it} v={it} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
