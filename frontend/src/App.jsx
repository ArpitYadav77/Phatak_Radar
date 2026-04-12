import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './components/Navigation/Sidebar';
import Dashboard from './pages/Dashboard';
import Trains from './pages/Trains';
import Analytics from './pages/Analytics';
import { useTheme } from './contexts/ThemeContext';
import { RailwayProvider, useRailway } from './context/RailwayContext';

function NotificationRequestor() {
  const { requestNotificationPermission } = useRailway();
  useEffect(() => {
    // Request notification permission after a brief delay
    const timer = setTimeout(() => requestNotificationPermission(), 2000);
    return () => clearTimeout(timer);
  }, [requestNotificationPermission]);
  return null;
}

function AppLayout() {
  const { theme } = useTheme();
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: theme.app,
      overflow: 'hidden',
    }}>
      <NotificationRequestor />
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trains" element={<Trains />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>

        {/* Personal Signature Footer */}
        <footer style={{
          padding: '0.625rem 2rem',
          borderTop: `1px solid ${theme.subtle}`,
          backgroundColor: theme.container,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: theme.muted,
          fontWeight: 500,
          flexShrink: 0,
        }}>
          <span style={{ color: theme.accent }}>🚉</span>
          <span>Phatak Radar</span>
          <span style={{ color: theme.subtle }}>•</span>
          <span>Designed &amp; engineered by Arpit</span>
          <span style={{ color: theme.subtle }}>•</span>
          <span style={{ color: theme.tertiary, fontSize: '0.6875rem' }}>Engineering safety, thoughtfully</span>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RailwayProvider>
        <AppLayout />
      </RailwayProvider>
    </BrowserRouter>
  );
}
