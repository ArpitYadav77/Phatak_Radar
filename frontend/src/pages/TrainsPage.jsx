import { useMemo, useState } from 'react';
import Icon from '../components/UI/Icon';
import TypeIcon from '../components/crossing/TypeIcon';
import { api } from '../lib/api';
import { usePolling } from '../hooks/usePolling';
import { DAY_LETTERS } from '../lib/format';
import { TYPE_FILTERS, typeInfo } from '../lib/trainTypes';

const STATE_TEXT = {
  APPROACHING_PTA: 'approaching Patiala',
  AT_PTA: 'at Patiala station',
  LEFT_PTA: 'left Patiala',
};

function Days({ runsOn }) {
  const set = new Set(runsOn || [0, 1, 2, 3, 4, 5, 6]);
  const daily = set.size === 7;
  return daily ? <span className="tiny text-2">Daily</span> : (
    <span className="days" aria-label={`Runs on ${[...set].map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`}>
      {DAY_LETTERS.map((l, i) => <span key={i} className={set.has(i) ? 'on' : ''}>{l}</span>)}
    </span>
  );
}

export default function TrainsPage() {
  const [tab, setTab] = useState('now');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(null);
  const live = usePolling((signal) => api.trains({ signal }), 15000);
  const tt = usePolling((signal) => api.timetable({ signal }), 10 * 60 * 1000);

  const filterTypes = filter ? new Set(TYPE_FILTERS.find((f) => f.key === filter).types) : null;
  const match = (t) => (!filterTypes || filterTypes.has(t.type)) &&
    (!q.trim() || `${t.number} ${t.name} ${t.from} ${t.to}`.toLowerCase().includes(q.trim().toLowerCase()));

  const timetable = useMemo(() => (tt.data?.trains || [])
    .map((t) => ({ ...t, sortKey: t.arr || t.dep }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey)), [tt.data]);

  const onLine = (live.data?.trains || []).filter(match);
  const list = timetable.filter(match);

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Rajpura – Patiala – Nabha</div>
        <h1 className="page-title">Trains</h1>
        <p className="page-sub">Verified Patiala timetable and where each train should be now.</p>
      </div>

      <div className="stack">
        <div className="row" role="tablist" aria-label="Train views">
          <button role="tab" aria-selected={tab === 'now'} className={`chip ${tab === 'now' ? 'on' : ''}`} onClick={() => setTab('now')}>
            On the line now {live.data && <span className="num">({live.data.trains.length})</span>}
          </button>
          <button role="tab" aria-selected={tab === 'tt'} className={`chip ${tab === 'tt' ? 'on' : ''}`} onClick={() => setTab('tt')}>
            Patiala timetable {tt.data && <span className="num">({tt.data.trains.length})</span>}
          </button>
        </div>

        <div className="search-box">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Train number, name or station code…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search trains" />
        </div>
        <div className="chips" role="group" aria-label="Filter by type">
          <button className={`chip ${!filter ? 'on' : ''}`} onClick={() => setFilter(null)}>All</button>
          {TYPE_FILTERS.map((f) => (
            <button key={f.key} className={`chip ${filter === f.key ? 'on' : ''}`} onClick={() => setFilter(filter === f.key ? null : f.key)}>{f.label}</button>
          ))}
        </div>

        {tab === 'now' && (
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Estimated on the line now</h2>
              <span className="tiny muted">{live.data?.positionSource || ''}</span>
            </div>
            {live.error && !live.data && <p className="card-pad small" style={{ color: 'var(--danger-text)' }}>Train data unavailable right now.</p>}
            {!live.data && !live.error && <div className="card-pad"><div className="skeleton" style={{ height: 120 }} /></div>}
            {live.data && onLine.length === 0 && (
              <p className="card-pad small text-2">No timetable train is between Nabha and Rajpura right now{filter || q ? ' matching your filter' : ''}.</p>
            )}
            {onLine.map((t) => (
              <div className="tt-row" key={`${t.number}-${t.state}`}>
                <TypeIcon type={t.type} size={36} />
                <div className="grow">
                  <div className="small ellipsis" style={{ fontWeight: 500 }}>{t.name}</div>
                  <div className="tiny text-2 ellipsis"><span className="mono">#{t.number}</span> · {typeInfo(t.type).label} · {STATE_TEXT[t.state]}</div>
                </div>
                <div className="tt-times">
                  <div className="small">{Math.abs(t.km).toFixed(1)} km</div>
                  <div className="tiny text-2">{t.km === 0 ? 'at PTA' : t.km < 0 ? 'west of PTA' : 'east of PTA'}</div>
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === 'tt' && (
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Patiala (PTA) station timetable</h2>
              <span className="tiny muted">arr / dep, IST</span>
            </div>
            {tt.error && !tt.data && <p className="card-pad small" style={{ color: 'var(--danger-text)' }}>Timetable unavailable right now.</p>}
            {list.map((t) => (
              <div className="tt-row" key={t.number}>
                <TypeIcon type={t.type} size={36} />
                <div className="grow">
                  <div className="small ellipsis" style={{ fontWeight: 500 }}>
                    {t.name} {!t.verified && <span className="badge warning" title={t.note}>unverified</span>}
                  </div>
                  <div className="tiny text-2 ellipsis"><span className="mono">#{t.number}</span> · {t.from} → {t.to} · {typeInfo(t.type).label}</div>
                  <Days runsOn={t.runsOn} />
                </div>
                <div className="tt-times">
                  <div className="small mono">{t.arr || '—'} / {t.dep || '—'}</div>
                  <div className="tiny text-2">{t.toSide === 'W' ? 'to Dhuri side' : t.toSide === 'E' ? 'to Rajpura side' : 'ends here'}</div>
                </div>
              </div>
            ))}
            {tt.data && (
              <div className="card-pad tiny muted" style={{ borderTop: '1px solid var(--divider)' }}>
                Checked {tt.data.verifiedAt} against: {tt.data.sources.map((s, i) => (
                  <span key={s.url}>{i > 0 && ', '}<a href={s.url} target="_blank" rel="noreferrer">{s.name.split(' — ')[0]}</a></span>
                ))}. Goods and most parcel trains have no public timetable and are not listed.
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
