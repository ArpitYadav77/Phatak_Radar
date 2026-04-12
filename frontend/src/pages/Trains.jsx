import { useState, useMemo } from 'react';
import { useRailway } from '../context/RailwayContext';

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
    if (status === 'CRITICAL') return { label: 'CRITICAL', bg: '#ef4444', text: '#fff' };
    if (status === 'APPROACHING') return { label: 'APPROACHING', bg: '#f59e0b', text: '#0f172a' };
    return { label: 'CLEAR', bg: '#10b98120', text: '#6ee7b7' };
  };

  const getDelayColor = (d) => {
    if (!d || d === 0) return '#6ee7b7';
    if (d <= 10) return '#fbbf24';
    return '#fca5a5';
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', overflow: 'auto', backgroundColor: '#0a0f1e' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.025em' }}>Train Operations</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>Live train status · Patiala corridor · Phatak 23 (Model Town) &amp; 24 (Nabha Road)</p>
        </div>
        {/* Live badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1a2332', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem 0.875rem', fontSize: '0.75rem' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: isLoading ? '#f59e0b' : '#10b981', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#94a3b8' }}>Next refresh in</span>
          <span style={{ color: '#14b8a6', fontWeight: 700, fontFamily: 'monospace' }}>{countdown}s</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Trains in Transit', value: stats.total, color: '#14b8a6' },
          { label: 'On Schedule', value: stats.onTime, color: '#6ee7b7' },
          { label: 'Delayed', value: stats.delayed, color: '#fca5a5' },
          { label: 'Near Phataks', value: stats.approaching, color: '#fb923c' },
          { label: 'Avg Speed (km/h)', value: stats.avgSpeed, color: '#c084fc' },
        ].map((stat) => (
          <div key={stat.label} style={{ backgroundColor: '#1a2332', border: '1px solid #334155', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color, letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>{stat.value}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: '#1a2332', border: '1px solid #334155', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.875rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by train number or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', backgroundColor: '#0a0f1e', border: '1px solid #334155', borderRadius: '6px', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
            onFocus={(e) => (e.target.style.borderColor = '#14b8a6')}
            onBlur={(e) => (e.target.style.borderColor = '#334155')}
          />
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'approaching', label: '⚠️ Near Phatak' },
            { key: 'on-time', label: 'On Time' },
            { key: 'delayed', label: 'Delayed' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                padding: '0.5rem 0.875rem',
                backgroundColor: statusFilter === key ? '#14b8a620' : '#0a0f1e',
                border: `1px solid ${statusFilter === key ? '#14b8a6' : '#334155'}`,
                borderRadius: '6px',
                color: statusFilter === key ? '#14b8a6' : '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 600,
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
          style={{ padding: '0.5rem 0.875rem', backgroundColor: '#0a0f1e', border: '1px solid #334155', borderRadius: '6px', color: '#f1f5f9', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
        >
          <option value="approach">Sort by Approach Status</option>
          <option value="dist23">Sort by Distance (Phatak 23)</option>
          <option value="number">Sort by Train No.</option>
          <option value="delay">Sort by Delay</option>
          <option value="speed">Sort by Speed</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#1a2332', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 90px 90px 110px 120px 120px 130px', gap: '0.75rem', padding: '0.875rem 1.25rem', backgroundColor: '#0a0f1e', borderBottom: '1px solid #334155', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
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
                    borderBottom: idx < filteredTrains.length - 1 ? '1px solid #1e293b' : 'none',
                    alignItems: 'center',
                    transition: 'background-color 0.15s',
                    borderLeft: isCritical ? '3px solid #ef4444' : train.approachStatus === 'APPROACHING' ? '3px solid #f59e0b' : '3px solid transparent',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b50')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ fontWeight: 700, color: '#14b8a6', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    #{train.trainNumber}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.875rem' }}>{train.trainName}</div>
                    {train.schedule?.origin && (
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.125rem' }}>
                        {train.schedule.origin} → {train.schedule.destination}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                    <span>⚡</span>
                    <span style={{ fontWeight: 600 }}>{train.speed || 60}</span>
                    <span style={{ fontSize: '0.65rem' }}>km/h</span>
                  </div>
                  <div style={{ fontWeight: 700, color: getDelayColor(train.delayMinutes), fontSize: '0.875rem' }}>
                    {(train.delayMinutes || 0) > 0 ? `+${train.delayMinutes}m` : '✓'}
                  </div>
                  <div style={{ fontWeight: 600, color: (train.distToPhatak23 ?? 999) < 5 ? '#ef4444' : (train.distToPhatak23 ?? 999) < 15 ? '#f59e0b' : '#94a3b8', fontSize: '0.875rem' }}>
                    {train.distToPhatak23 != null ? `${train.distToPhatak23} km` : '—'}
                  </div>
                  <div style={{ fontWeight: 600, color: (train.distToPhatak24 ?? 999) < 5 ? '#ef4444' : (train.distToPhatak24 ?? 999) < 15 ? '#f59e0b' : '#94a3b8', fontSize: '0.875rem' }}>
                    {train.distToPhatak24 != null ? `${train.distToPhatak24} km` : '—'}
                  </div>
                  <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.8rem' }}>
                    {train.etaToPhatak23 != null ? `${train.etaToPhatak23} min` : '—'}
                  </div>
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: approachBadge.bg,
                      color: approachBadge.text,
                      borderRadius: '6px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.025em',
                    }}>
                      {isCritical ? '🚨' : train.approachStatus === 'APPROACHING' ? '⚠️' : '✓'}
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
