import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  dark: {
    // Backgrounds
    app: '#0a0f1e',
    container: '#1a2332',
    card: '#1e293b',
    cardHover: '#273548',
    elevated: '#334155',
    
    // Text
    primary: '#f1f5f9',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    muted: '#64748b',
    
    // Borders
    subtle: '#334155',
    medium: '#475569',
    strong: '#64748b',
    
    // Accent
    accent: '#14b8a6',
    accentBg: '#14b8a620',
    
    // Status
    safe: '#10b981',
    safeBg: '#10b98120',
    safeText: '#6ee7b7',
    alert: '#ef4444',
    alertBg: '#ef444420',
    alertText: '#fca5a5',
    warning: '#f59e0b',
    warningBg: '#f59e0b20',
    warningText: '#fbbf24',
    unknown: '#64748b',
    unknownBg: '#64748b20',
    unknownText: '#94a3b8',
    
    // Brand colors
    brand: {
      navy: '#1e40af',
      teal: '#14b8a6',
      indigo: '#1e3a8a'
    },
    
    // Shadow
    shadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    cardShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
    cardHoverShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
  },
  
  light: {
    // Backgrounds
    app: '#f8fafc',
    container: '#ffffff',
    card: '#ffffff',
    cardHover: '#f1f5f9',
    elevated: '#e2e8f0',
    
    // Text
    primary: '#0f172a',
    secondary: '#334155',
    tertiary: '#64748b',
    muted: '#94a3b8',
    
    // Borders
    subtle: '#e2e8f0',
    medium: '#cbd5e1',
    strong: '#94a3b8',
    
    // Accent
    accent: '#0891b2',
    accentBg: '#0891b220',
    
    // Status
    safe: '#059669',
    safeBg: '#d1fae5',
    safeText: '#047857',
    alert: '#dc2626',
    alertBg: '#fee2e2',
    alertText: '#b91c1c',
    warning: '#d97706',
    warningBg: '#fef3c7',
    warningText: '#b45309',
    unknown: '#6b7280',
    unknownBg: '#f3f4f6',
    unknownText: '#4b5563',
    
    // Brand colors
    brand: {
      navy: '#1e40af',
      teal: '#0891b2',
      indigo: '#3730a3'
    },
    
    // Shadow
    shadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
    cardShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cardHoverShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  }
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('phatak-theme');
    if (saved) {
      setIsDark(saved === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('phatak-theme', newTheme ? 'dark' : 'light');
  };

  const theme = isDark ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
