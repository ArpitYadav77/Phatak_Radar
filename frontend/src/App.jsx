import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Navigation/Sidebar';
import Dashboard from './pages/Dashboard';
import Trains from './pages/Trains';
import Analytics from './pages/Analytics';
import { useTheme } from './contexts/ThemeContext';

export default function App() {
  const { theme } = useTheme();
  
  return (
    <BrowserRouter>
      <div style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: theme.app,
        overflow: 'hidden'
      }}>
        <Sidebar />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden'
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trains" element={<Trains />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
          
          {/* Personal Signature Footer */}
          <footer style={{
            padding: '0.75rem 2rem',
            borderTop: `1px solid ${theme.subtle}`,
            backgroundColor: theme.container,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: theme.muted,
            fontWeight: '500'
          }}>
            <span style={{ color: theme.accent }}>🚉</span>
            <span>Phatak Radar</span>
            <span style={{ color: theme.subtle }}>•</span>
            <span>Designed & engineered by Arpit</span>
            <span style={{ color: theme.subtle }}>•</span>
            <span style={{ color: theme.tertiary, fontSize: '0.6875rem' }}>Engineering safety, thoughtfully</span>
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
}
