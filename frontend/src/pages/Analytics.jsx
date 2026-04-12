import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useRailway } from '../context/RailwayContext';
import { getAnalyticsSnapshots } from '../context/RailwayContext';
import { LUDHIANA_TRAINS } from '../lib/trainData';

const COLORS = ['#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

export default function Analytics() {
  const { trains, phataks, alerts, lastUpdated } = useRailway();
  const snapshots = getAnalyticsSnapshots();

  // ─── Speed distribution from live trains ─────────────────────────────────────
  const speedDistribution = useMemo(() => {
    if (trains.length === 0) return [];
    const buckets = { '0-30': 0, '31-60': 0, '61-80': 0, '81-100': 0, '100+': 0 };
    trains.forEach((t) => {
      const s = t.speed || 60;
      if (s <= 30) buckets['0-30']++;
      else if (s <= 60) buckets['31-60']++;
      else if (s <= 80) buckets['61-80']++;
      else if (s <= 100) buckets['81-100']++;
      else buckets['100+']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [trains]);

  // ─── Delay by train from live data ───────────────────────────────────────────
  const delayByTrain = useMemo(() => {
    return trains
      .filter((t) => (t.delayMinutes || 0) > 0)
      .map((t) => ({ name: t.trainNumber, delay: t.delayMinutes || 0 }))
      .sort((a, b) => b.delay - a.delay)
      .slice(0, 8);
  }, [trains]);

  // ─── Hourly traffic: blend timetable + delay data ─────────────────────────────
  const hourlyTraffic = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      scheduled: 0,
      delayed: 0,
    }));
    LUDHIANA_TRAINS.forEach((t) => {
      const [h] = t.scheduledTime.split(':').map(Number);
      if (hours[h]) {
        hours[h].scheduled++;
        // If we have live data, check actual delay
        const liveTrain = trains.find((lt) => lt.trainNumber === t.trainNumber);
        if (liveTrain && (liveTrain.delayMinutes || 0) > 0) {
          hours[h].delayed++;
        }
      }
    });
    return hours.filter((h) => h.hour >= '04:00' || h.hour <= '01:00').slice(0, 20);
  }, [trains]);

  // ─── On-time performance (%) ──────────────────────────────────────────────────
  const onTimeRate = trains.length > 0
    ? Math.round((trains.filter((t) => (t.delayMinutes || 0) === 0).length / trains.length) * 100)
    : 100;

  const avgDelay = trains.length > 0
    ? (trains.reduce((acc, t) => acc + (t.delayMinutes || 0), 0) / trains.length).toFixed(1)
    : 0;

  const maxSpeed = trains.length > 0
    ? Math.max(...trains.map((t) => t.speed || 0))
    : 0;

  const gateClosure24h = alerts.length;

  // ─── Approach status distribution ────────────────────────────────────────────
  const approachDistribution = useMemo(() => {
    const groups = { CRITICAL: 0, APPROACHING: 0, CLEAR: 0 };
    trains.forEach((t) => {
      if (t.approachStatus) groups[t.approachStatus]++;
      else groups.CLEAR++;
    });
    return [
      { name: 'Critical', value: groups.CRITICAL, color: '#ef4444' },
      { name: 'Approaching', value: groups.APPROACHING, color: '#f59e0b' },
      { name: 'Clear', value: groups.CLEAR, color: '#10b981' },
    ].filter((d) => d.value > 0);
  }, [trains]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', overflow: 'auto', backgroundColor: '#0a0f1e' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.025em' }}>Analytics</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Real-time performance · Patiala· {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>{snapshots.length} historical snapshots</span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'On-Time Rate', value: `${onTimeRate}%`, color: onTimeRate >= 80 ? '#10b981' : '#f59e0b', icon: '🎯' },
          { label: 'Avg Delay', value: `${avgDelay} min`, color: Number(avgDelay) > 10 ? '#ef4444' : '#f59e0b', icon: '⏰' },
          { label: 'Max Speed', value: `${maxSpeed} km/h`, color: '#14b8a6', icon: '⚡' },
          { label: 'Alerts (24h)', value: gateClosure24h, color: gateClosure24h > 0 ? '#ef4444' : '#10b981', icon: '🚨' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ backgroundColor: '#1a2332', border: '1px solid #334155', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.5rem' }}>{kpi.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: kpi.color, letterSpacing: '-0.025em' }}>{kpi.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Speed Distribution */}
        <ChartCard title="Speed Distribution" subtitle="Current trains by speed range">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={speedDistribution} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f1f5f9', fontSize: '0.75rem' }} />
              <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Approach Status */}
        <ChartCard title="Train Proximity Status" subtitle="Trains by distance to Phatak 23/24">
          {approachDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={approachDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {approachDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f1f5f9', fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No trains in area</div>
          )}
        </ChartCard>

        {/* Hourly Traffic */}
        <ChartCard title="Hourly Train Traffic" subtitle="Trains scheduled through Patiala per hour">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyTraffic} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} interval={3} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f1f5f9', fontSize: '0.75rem' }} />
              <Legend />
              <Bar dataKey="scheduled" name="Scheduled" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="delayed" name="Delayed" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Delays by Train */}
        <ChartCard title="Delay by Train" subtitle="Minutes delayed (current snapshot)">
          {delayByTrain.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={delayByTrain} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} width={55} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f1f5f9', fontSize: '0.75rem' }} formatter={(v) => [`${v} min`, 'Delay']} />
                <Bar dataKey="delay" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '2rem' }}>✅</div>
              <div style={{ fontSize: '0.875rem' }}>All trains running on schedule</div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent alerts */}
      {alerts.length > 0 && (
        <div style={{ backgroundColor: '#1a2332', border: '1px solid #334155', borderRadius: '8px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Recent Gate Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
            {alerts.slice(0, 10).map((alert, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.625rem 0.875rem', backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '0.8rem' }}>
                <span>{alert.alertType === 'CRITICAL' ? '🚨' : alert.alertType === 'APPROACHING' ? '⚠️' : '✅'}</span>
                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{alert.phatakName}</span>
                <span style={{ color: '#94a3b8' }}>·</span>
                <span style={{ color: '#94a3b8' }}>{alert.trainName} ({alert.trainNumber})</span>
                <span style={{ color: '#64748b', marginLeft: 'auto', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{ backgroundColor: '#1a2332', border: '1px solid #334155', borderRadius: '8px', padding: '1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{title}</h3>
        {subtitle && <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.125rem' }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
