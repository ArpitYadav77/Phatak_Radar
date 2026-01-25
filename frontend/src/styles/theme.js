// Phatak Radar Theme - Railway-Inspired Design System
// Calm, Reliable, Safety-First

export const theme = {
  // PRIMARY BRAND COLORS - Deep Indigo/Navy (Authority & Trust)
  primary: {
    darker: '#1e3a8a',    // Deep navy for main containers
    dark: '#1e40af',      // Headers, navigation
    base: '#2563eb',      // Interactive elements
    light: '#3b82f6',     // Hover states
    lighter: '#60a5fa'    // Subtle highlights
  },

  // SECONDARY ACCENT - Indian Railway Teal/Cyan
  accent: {
    darker: '#0e7490',    // Deep teal
    dark: '#0891b2',      // Active states
    base: '#14b8a6',      // Main accent color
    light: '#2dd4bf',     // Highlights
    cyan: '#06b6d4'       // Alternative cyan
  },

  // STATUS COLORS (Semantic only - never decorative)
  status: {
    // OPEN / SAFE - Muted Green
    safe: {
      base: '#10b981',
      bg: '#10b98120',
      text: '#6ee7b7'
    },
    // CLOSED / ALERT - Warm Red (desaturated)
    alert: {
      base: '#ef4444',
      bg: '#ef444420',
      text: '#fca5a5'
    },
    // DELAY / WARNING - Amber
    warning: {
      base: '#f59e0b',
      bg: '#f59e0b20',
      text: '#fbbf24'
    },
    // UNKNOWN - Neutral Grey-Blue
    unknown: {
      base: '#64748b',
      bg: '#64748b20',
      text: '#94a3b8'
    }
  },

  // BACKGROUNDS - Dark with slight warmth
  background: {
    app: '#0a0f1e',          // Main app background (deeper navy)
    container: '#1a2332',     // Primary containers (navy-tinted)
    card: '#1e293b',          // Cards (slate)
    cardHover: '#273548',     // Card hover
    elevated: '#334155'       // Elevated surfaces
  },

  // TEXT - Clear hierarchy
  text: {
    primary: '#f1f5f9',       // Main text
    secondary: '#cbd5e1',     // Secondary text
    tertiary: '#94a3b8',      // Labels, captions
    muted: '#64748b',         // Disabled, subtle
    accent: '#14b8a6'         // Accent text
  },

  // BORDERS - Subtle separation
  border: {
    subtle: '#334155',        // Default borders
    medium: '#475569',        // Visible borders
    strong: '#64748b',        // Strong dividers
    accent: '#14b8a6'         // Accent borders
  },

  // CHART COLORS (Analytics) - Muted, not saturated
  chart: {
    trains: '#3b82f6',        // Blue family
    closures: '#ef4444',      // Red family
    speed: '#8b5cf6',         // Violet
    traffic: '#14b8a6',       // Teal
    grid: '#1e293b',          // Very low contrast
    text: '#94a3b8'           // Chart labels
  },

  // SHADOWS - Instrument feel
  shadow: {
    inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    card: '0 1px 3px rgba(0, 0, 0, 0.3)',
    cardHover: '0 4px 12px rgba(0, 0, 0, 0.4)',
    glow: '0 0 20px rgba(20, 184, 166, 0.3)'  // Teal glow
  },

  // SPACING - Calm, breathing room
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },

  // BORDER RADIUS - Medium, not large
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px'
  },

  // TYPOGRAPHY WEIGHTS
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
};

// HUMAN-FRIENDLY MICROCOPY
export const copy = {
  status: {
    open: 'Safe to cross',
    closed: 'Crossing blocked',
    onTime: 'On schedule',
    delayed: 'Delayed',
    unknown: 'Status unknown'
  },
  time: {
    justNow: 'Updated just now',
    approaching: 'Train approaching this crossing'
  },
  signature: 'Designed & engineered by Arpit'
};
