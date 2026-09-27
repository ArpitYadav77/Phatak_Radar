import { NavLink, Link } from 'react-router-dom';
import Icon from '../UI/Icon';
import Logo from '../UI/Logo';
import { useApp } from '../../context/AppContext';
import { usePolling } from '../../hooks/usePolling';
import { api } from '../../lib/api';

const NAV = [
  { to: '/', label: 'Status', icon: 'status', end: true },
  { to: '/map', label: 'Map', icon: 'map' },
  { to: '/trains', label: 'Trains', icon: 'list' },
  { to: '/insights', label: 'Insights', icon: 'chart' },
];

function DataPill() {
  const health = usePolling((signal) => api.health({ signal }), 60000);
  let dot = 'dot pulse';
  let text = 'Connecting…';
  if (health.error && !health.data) { dot = 'dot off'; text = 'Server unreachable'; }
  else if (health.data) {
    const rr = health.data.sources?.railradar;
    if (rr === 'ok') text = 'Timetable + live';
    else if (rr === 'error' || rr === 'over-budget') { dot = 'dot warn'; text = 'Live data unavailable'; }
    else text = 'Timetable data';
  }
  return (
    <span className="live-pill" title="Where the data comes from">
      <span className={dot} />{text}
    </span>
  );
}

export default function AppShell({ children }) {
  const { theme, toggleTheme } = useApp();
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Phatak Radar home">
          <Logo size={30} showText={false} />
          <span className="brand-name"><span>Phatak</span> Radar</span>
        </Link>
        <div className="topbar-actions">
          <DataPill />
          <button className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </header>

      <div className="shell">
        <nav className="sidenav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
              <Icon name={n.icon} size={20} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <main className="main" id="main">
          {children}
          <footer className="footer-note">
            <span><strong>Unofficial estimate.</strong> Always obey the gate and railway signals.</span>
            <span>Crossings & track: © OpenStreetMap contributors</span>
            <span>Goods trains have no public schedule — they appear only through user reports.</span>
          </footer>
        </main>
      </div>

      <nav className="tabbar" aria-label="Main">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
            <Icon name={n.icon} size={22} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
