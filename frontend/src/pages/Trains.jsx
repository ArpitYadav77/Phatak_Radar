import { useState, useMemo } from 'react';
import { useRailway } from '../context/RailwayContext';
import Icon from '../components/UI/Icon';
import { P, FONT_MONO } from '../styles/palette';

export default function Trains() {
  const { trains, lastUpdated, countdown, isLoading } = useRailway();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('approach'); // approach, number, delay, speed, dist23

  const filteredTrains = useMemo(() => {
    let result = trains;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.trainNumber.toLowerCase().includes(q) ||
          t.trainName.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'on-time') result = result.filter((t) => (t.delayMinutes || 0) === 0);
    else if (statusFilter === 'delayed') result = result.filter((t) => (t.delayMinutes || 0) > 0);
    else if (statusFilter === 'approaching') result = result.filter((t) => t.approachStatus !== 'CLEAR');

    result = [...result].sort((a, b) => {
      if (sortBy === 'approach') {
        const order = { CRITICAL: 0, APPROACHING: 1, CLEAR: 2 };
        return (order[a.approachStatus] ?? 3) - (order[b.approachStatus] ?? 3);
      }
      if (sortBy === 'number') return a.trainNumber.localeCompare(b.trainNumber);
      if (sortBy === 'delay') return (b.delayMinutes || 0) - (a.delayMinutes || 0);
      if (sortBy === 'speed') return (b.speed || 0) - (a.speed || 0);
      if (sortBy === 'dist23') return (a.distToPhatak23 ?? 999) - (b.distToPhatak23 ?? 999);
      return 0;
    });

    return result;
  }, [trains, searchQuery, statusFilter, sortBy]);

  const stats = {
    total: trains.length,
    onTime: trains.filter((t) => (t.delayMinutes || 0) === 0).length,
    delayed: trains.filter((t) => (t.delayMinutes || 0) > 0).length,
    approaching: trains.filter((t) => t.approachStatus !== 'CLEAR' && t.approachStatus != null).length,
    avgSpeed: trains.length > 0 ? Math.round(trains.reduce((s, t) => s + (t.speed || 0), 0) / trains.length) : 0,
  };

  const getApproachBadge = (status) => {
    if (status === 'CRITICAL') return { label: 'CRITICAL', bg: P.dangerBg, border: P.dangerBorder, text: P.dangerText };
    if (status === 'APPROACHING') return { label: 'APPROACHING', bg: P.warningBg, border: P.warningBorder, text: P.warning };
    return { label: 'CLEAR', bg: 'transparent', border: P.border, text: P.text2 };
  };

  const getDelayColor = (d) => {
    if (!d || d === 0) return P.text2;
    return P.warning;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', overflow: 'auto', backgroundColor: P.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 500, color: P.gold, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Live Movements</div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600, color: P.text, letterSpacing: '-0.02em' }}>Train Operations</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: P.text2, marginTop: '0.375rem' }}>Live train status · Patiala corridor · Phatak 23 (Model Town) &amp; 24 (Nabha Road)</p>
        </div>
        {/* Live badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: '6px', padding: '0.5rem 0.875rem', fontSize: '0.75rem' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: isLoading ? P.warning : P.success, animation: 'pulse 2s infinite' }} />
          <span style={{ color: P.text2 }}>Next refresh in</span>
          <span style={{ color: P.gold, fontWeight: 500, fontFamily: FONT_MONO }}>{countdown}s</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Trains in Transit', value: stats.total, color: P.info },
          { label: 'On Schedule', value: stats.onTime, color: P.text2 },
          { label: 'Delayed', value: stats.delayed, color: stats.delayed > 0 ? P.warning : P.text2 },
          { label: 'Near Phataks', value: stats.approaching, color: stats.approaching > 0 ? P.warning : P.text2 },
          { label: 'Avg Speed (km/h)', value: stats.avgSpeed, color: P.text2 },
        ].map((stat) => (
          <div key={stat.label} style={{ backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.875rem', fontWeight: 600, color: P.text, letterSpacing: '-0.02em', marginBottom: '0.375rem', fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: P.text2, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: stat.color }} />
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.875rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by train number or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', backgroundColor: P.bg, border: `1px solid ${P.border}`, borderRadius: '6px', color: P.text, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
            onFocus={(e) => (e.target.style.borderColor = P.goldBorder)}
            onBlur={(e) => (e.target.style.borderColor = P.border)}
          />
          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}><Icon name="search" size={15} color={P.muted} /></span>
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'approaching', label: 'Near Phatak' },
            { key: 'on-time', label: 'On Time' },
            { key: 'delayed', label: 'Delayed' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                padding: '0.5rem 0.875rem',
                backgroundColor: statusFilter === key ? P.goldBg : P.bg,
                border: `1px solid ${statusFilter === key ? P.goldBorder : P.border}`,
                borderRadius: '6px',
                color: statusFilter === key ? P.gold : P.text2,
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '0.5rem 0.875rem', backgroundColor: P.bg, border: `1px solid ${P.border}`, borderRadius: '6px', color: P.text, fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
        >
          <option value="approach">Sort by Approach Status</option>
          <option value="dist23">Sort by Distance (Phatak 23)</option>
          <option value="number">Sort by Train No.</option>
          <option value="delay">Sort by Delay</option>
          <option value="speed">Sort by Speed</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 90px 90px 110px 120px 120px 130px', gap: '0.75rem', padding: '0.875rem 1.25rem', backgroundColor: P.sidebar, borderBottom: `1px solid ${P.border}`, fontSize: '0.625rem', fontWeight: 500, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <div>Train No.</div>
          <div>Name & Route</div>
          <div>Speed</div>
          <div>Delay</div>
          <div>Phatak 23</div>
          <div>Phatak 24</div>
          <div>ETA 23</div>
          <div>Status</div>
        </div>

        {/* Rows */}
        <div style={{ maxHeight: 'calc(100vh - 440px)', overflowY: 'auto' }}>
          {filteredTrains.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: P.muted }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}><Icon name="search" size={28} /></div>
              <div>
                {searchQuery ? 'No trains match your search' : 'No active trains at this time'}
              </div>
            </div>
          ) : (
            filteredTrains.map((train, idx) => {
              const approachBadge = getApproachBadge(train.approachStatus);
              const isCritical = train.approachStatus === 'CRITICAL';
              return (
                <div
                  key={train._id || train.trainNumber}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 90px 90px 110px 120px 120px 130px',
                    gap: '0.75rem',
                    padding: '1rem 1.25rem',
                    borderBottom: idx < filteredTrains.length - 1 ? `1px solid ${P.divider}` : 'none',
                    alignItems: 'center',
                    transition: 'background-color 0.15s',
                    borderLeft: isCritical ? `2px solid ${P.danger}` : train.approachStatus === 'APPROACHING' ? `2px solid ${P.warning}` : '2px solid transparent',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = P.cardHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ fontWeight: 500, color: P.infoText, fontFamily: FONT_MONO, fontSize: '0.8125rem' }}>
                    #{train.trainNumber}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: P.text, fontSize: '0.875rem' }}>{train.trainName}</div>
                    {train.schedule?.origin && (
                      <div style={{ fontSize: '0.7rem', color: P.muted, marginTop: '0.125rem' }}>
                        {train.schedule.origin} → {train.schedule.destination}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: P.text2, fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ fontWeight: 500, color: P.text }}>{train.speed || 60}</span>
                    <span style={{ fontSize: '0.65rem' }}>km/h</span>
                  </div>
                  <div style={{ fontWeight: 500, color: getDelayColor(train.delayMinutes), fontSize: '0.8125rem' }}>
                    {(train.delayMinutes || 0) > 0 ? `+${train.delayMinutes}m` : '✓'}
                  </div>
                  <div style={{ fontWeight: 500, color: (train.distToPhatak23 ?? 999) < 5 ? P.dangerText : (train.distToPhatak23 ?? 999) < 15 ? P.warning : P.text2, fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>
                    {train.distToPhatak23 != null ? `${train.distToPhatak23} km` : '—'}
                  </div>
                  <div style={{ fontWeight: 500, color: (train.distToPhatak24 ?? 999) < 5 ? P.dangerText : (train.distToPhatak24 ?? 999) < 15 ? P.warning : P.text2, fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>
                    {train.distToPhatak24 != null ? `${train.distToPhatak24} km` : '—'}
                  </div>
                  <div style={{ fontWeight: 500, color: P.text2, fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                    {train.etaToPhatak23 != null ? `${train.etaToPhatak23} min` : '—'}
                  </div>
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.1875rem 0.5rem',
                      backgroundColor: approachBadge.bg,
                      border: `1px solid ${approachBadge.border}`,
                      color: approachBadge.text,
                      borderRadius: '4px',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                    }}>
                      {approachBadge.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
