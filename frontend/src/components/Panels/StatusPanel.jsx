import { useMemo } from 'react';

export default function StatusPanel({ phataks, trains }) {
  const stats = useMemo(() => {
    if (!phataks || phataks.length === 0) {
      return { total: 0, open: 0, closed: 0, unknown: 0 };
    }

    return {
      total: phataks.length,
      open: phataks.filter(p => p.status?.toLowerCase() === 'open').length,
      closed: phataks.filter(p => p.status?.toLowerCase() === 'closed').length,
      unknown: phataks.filter(p => !p.status || p.status?.toLowerCase() === 'unknown').length
    };
  }, [phataks]);

  const trainStats = useMemo(() => {
    if (!trains || trains.length === 0) {
      return { total: 0, onTime: 0, delayed: 0, affectingPhataks: 0 };
    }

    const affectingPhataks = new Set();
    trains.forEach(train => {
      if (train.affectedPhataks && train.affectedPhataks.length > 0) {
        train.affectedPhataks.forEach(p => affectingPhataks.add(p.phatakId));
      }
    });

    return {
      total: trains.length,
      onTime: trains.filter(t => t.delayMinutes === 0).length,
      delayed: trains.filter(t => t.delayMinutes > 0).length,
      affectingPhataks: affectingPhataks.size
    };
  }, [trains]);

  const StatCard = ({ label, value, icon, iconColor, subtitle, animated }) => (
    <div style={{
      backgroundColor: '#1e293b',
      padding: '1.25rem',
      borderRadius: '12px',
      border: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      transition: 'transform 0.2s',
      cursor: 'default'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        {label}
      </div>
      <div style={{ 
        fontSize: '2.5rem', 
        fontWeight: 700, 
        color: '#f8fafc', 
        lineHeight: 1,
        animation: animated ? 'pulse 2s ease-in-out infinite' : 'none'
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{subtitle}</div>
      )}
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <h3 style={{ 
        color: '#94a3b8', 
        marginTop: 0, 
        marginBottom: 0,
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>STATUS OVERVIEW</h3>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <StatCard 
          label="Total Phataks" 
          value={stats.total} 
          icon="🔵"
          iconColor="#60a5fa"
          subtitle="Detected in view"
        />
        <StatCard 
          label="Open" 
          value={stats.open} 
          icon="🟢"
          iconColor="#34d399"
          subtitle="Safe to cross"
        />
        <StatCard 
          label="Closed" 
          value={stats.closed} 
          icon="🔴"
          iconColor="#f87171"
          subtitle="Train approaching"
          animated={stats.closed > 0}
        />
        <StatCard 
          label="Unknown" 
          value={stats.unknown} 
          icon="⚪"
          iconColor="#94a3b8"
          subtitle="No recent data"
        />
      </div>

      {/* Train Statistics */}
      <h3 style={{ 
        color: '#94a3b8', 
        marginTop: '1rem', 
        marginBottom: 0,
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>LIVE TRAINS</h3>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <StatCard 
          label="Active Trains" 
          value={trainStats.total} 
          icon="🚂"
          subtitle="In this area"
          animated={true}
        />
        <StatCard 
          label="On Time" 
          value={trainStats.onTime} 
          icon="✅"
          subtitle="No delays"
        />
        <StatCard 
          label="Delayed" 
          value={trainStats.delayed} 
          icon="⚠️"
          subtitle="Running late"
        />
        {trainStats.affectingPhataks > 0 && (
          <StatCard 
            label="Affected Crossings" 
            value={trainStats.affectingPhataks} 
            icon="⛔"
            subtitle="Currently closed"
            animated={true}
          />
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
