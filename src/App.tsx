import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import { LangProvider } from './i18n/LangContext';
import { ThemeProvider } from './theme/ThemeContext';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ScrollToHash } from './router/ScrollToHash';
import { AnalyticsRouteTracker } from './router/AnalyticsRouteTracker';
import { Loader } from './components/Loader';

// Force a remount on slug change so useState init / useEffect re-fire.
// Needed for the case→case view-transition suppress flag (transitionState)
// and to keep LiteYouTube state scoped per-case rather than leaking across
// project routes.
function CaseRoute() {
  const { slug } = useParams<{ slug: string }>();
  return <ProjectDetailPage key={slug ?? ''} />;
}

export function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <BrowserRouter>
          <Loader />
          <ScrollToHash />
          <AnalyticsRouteTracker />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cases/:slug" element={<CaseRoute />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </LangProvider>
    </ThemeProvider>
  );
}
