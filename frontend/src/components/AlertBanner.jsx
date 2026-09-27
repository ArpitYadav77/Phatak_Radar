import { useState } from 'react';
import { useRailway } from '../context/RailwayContext';
import Icon from './UI/Icon';
import { P } from '../styles/palette';

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
  const tone = isCritical
    ? { surface: P.dangerSurface, accent: P.danger, text: P.dangerText, chipBg: P.dangerBg, line: P.dangerBorder }
    : { surface: P.warningSurface, accent: P.warning, text: P.warning, chipBg: P.warningBg, line: P.warningBorder };

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
        @keyframes alertDot { 0%, 100% { box-shadow: 0 0 0 0 rgba(201, 75, 75, 0.55); } 70% { box-shadow: 0 0 0 7px rgba(201, 75, 75, 0); } }
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <div style={{
        backgroundColor: tone.surface,
        color: P.text,
        padding: '0.625rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        animation: 'slideDown 0.3s ease-out',
        flexShrink: 0,
        zIndex: 100,
        borderBottom: `1px solid ${tone.line}`,
        boxShadow: `inset 3px 0 0 ${tone.accent}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
          {isCritical ? (
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: tone.accent, animation: 'alertDot 1.6s ease-out infinite', flexShrink: 0 }} />
          ) : (
            <Icon name="alert" size={16} color={tone.accent} />
          )}
          <strong style={{ fontSize: '0.75rem', letterSpacing: '0.06em', fontWeight: 600, color: tone.text }}>
            {isCritical ? 'CLOSE GATE — TRAIN IN CROSSING WINDOW' : 'PREPARE TO CLOSE GATE — TRAIN APPROACHING'}
          </strong>
          {activePhataks.map((p) => {
            const st = p.liveStatus?.scheduledTrain;
            const mins = p.liveStatus?.minutesToCrossing;
            return (
              <span key={p.phatakId} style={{ backgroundColor: tone.chipBg, border: `1px solid ${tone.line}`, padding: '0.1875rem 0.625rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 400, display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ fontWeight: 500 }}>{p.name}</span>
                {st && <span style={{ color: P.text2 }}>· {st.trainName} <span style={{ color: P.text, fontVariantNumeric: 'tabular-nums' }}>{st.scheduledTime}</span></span>}
                <span style={{ color: tone.text }}>{formatMins(mins)}</span>
              </span>
            );
          })}
        </div>
        <button
          onClick={() => setDismissed(dismissKey)}
          title="Dismiss"
          style={{ background: 'transparent', border: `1px solid ${tone.line}`, color: P.text2, cursor: 'pointer', padding: '0.3125rem', borderRadius: '4px', flexShrink: 0, display: 'flex' }}
        ><Icon name="close" size={14} /></button>
      </div>
    </>
  );
}
