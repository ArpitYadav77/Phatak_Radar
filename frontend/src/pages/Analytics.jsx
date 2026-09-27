import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useRailway } from '../context/RailwayContext';
import { getAnalyticsSnapshots } from '../context/RailwayContext';
import { LUDHIANA_TRAINS } from '../lib/trainData';
import Icon from '../components/UI/Icon';
import { P } from '../styles/palette';

const TOOLTIP_STYLE = { backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: '6px', color: P.text, fontSize: '0.75rem' };
const AXIS_TICK = { fontSize: 11, fill: P.muted };

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
      { name: 'Critical', value: groups.CRITICAL, color: P.danger },
      { name: 'Approaching', value: groups.APPROACHING, color: P.warning },
      { name: 'Clear', value: groups.CLEAR, color: P.success },
    ].filter((d) => d.value > 0);
  }, [trains]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', overflow: 'auto', backgroundColor: P.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 500, color: P.gold, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Performance</div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600, color: P.text, letterSpacing: '-0.02em' }}>Analytics</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: P.text2, marginTop: '0.375rem' }}>
            Real-time performance · Patiala· {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: P.muted }}>
          <span>{snapshots.length} historical snapshots</span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'On-Time Rate', value: `${onTimeRate}%`, color: onTimeRate >= 80 ? P.text2 : P.warning, icon: 'target' },
          { label: 'Avg Delay', value: `${avgDelay} min`, color: Number(avgDelay) > 0 ? P.warning : P.text2, icon: 'clock' },
          { label: 'Max Speed', value: `${maxSpeed} km/h`, color: P.info, icon: 'gauge' },
          { label: 'Alerts (24h)', value: gateClosure24h, color: gateClosure24h > 0 ? P.danger : P.text2, icon: 'alert' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: P.bg, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={kpi.icon} size={18} color={kpi.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: P.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              <div style={{ fontSize: '0.75rem', color: P.text2, fontWeight: 500 }}>{kpi.label}</div>
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
              <CartesianGrid strokeDasharray="3 3" stroke={P.divider} vertical={false} />
              <XAxis dataKey="range" tick={AXIS_TICK} stroke={P.border} tickLine={false} />
              <YAxis tick={AXIS_TICK} stroke={P.border} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: P.cardHover }} />
              <Bar dataKey="count" fill={P.info} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Approach Status */}
        <ChartCard title="Train Proximity Status" subtitle="Trains by distance to Phatak 23/24">
          {approachDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={approachDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} stroke={P.card} strokeWidth={2}>
                  {approachDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.muted }}>No trains in area</div>
          )}
        </ChartCard>

        {/* Hourly Traffic */}
        <ChartCard title="Hourly Train Traffic" subtitle="Trains scheduled through Patiala per hour">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyTraffic} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke={P.divider} vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: P.muted }} interval={3} stroke={P.border} tickLine={false} />
              <YAxis tick={AXIS_TICK} stroke={P.border} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: P.cardHover }} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: P.text2 }} />
              <Bar dataKey="scheduled" name="Scheduled" fill={P.info} radius={[3, 3, 0, 0]} />
              <Bar dataKey="delayed" name="Delayed" fill={P.warning} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Delays by Train */}
        <ChartCard title="Delay by Train" subtitle="Minutes delayed (current snapshot)">
          {delayByTrain.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={delayByTrain} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.divider} horizontal={false} />
                <XAxis type="number" tick={AXIS_TICK} stroke={P.border} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={AXIS_TICK} width={55} stroke={P.border} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: P.cardHover }} formatter={(v) => [`${v} min`, 'Delay']} />
                <Bar dataKey="delay" fill={P.warning} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.text2, flexDirection: 'column', gap: '0.625rem' }}>
              <Icon name="check" size={26} color={P.successText} />
              <div style={{ fontSize: '0.875rem' }}>All trains running on schedule</div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent alerts */}
      {alerts.length > 0 && (
        <div style={{ backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', fontWeight: 600, color: P.text }}>Recent Gate Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
            {alerts.slice(0, 10).map((alert, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.625rem 0.875rem', backgroundColor: P.bg, border: `1px solid ${P.divider}`, borderRadius: '6px', fontSize: '0.8rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, backgroundColor: alert.alertType === 'CRITICAL' ? P.danger : alert.alertType === 'APPROACHING' ? P.warning : P.success }} />
                <span style={{ color: P.text, fontWeight: 500 }}>{alert.phatakName}</span>
                <span style={{ color: P.muted }}>·</span>
                <span style={{ color: P.text2 }}>{alert.trainName} ({alert.trainNumber})</span>
                <span style={{ color: P.muted, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', fontSize: '0.7rem' }}>
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
    <div style={{ backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.125rem', paddingBottom: '0.875rem', borderBottom: `1px solid ${P.divider}` }}>
        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: P.text }}>{title}</h3>
        {subtitle && <div style={{ fontSize: '0.75rem', color: P.muted, marginTop: '0.25rem' }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
