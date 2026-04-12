import { useState } from 'react';
import { useRailway } from '../context/RailwayContext';

export default function AlertBanner() {
  const { phataks } = useRailway();
  const [dismissed, setDismissed] = useState(null); // dismissed phatakId+status key

  const criticalPhataks = phataks.filter(
    (p) => (p.liveStatus?.gateStatus || p.status) === 'CLOSED'
  );
  const warningPhataks = phataks.filter(
    (p) => (p.liveStatus?.gateStatus || p.status) === 'WARNING'
  );

  const isCritical = criticalPhataks.length > 0;
  const isWarning = !isCritical && warningPhataks.length > 0;

  if (!isCritical && !isWarning) return null;

  const activePhataks = isCritical ? criticalPhataks : warningPhataks;
  const bgColor = isCritical ? '#ef4444' : '#f59e0b';
  const icon = isCritical ? '🚨' : '⚠️';

  // Check if this exact state was dismissed
  const dismissKey = activePhataks.map((p) => `${p.phatakId}-${p.liveStatus?.gateStatus}`).join(',');
  if (dismissed === dismissKey) return null;

  const formatMins = (mins) => {
    if (mins == null) return '';
    const abs = Math.abs(Math.round(mins));
    if (abs === 0) return ' · passing NOW';
    if (mins > 0) return ` · ${abs} min to arrival`;
    return ` · passed ${abs} min ago`;
  };

  return (
    <>
      <style>{`
        @keyframes alertPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.87; } }
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <div style={{
        backgroundColor: bgColor,
        color: '#fff',
        padding: '0.625rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        animation: `${isCritical ? 'alertPulse 1.4s ease-in-out infinite, ' : ''}slideDown 0.3s ease-out`,
        flexShrink: 0,
        zIndex: 100,
        borderBottom: `2px solid ${isCritical ? '#b91c1c' : '#b45309'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
          <strong style={{ fontSize: '0.85rem', letterSpacing: '0.04em', fontWeight: 800 }}>
            {isCritical ? 'CLOSE GATE — TRAIN IN CROSSING WINDOW' : 'PREPARE TO CLOSE GATE — TRAIN APPROACHING'}
          </strong>
          {activePhataks.map((p) => {
            const st = p.liveStatus?.scheduledTrain;
            const mins = p.liveStatus?.minutesToCrossing;
            return (
              <span key={p.phatakId} style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.175rem 0.625rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                <span>{p.name}</span>
                {st && <span>· {st.trainName} {st.scheduledTime}</span>}
                <span style={{ opacity: 0.8 }}>{formatMins(mins)}</span>
              </span>
            );
          })}
        </div>
        <button
          onClick={() => setDismissed(dismissKey)}
          title="Dismiss"
          style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', flexShrink: 0 }}
        >✕</button>
      </div>
    </>
  );
}
