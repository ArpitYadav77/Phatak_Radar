import Icon from './Icon';
import { P } from '../../styles/palette';

export default function KPICard({ icon, label, value, change, trend, color = P.text2 }) {
  const isPositive = trend === 'up';
  const isNeutral = trend === 'neutral';

  return (
    <div style={{
      backgroundColor: P.card,
      border: `1px solid ${P.border}`,
      borderRadius: '8px',
      padding: '1.125rem 1.375rem',
      transition: 'background-color 0.2s',
      cursor: 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = P.cardHover;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = P.card;
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.875rem'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '6px',
          backgroundColor: P.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${P.border}`
        }}>
          <Icon name={icon} size={18} color={color} />
        </div>

        {change !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.1875rem 0.5rem',
            borderRadius: '4px',
            border: `1px solid ${P.border}`,
            fontSize: '0.6875rem',
            fontWeight: '500',
            color: P.muted,
            fontVariantNumeric: 'tabular-nums'
          }}>
            <span>{isNeutral ? '=' : (isPositive ? '↑' : '↓')}</span>
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '500',
          color: P.text2,
          marginBottom: '0.375rem'
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '1.875rem',
          fontWeight: '600',
          color: P.text,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}
