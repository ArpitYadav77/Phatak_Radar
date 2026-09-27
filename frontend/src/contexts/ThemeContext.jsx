import { createContext, useContext, useState, useEffect } from 'react';
import { P } from '../styles/palette';

const ThemeContext = createContext();

export const themes = {
  // Control-room palette — keep in sync with styles/palette.js
  dark: {
    // Backgrounds
    app: P.bg,
    container: P.sidebar,
    card: P.card,
    cardHover: P.cardHover,
    elevated: P.cardHover,

    // Text
    primary: P.text,
    secondary: P.text2,
    tertiary: P.text2,
    muted: P.muted,

    // Borders
    subtle: P.border,
    medium: P.border,
    strong: P.muted,

    // Accent
    accent: P.gold,
    accentBg: P.goldBg,

    // Status
    safe: P.success,
    safeBg: P.successBg,
    safeText: P.successText,
    alert: P.danger,
    alertBg: P.dangerBg,
    alertText: P.dangerText,
    warning: P.warning,
    warningBg: P.warningBg,
    warningText: P.warning,
    unknown: P.muted,
    unknownBg: 'rgba(100, 114, 134, 0.14)',
    unknownText: P.text2,

    // Brand colors
    brand: {
      navy: P.sidebar,
      teal: P.gold,
      indigo: P.sidebar
    },

    // Shadow
    shadow: 'none',
    cardShadow: 'none',
    cardHoverShadow: 'none'
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
