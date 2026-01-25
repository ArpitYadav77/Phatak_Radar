import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        width: '100%',
        padding: '1rem 1.25rem',
        backgroundColor: 'transparent',
        border: '1px solid #334155',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        transition: 'all 0.2s',
        color: '#cbd5e1',
        overflow: 'visible'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#334155';
        e.currentTarget.style.borderColor = '#14b8a6';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderColor = '#334155';
      }}
    >
      <div style={{
        fontSize: '1.5rem',
        lineHeight: 1,
        minWidth: '32px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {isDark ? '🌙' : '☀️'}
      </div>
      <div style={{
        fontSize: '0.875rem',
        fontWeight: '600',
        textAlign: 'left',
        flex: 1
      }}>
        <div>{isDark ? 'Dark mode' : 'Light mode'}</div>
        <div style={{
          fontSize: '0.6875rem',
          color: '#64748b',
          fontWeight: '500',
          marginTop: '0.125rem'
        }}>
          {isDark ? 'Switch to light' : 'Switch to dark'}
        </div>
      </div>
    </button>
  );
}
