import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LangContext';

export function NotFoundPage() {
  const { t } = useLang();

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    meta.setAttribute('data-not-found', 'true');
    document.head.appendChild(meta);
    return () => {
      document.head.querySelectorAll('meta[data-not-found="true"]').forEach((n) => n.remove());
    };
  }, []);

  return (
    <main className="page" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 'var(--space-8) var(--space-4)' }}>
      <div style={{ textAlign: 'center', maxWidth: '40ch' }}>
        <div className="mono" style={{ marginBottom: 'var(--space-3)', opacity: 0.6 }}>404</div>
        <h1 className="display" style={{ marginBottom: 'var(--space-3)' }}>{t.ui.notFoundTitle}</h1>
        <p style={{ marginBottom: 'var(--space-5)', opacity: 0.8 }}>{t.ui.notFoundMessage}</p>
        <Link to="/" className="btn btn-primary">{t.ui.notFoundBack}</Link>
      </div>
    </main>
  );
}
