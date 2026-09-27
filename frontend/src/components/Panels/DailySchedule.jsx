import { useState, useEffect, useMemo } from 'react';
import { getPhatakSchedule } from '../../api/phatak.api';
import Icon from '../UI/Icon';
import { P, FONT_MONO } from '../../styles/palette';

const STATUS_CONFIG = {
  'GATE CLOSED': { bg: P.dangerBg,  border: P.dangerBorder,  text: P.dangerText, accent: P.danger,  label: 'GATE CLOSED' },
  'WARNING':     { bg: P.warningBg, border: P.warningBorder, text: P.warning,    accent: P.warning, label: 'PREPARE' },
  'UPCOMING':    { bg: P.infoBg,    border: P.infoBorder,    text: P.infoText,   accent: P.info,    label: 'UPCOMING' },
  'PASSED':      { bg: 'transparent', border: P.border,      text: P.muted,      accent: P.muted,   label: 'PASSED' },
};

const GATE_TONE = {
  OPEN:    { bg: P.successBg, border: P.successBorder, text: P.successText, dot: P.success },
  WARNING: { bg: P.warningBg, border: P.warningBorder, text: P.warning,     dot: P.warning },
  CLOSED:  { bg: P.dangerBg,  border: P.dangerBorder,  text: P.dangerText,  dot: P.danger },
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
      <div style={{ backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '2rem', textAlign: 'center', color: P.muted }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}><Icon name="pin" size={28} color={P.gold} /></div>
        <div>Select a phatak to view schedule</div>
      </div>
    );
  }

  const gateStatus = phatak.liveStatus?.gateStatus || phatak.status || 'OPEN';
  const scheduledTrain = phatak.liveStatus?.scheduledTrain;
  const minutesToCrossing = phatak.liveStatus?.minutesToCrossing;
  const method = phatak.liveStatus?.method || 'schedule';

  const gateTone = GATE_TONE[gateStatus] || { bg: 'transparent', border: P.border, text: P.text2, dot: P.muted };

  const formatMins = (mins) => {
    if (mins == null) return '';
    const abs = Math.abs(Math.round(mins));
    if (abs === 0) return 'passing now';
    if (mins > 0) return `in ${abs} min`;
    return `${abs} min ago`;
  };

  return (
    <div style={{ backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ── */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${P.border}`, backgroundColor: P.sidebar, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.875rem' }}>
          <div>
            <div style={{ fontSize: '0.625rem', color: P.gold, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.375rem' }}>Selected Crossing</div>
            <div style={{ fontWeight: 600, color: P.text, fontSize: '1rem', marginBottom: '0.125rem' }}>{phatak.name}</div>
            <div style={{ fontSize: '0.7rem', color: P.muted, fontVariantNumeric: 'tabular-nums' }}>
              {phatak.lat?.toFixed(4)}°N, {phatak.lng?.toFixed(4)}°E · {phatak.district || 'Patiala'}, Punjab
            </div>
          </div>

          {/* Gate status badge */}
          <div style={{
            backgroundColor: gateTone.bg,
            border: `1px solid ${gateTone.border}`,
            color: gateTone.text,
            padding: '0.375rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: gateTone.dot, animation: gateStatus === 'CLOSED' ? 'pulse 1.2s infinite' : 'none' }} />
            GATE {gateStatus}
          </div>
        </div>

        {/* Scheduled train in window */}
        {scheduledTrain && (
          <div style={{
            backgroundColor: P.card,
            border: `1px solid ${P.border}`,
            boxShadow: `inset 2px 0 0 ${gateTone.dot}`,
            borderRadius: '6px',
            padding: '0.625rem 0.875rem',
            marginBottom: '0.625rem',
          }}>
            <div style={{ fontSize: '0.625rem', color: P.text2, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
              {gateStatus === 'CLOSED' ? 'TRAIN IN CLOSURE WINDOW' : gateStatus === 'WARNING' ? 'APPROACHING — PREPARE TO CLOSE' : 'NEXT TRAIN'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: FONT_MONO, fontSize: '0.75rem', fontWeight: 500, color: P.infoText, marginRight: '0.5rem' }}>
                  #{scheduledTrain.trainNumber}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: P.text }}>
                  {scheduledTrain.trainName}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: '1rem', fontWeight: 600, color: gateStatus === 'CLOSED' ? P.dangerText : gateStatus === 'WARNING' ? P.warning : P.text }}>
                  {scheduledTrain.scheduledTime}
                </div>
                <div style={{ fontSize: '0.6875rem', color: P.text2 }}>
                  {formatMins(minutesToCrossing)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logic source + clock */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: P.muted }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: method === 'gps' ? P.infoText : P.text2 }}>
            <Icon name={method === 'gps' ? 'target' : 'clock'} size={12} />
            {method === 'gps' ? 'GPS + Schedule' : 'Schedule-based (±10 min)'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontVariantNumeric: 'tabular-nums' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: P.success, animation: 'pulse 2s infinite' }} />
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {/* ── Schedule Body ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: P.muted }}>Loading schedule...</div>
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
              <div style={{ padding: '3rem', textAlign: 'center', color: P.muted }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}><Icon name="train" size={28} /></div>
                No schedule data
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '0.75rem 1.5rem', borderTop: `1px solid ${P.border}`, backgroundColor: P.sidebar, display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: P.muted, flexShrink: 0 }}>
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
      <div style={{ padding: '0.5rem 1.5rem', fontSize: '0.625rem', fontWeight: 500, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: P.bg, borderBottom: `1px solid ${P.divider}` }}>
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
        borderBottom: `1px solid ${P.divider}`,
        borderLeft: highlight ? `2px solid ${cfg.accent}` : '2px solid transparent',
        opacity: dim ? 0.55 : 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        transition: 'background-color 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = P.cardHover)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: '0.6875rem', fontWeight: 500, color: P.text2 }}>#{trainNumber}</span>
          <span style={{
            padding: '0.0625rem 0.375rem',
            backgroundColor: cfg.bg,
            border: `1px solid ${cfg.border}`,
            color: cfg.text,
            borderRadius: '3px',
            fontSize: '0.5625rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: '0.65rem', color: P.muted }}>
            {direction === 'UP' ? '↑ UP (→ Rajpura/Delhi)' : '↓ DOWN (→ Dhuri/Bathinda)'}
          </span>
        </div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: dim ? P.muted : P.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {trainName}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: '0.875rem', fontWeight: 500, color: dim ? P.muted : windowStatus === 'GATE CLOSED' ? P.dangerText : windowStatus === 'WARNING' ? P.warning : P.text }}>
          {scheduledTime}
        </div>
        <div style={{ fontSize: '0.6875rem', color: P.muted }}>
          {formatMins(minutesUntil)}
        </div>
      </div>
    </div>
  );
}
