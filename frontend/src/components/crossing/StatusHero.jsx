import Icon from '../UI/Icon';
import TypeIcon from './TypeIcon';
import { useNow } from '../../hooks/usePolling';
import { ago, countdown, inWords, istClock } from '../../lib/format';
import { typeInfo } from '../../lib/trainTypes';

export const STATUS_UI = {
  OPEN: { cls: 'open', word: 'OPEN', local: 'खुला · ਖੁੱਲ੍ਹਾ', icon: 'gateOpen' },
  CLOSING_SOON: { cls: 'soon', word: 'CLOSING SOON', local: 'जल्द बंद · ਜਲਦੀ ਬੰਦ', icon: 'gateSoon' },
  CLOSED: { cls: 'closed', word: 'CLOSED', local: 'बंद · ਬੰਦ', icon: 'gateClosed' },
  UNKNOWN: { cls: 'unknown', word: 'NO DATA', local: 'जानकारी नहीं · ਜਾਣਕਾਰੀ ਨਹੀਂ', icon: 'question' },
};

const BASIS = {
  timetable: { label: 'Timetable estimate', cls: 'info' },
  live: { label: 'Timetable + live delay', cls: 'info' },
  reports: { label: 'User reports', cls: 'warning' },
  'timetable+reports': { label: 'Timetable + user reports', cls: 'info' },
  gatekeeper: { label: 'Gatekeeper', cls: 'gold' },
  none: { label: 'No timetable', cls: '' },
};

function countdownFor(s, now) {
  if (s.status === 'CLOSED' && s.opensAt) return { label: 'opens in about', ...countdown(s.opensAt, now) };
  if (s.status === 'CLOSING_SOON' && s.closesAt) return { label: 'closes in', ...countdown(s.closesAt, now) };
  if (s.status === 'OPEN' && s.closesAt) return { label: 'next closure in', ...countdown(s.closesAt, now) };
  return null;
}

function trainCaption(s, now) {
  const t = s.train;
  if (!t) return null;
  if (s.basis === 'reports' && t.type === 'GOODS') return 'Reported by people at the crossing';
  if (!t.expectedAt) return null;
  const at = istClock(t.expectedAt);
  if (s.status === 'CLOSED') return t.expectedAt > now ? `Due at the crossing ${at} (${inWords(t.expectedAt, now)})` : `Passed ${at} — gate reopening`;
  return `At the crossing ≈ ${at} · ${inWords(t.expectedAt, now)}`;
}

/**
 * props: data (GET /api/phataks/:id), updatedAt (client receive time), compact
 */
export default function StatusHero({ data, updatedAt, compact = false, onReport }) {
  const tick = useNow(1000);
  // Align the countdown clock with the server's clock (phones are often a minute or two off).
  const now = tick + (data?.computedAt && updatedAt ? data.computedAt - updatedAt : 0);
  const ui = STATUS_UI[data.status] || STATUS_UI.UNKNOWN;
  const basis = BASIS[data.basis] || BASIS.none;
  const cd = countdownFor(data, now);
  const t = data.train;
  const caption = trainCaption(data, now);
  const rep = data.reports || {};

  return (
    <section className="hero" aria-live="polite">
      <div className={`hero-status ${ui.cls}`}>
        <div className="hero-icon"><Icon name={ui.icon} size={30} /></div>
        <div className="grow">
          <div className="hero-word">{ui.word}</div>
          <div className="hero-local" lang="hi">{ui.local}</div>
        </div>
        {cd && (
          <div className="hero-count">
            <div className="hero-count-label">{cd.label}</div>
            <div className="hero-count-num">{cd.value}<span className="small text-2"> {cd.unit}</span></div>
          </div>
        )}
      </div>

      <div className="hero-body">
        {t ? (
          <div className="train-line">
            <TypeIcon type={t.type} />
            <div className="grow">
              <div className="train-name ellipsis">
                {t.name}{t.number && <span className="mono text-2 small"> #{t.number}</span>}
              </div>
              <div className="train-meta">
                {typeInfo(t.type).label}
                {t.heading && <> · {t.heading}</>}
                {t.delayMin > 0 && <> · <span style={{ color: 'var(--warning-text)' }}>{t.delayMin} min late</span></>}
                {!t.verified && t.type !== 'GOODS' && <> · <span className="muted">unverified</span></>}
              </div>
              {caption && <div className="train-meta">{caption}</div>}
            </div>
          </div>
        ) : data.status === 'UNKNOWN' ? (
          <p className="small text-2">
            {data.timetable?.reason || 'No timetable for this crossing yet.'} If you are at this crossing, report what you see — two matching reports update it for everyone.
          </p>
        ) : (
          <p className="small text-2">No trains expected in the next 18 hours.</p>
        )}

        {rep.total > 0 && data.basis !== 'reports' && (
          <div className="small text-2 row">
            <Icon name="megaphone" size={15} />
            <span>
              {rep.total === 1 ? '1 person' : `${rep.total} people`} reported the gate{' '}
              <strong style={{ color: 'var(--text)' }}>{rep.latest?.status === 'CLOSED' ? 'closed' : 'open'}</strong>{' '}
              {ago(rep.latest?.at, now)}{rep.closed < 2 && rep.open < 2 ? ' (unconfirmed)' : ''}
            </span>
          </div>
        )}

        {!compact && (
          <div className="hero-foot">
            <span className={`badge ${basis.cls}`}>{basis.label}</span>
            {data.basis === 'reports' && <span>{rep.closed || rep.open} agreeing reports</span>}
            {updatedAt && <span className="row" style={{ gap: 6 }}><span className="dot pulse" />Updated {ago(updatedAt, tick)}</span>}
            {onReport && (
              <button className="btn btn-sm btn-gold" style={{ marginLeft: 'auto' }} onClick={onReport}>
                <Icon name="megaphone" size={16} /> Report gate
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
