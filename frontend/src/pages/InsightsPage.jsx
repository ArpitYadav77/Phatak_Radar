import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import CrossingPicker from '../components/crossing/CrossingPicker';
import { useApp } from '../context/AppContext';
import { usePolling, useNow } from '../hooks/usePolling';
import { api } from '../lib/api';
import { istClock } from '../lib/format';
import { typeInfo } from '../lib/trainTypes';
import { P } from '../styles/palette';

const hourOf = (ms) => Number(istClock(ms).slice(0, 2));
const tooltipStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 12 };

export default function InsightsPage() {
  const { selected } = useApp();
  const now = useNow(60000);
  const day = usePolling((signal) => api.crossingDay(selected.id, { signal }), 10 * 60 * 1000, [selected.id]);
  const d = day.data;

  const perHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: String(h).padStart(2, '0'), trains: 0 }));
    for (const t of d?.trains || []) hours[hourOf(t.at)].trains += 1;
    return hours;
  }, [d]);

  const byType = useMemo(() => {
    const m = new Map();
    for (const t of d?.trains || []) m.set(t.type, (m.get(t.type) || 0) + 1);
    return [...m.entries()].map(([type, count]) => ({ type, label: typeInfo(type).label, count, color: typeInfo(type).color }))
      .sort((a, b) => b.count - a.count);
  }, [d]);

  const busiest = perHour.reduce((a, h) => (h.trains > a.trains ? h : a), { trains: 0 });
  const nowHour = hourOf(now);
  const quiet = (() => {
    // Longest gap between closures today.
    const w = (d?.trains || []).map((t) => [t.closeAt, t.openAt]).sort((a, b) => a[0] - b[0]);
    let best = null;
    for (let i = 1; i < w.length; i++) {
      const gap = w[i][0] - w[i - 1][1];
      if (!best || gap > best.gap) best = { gap, from: w[i - 1][1], to: w[i][0] };
    }
    return best;
  })();

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Today at this crossing</div>
        <h1 className="page-title">Insights</h1>
        <p className="page-sub">Expected gate closures from the timetable — plan around the busy hours.</p>
      </div>

      <div className="stack">
        <CrossingPicker crossing={d?.crossing} fallbackLabel={selected.label} />

        {day.error && !d && <div className="banner danger">Insights unavailable right now.</div>}
        {!d && !day.error && <div className="skeleton" style={{ height: 200 }} />}

        {d && !d.timetable?.available && (
          <div className="banner info">{d.timetable?.reason || 'No timetable for this crossing yet'} — insights need a timetable.</div>
        )}

        {d && d.timetable?.available && (
          <>
            <div className="kpis">
              <div className="card kpi"><div className="kpi-num">{d.trains.length}</div><div className="kpi-label">Trains today</div></div>
              <div className="card kpi"><div className="kpi-num">≈{d.closedMinutes}<span className="small text-2"> min</span></div><div className="kpi-label">Gate closed (est.)</div></div>
              <div className="card kpi"><div className="kpi-num">{busiest.trains ? `${busiest.hour}:00` : '—'}</div><div className="kpi-label">Busiest hour ({busiest.trains} trains)</div></div>
              <div className="card kpi">
                <div className="kpi-num">{quiet ? `${Math.round(quiet.gap / 3600000 * 10) / 10}` : '—'}<span className="small text-2"> h</span></div>
                <div className="kpi-label">{quiet ? `Longest open spell ${istClock(quiet.from)}–${istClock(quiet.to)}` : 'Longest open spell'}</div>
              </div>
            </div>

            <div className="grid-2">
              <section className="card">
                <div className="card-head"><h2 className="card-title">Trains per hour</h2><span className="tiny muted">IST · now {String(nowHour).padStart(2, '0')}:00</span></div>
                <div className="card-pad" style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perHour} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--muted)' }} interval={2} tickLine={false} stroke="var(--border)" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--card-hover)' }} formatter={(v) => [v, 'trains']} labelFormatter={(h) => `${h}:00–${h}:59`} />
                      <Bar dataKey="trains" radius={[3, 3, 0, 0]}>
                        {perHour.map((h) => <Cell key={h.hour} fill={Number(h.hour) === nowHour ? P.gold : P.info} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="card">
                <div className="card-head"><h2 className="card-title">Train types</h2></div>
                <div className="card-pad stack">
                  {byType.map((t) => (
                    <div key={t.type}>
                      <div className="spread small"><span>{t.label}</span><span className="num text-2">{t.count}</span></div>
                      <div style={{ height: 8, borderRadius: 4, background: 'var(--divider)', marginTop: 4 }}>
                        <div style={{ width: `${(t.count / d.trains.length) * 100}%`, height: '100%', borderRadius: 4, background: t.color }} />
                      </div>
                    </div>
                  ))}
                  <p className="tiny muted">Goods trains are not included — they have no public timetable.</p>
                </div>
              </section>
            </div>

            <section className="card">
              <div className="card-head"><h2 className="card-title">All closures today</h2><span className="tiny muted">gate ≈ {d.gate.leadMin} min before → {d.gate.trailMin} min after</span></div>
              {d.trains.map((t) => (
                <div className="tt-row" key={`${t.number}-${t.at}`} style={{ opacity: t.openAt < now ? 0.5 : 1 }}>
                  <span className="mono small">{istClock(t.at)}</span>
                  <div className="grow">
                    <div className="small ellipsis" style={{ fontWeight: 500 }}>{t.name}</div>
                    <div className="tiny text-2 ellipsis"><span className="mono">#{t.number}</span> · {typeInfo(t.type).label}{t.heading ? ` · ${t.heading}` : ''}</div>
                  </div>
                  <div className="tt-times tiny text-2">{istClock(t.closeAt)}–{istClock(t.openAt)}</div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
