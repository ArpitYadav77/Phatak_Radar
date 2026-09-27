import TypeIcon from './TypeIcon';
import { useNow } from '../../hooks/usePolling';
import { inWords, istClock } from '../../lib/format';
import { typeInfo } from '../../lib/trainTypes';

export default function UpcomingTrains({ trains, skew = 0, limit = 5 }) {
  const now = useNow(5000) + skew;
  const list = (trains || []).filter((t) => t.expectedAt >= now - 3 * 60000).slice(0, limit);

  return (
    <section className="card">
      <div className="card-head">
        <h3 className="card-title">Next trains at this crossing</h3>
        <span className="tiny muted">times ≈ at the crossing (IST)</span>
      </div>
      {list.length === 0 ? (
        <p className="card-pad small text-2">No timetable trains in the next hours.</p>
      ) : (
        <ul className="list" style={{ listStyle: 'none' }}>
          {list.map((t) => (
            <li className="list-item" key={`${t.number}-${t.scheduledAt}`}>
              <TypeIcon type={t.type} size={34} />
              <div className="grow">
                <div className="small ellipsis" style={{ fontWeight: 500 }}>{t.name}</div>
                <div className="tiny text-2 ellipsis">
                  <span className="mono">#{t.number}</span> · {typeInfo(t.type).label}
                  {t.heading && <> · {t.heading}</>}
                  {!t.verified && <> · unverified</>}
                </div>
              </div>
              <div className="list-time">
                <div className="list-time-main">{istClock(t.expectedAt)}</div>
                <div className="list-time-sub">
                  {t.delayMin > 0 ? <span style={{ color: 'var(--warning-text)' }}>+{t.delayMin} min · </span> : null}
                  {inWords(t.expectedAt, now)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
