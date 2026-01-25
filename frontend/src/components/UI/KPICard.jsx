export default function KPICard({ icon, label, value, change, trend, color = '#14b8a6' }) {
  const isPositive = trend === 'up';
  const isNeutral = trend === 'neutral';

  return (
    <div style={{
      backgroundColor: '#1a2332',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '1rem 1.5rem',
      transition: 'all 0.2s',
      cursor: 'default',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
      borderLeft: `3px solid transparent`
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderLeftColor = color;
      e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderLeftColor = 'transparent';
      e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3)';
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.625rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          border: `1px solid ${color}30`
        }}>
          {icon}
        </div>

        {change !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.625rem',
            borderRadius: '6px',
            backgroundColor: isNeutral ? '#64748b20' : (isPositive ? '#10b98120' : '#ef444420'),
            fontSize: '0.75rem',
            fontWeight: '600',
            color: isNeutral ? '#94a3b8' : (isPositive ? '#6ee7b7' : '#fca5a5')
          }}>
            <span>{isNeutral ? '=' : (isPositive ? '↑' : '↓')}</span>
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: '600',
          color: '#94a3b8',
          letterSpacing: '0.025em',
          marginBottom: '0.375rem',
          opacity: 0.8
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#f1f5f9',
          lineHeight: 1,
          letterSpacing: '-0.025em'
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}
