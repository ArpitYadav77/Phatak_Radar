import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import StatusPage from './pages/StatusPage';
import MapPage from './pages/MapPage';
import TrainsPage from './pages/TrainsPage';
import InsightsPage from './pages/InsightsPage';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell>
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<StatusPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/trains" element={<TrainsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/analytics" element={<Navigate to="/insights" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </ErrorBoundary>
        </AppShell>
      </AppProvider>
    </BrowserRouter>
  );
}
