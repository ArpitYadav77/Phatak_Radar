import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { load, save } from '../lib/storage';

const AppContext = createContext(null);

// Default crossing for first-time visitors (the project's home crossing).
const DEFAULT_CROSSING = { id: 'PTA-PK-23', label: 'Patiala Phatak 23 — Model Town', lat: 30.34023, lng: 76.36658 };

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => load('pr-theme', 'dark'));
  const [selected, setSelected] = useState(() => load('pr-selected', DEFAULT_CROSSING));
  const [recents, setRecents] = useState(() => load('pr-recents', []));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0F1724' : '#FFFFFF');
    save('pr-theme', theme);
  }, [theme]);

  const selectCrossing = useCallback((c) => {
    if (!c?.id) return;
    const entry = { id: c.id, label: c.name || c.label || c.id, lat: c.lat ?? null, lng: c.lng ?? null };
    setSelected(entry);
    save('pr-selected', entry);
    setRecents((prev) => {
      const next = [entry, ...prev.filter((r) => r.id !== entry.id)].slice(0, 6);
      save('pr-recents', next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    selected,
    selectCrossing,
    recents,
  }), [theme, selected, selectCrossing, recents]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
