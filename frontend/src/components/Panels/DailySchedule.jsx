import { useState, useEffect, useMemo } from 'react';
import { getPhatakSchedule } from '../../api/phatak.api';

const STATUS_CONFIG = {
  'GATE CLOSED': { bg: '#ef4444', text: '#fff',     icon: '🔴', label: 'GATE CLOSED' },
  'WARNING':     { bg: '#f59e0b', text: '#0f172a',  icon: '⚠️', label: 'PREPARE' },
  'UPCOMING':    { bg: '#1e40af', text: '#93c5fd',  icon: '🕐', label: 'UPCOMING' },
  'PASSED':      { bg: '#1e293b', text: '#64748b',  icon: '✓',  label: 'PASSED' },
};

export default function DailySchedule({ phatak }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tick clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch schedule from backend (updates every 30s)
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await getPhatakSchedule();
      setSchedule(data);
      setIsLoading(false);
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Split schedule into relevant sections
  const { active, upcoming, passed } = useMemo(() => {
    const active = schedule.filter((t) => t.windowStatus === 'GATE CLOSED');
    const warning = schedule.filter((t) => t.windowStatus === 'WARNING');
    const upcoming = schedule.filter((t) => t.windowStatus === 'UPCOMING' && t.minutesUntil > 0);
    const passed = schedule.filter((t) => t.windowStatus === 'PASSED');

    return {
      active: [...active, ...warning],
      upcoming: upcoming.slice(0, 5),
      passed: passed.slice(-3).reverse(),
    };
  }, [schedule]);

  if (!phatak) {
    return (
      <div style={{ backgroundColor: '#1a2332', border: '1px solid #334155', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</div>
        <div>Select a phatak to view schedule</div>
      </div>
    );
  }

  const gateStatus = phatak.liveStatus?.gateStatus || phatak.status || 'OPEN';
  const scheduledTrain = phatak.liveStatus?.scheduledTrain;
  const minutesToCrossing = phatak.liveStatus?.minutesToCrossing;
  const method = phatak.liveStatus?.method || 'schedule';

  const gateBg   = { CLOSED: '#ef4444', WARNING: '#f59e0b', OPEN: '#10b981' }[gateStatus] || '#334155';
  const gateGlow = { CLOSED: '#ef444420', WARNING: '#f59e0b20', OPEN: '#10b98120' }[gateStatus] || 'transparent';

  const formatMins = (mins) => {
    if (mins == null) return '';
    const abs = Math.abs(Math.round(mins));
    if (abs === 0) return 'passing now';
    if (mins > 0) return `in ${abs} min`;
    return `${abs} min ago`;
  };

  return (
    <div style={{ backgroundColor: '#1a2332', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ── */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #334155', backgroundColor: '#0f172a', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.875rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>SELECTED CROSSING</div>
            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1rem' }}>{phatak.name}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {phatak.lat?.toFixed(4)}°N, {phatak.lng?.toFixed(4)}°E · {phatak.district || 'Patiala'}, Punjab
            </div>
          </div>

          {/* Gate status badge */}
          <div style={{
            backgroundColor: gateBg,
            color: '#fff',
            padding: '0.375rem 0.875rem',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            animation: gateStatus === 'CLOSED' ? 'pulse 1.2s infinite' : 'none',
            flexShrink: 0,
            boxShadow: `0 0 12px ${gateGlow}`,
          }}>
            {gateStatus === 'CLOSED' ? '🔴' : gateStatus === 'WARNING' ? '🟡' : '🟢'}
            GATE {gateStatus}
          </div>
        </div>

        {/* Scheduled train in window */}
        {scheduledTrain && (
          <div style={{
            backgroundColor: gateStatus === 'CLOSED' ? '#7f1d1d30' : gateStatus === 'WARNING' ? '#78350f30' : '#14532d30',
            border: `1px solid ${gateStatus === 'CLOSED' ? '#f87171' : gateStatus === 'WARNING' ? '#fbbf24' : '#34d399'}40`,
            borderRadius: '6px',
            padding: '0.625rem 0.875rem',
            marginBottom: '0.625rem',
          }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              {gateStatus === 'CLOSED' ? 'TRAIN IN CLOSURE WINDOW' : gateStatus === 'WARNING' ? 'APPROACHING — PREPARE TO CLOSE' : 'NEXT TRAIN'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: '#14b8a6', marginRight: '0.5rem' }}>
                  #{scheduledTrain.trainNumber}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>
                  {scheduledTrain.trainName}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: gateStatus === 'CLOSED' ? '#fca5a5' : '#fbbf24' }}>
                  {scheduledTrain.scheduledTime}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                  {formatMins(minutesToCrossing)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logic source + clock */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#475569' }}>
          <div>
            <span style={{ color: method === 'gps' ? '#14b8a6' : '#6366f1' }}>
              {method === 'gps' ? '📡 GPS + Schedule' : '🕐 Schedule-based (±10 min)'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 2s infinite' }} />
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {/* ── Schedule Body ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading schedule...</div>
        ) : (
          <>
            {/* Active / Warning trains */}
            {active.length > 0 && (
              <Section label="RIGHT NOW">
                {active.map((t, i) => <TrainRow key={i} train={t} highlight />)}
              </Section>
            )}

            {/* Upcoming trains */}
            {upcoming.length > 0 && (
              <Section label="UPCOMING">
                {upcoming.map((t, i) => <TrainRow key={i} train={t} />)}
              </Section>
            )}

            {/* Recently passed */}
            {passed.length > 0 && (
              <Section label="RECENTLY PASSED">
                {passed.map((t, i) => <TrainRow key={i} train={t} dim />)}
              </Section>
            )}

            {schedule.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚂</div>
                No schedule data
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #334155', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569', flexShrink: 0 }}>
        <span>Gate closes 10 min before · reopens 10 min after</span>
        <span>{schedule.length} trains/day</span>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
      `}</style>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <div style={{ padding: '0.5rem 1.5rem', fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: '#0f172a50', borderBottom: '1px solid #1e293b' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function TrainRow({ train, highlight, dim }) {
  const cfg = STATUS_CONFIG[train.windowStatus] || STATUS_CONFIG['UPCOMING'];
  const { minutesUntil, scheduledTime, trainName, trainNumber, direction, windowStatus } = train;

  const formatMins = (m) => {
    const abs = Math.abs(Math.round(m));
    if (m > 0) return `in ${abs} min`;
    if (Math.abs(m) === 0) return 'NOW';
    return `${abs} min ago`;
  };

  return (
    <div
      style={{
        padding: '0.875rem 1.5rem',
        borderBottom: '1px solid #1e293b',
        borderLeft: highlight ? `3px solid ${cfg.bg}` : '3px solid transparent',
        opacity: dim ? 0.5 : 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        transition: 'background-color 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b40')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#14b8a6' }}>#{trainNumber}</span>
          <span style={{
            padding: '0.1rem 0.375rem',
            backgroundColor: cfg.bg,
            color: cfg.text,
            borderRadius: '3px',
            fontSize: '0.55rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}>
            {cfg.icon} {cfg.label}
          </span>
          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
            {direction === 'UP' ? '↑ UP (→ Amritsar)' : '↓ DOWN (→ Delhi)'}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: dim ? '#64748b' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {trainName}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '0.925rem', fontWeight: 700, color: dim ? '#475569' : windowStatus === 'GATE CLOSED' ? '#fca5a5' : windowStatus === 'WARNING' ? '#fbbf24' : '#f1f5f9' }}>
          {scheduledTime}
        </div>
        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
          {formatMins(minutesUntil)}
        </div>
      </div>
    </div>
  );
}
