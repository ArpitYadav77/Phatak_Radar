export default function StatusBadge({ status }) {
  const getStatusConfig = () => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'open':
        return { 
          bg: '#10b98120', 
          text: '#6ee7b7', 
          label: 'Safe to cross',
          icon: '✓'
        };
      case 'closed':
        return { 
          bg: '#ef444420', 
          text: '#fca5a5', 
          label: 'Crossing blocked',
          icon: '⚠'
        };
      case 'delayed':
        return { 
          bg: '#f59e0b20', 
          text: '#fbbf24', 
          label: 'Delayed',
          icon: '◷'
        };
      case 'on time':
      case 'ontime':
        return { 
          bg: '#10b98120', 
          text: '#6ee7b7', 
          label: 'On schedule',
          icon: '✓'
        };
      default:
        return { 
          bg: '#64748b20', 
          text: '#94a3b8', 
          label: 'Status unknown',
          icon: '○'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span style={{
      backgroundColor: config.bg,
      color: config.text,
      padding: '0.375rem 0.875rem',
      borderRadius: '8px',
      fontSize: '0.8125rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      border: `1px solid ${config.text}40`
    }}>
      <span style={{ fontSize: '0.625rem' }}>{config.icon}</span>
      {config.label}
    </span>
  );
}
