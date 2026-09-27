import { useEffect, useRef, useState } from 'react';
import Icon from '../UI/Icon';
import Sheet from '../common/Sheet';
import { api } from '../../lib/api';
import { describeCrossing } from '../../lib/format';
import { useApp } from '../../context/AppContext';

function ResultRow({ c, onPick, extra }) {
  return (
    <button className="result" onClick={() => onPick(c)}>
      <Icon name={c.timetable ? 'train' : 'pin'} size={18} color={c.timetable ? 'var(--gold)' : 'var(--muted)'} />
      <div className="grow">
        <div className="result-name ellipsis">{c.name || c.label}</div>
        <div className="result-meta ellipsis">
          {[extra, describeCrossing(c), c.timetable ? 'timetable available' : null].filter(Boolean).join(' · ')}
        </div>
      </div>
      <Icon name="chevronRight" size={16} color="var(--muted)" />
    </button>
  );
}

export function PickerSheet({ onClose }) {
  const { selectCrossing, recents } = useApp();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [near, setNear] = useState(null);
  const [geoState, setGeoState] = useState('idle');
  const [error, setError] = useState(null);
  const ctrlRef = useRef(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults(null); return undefined; }
    const t = setTimeout(async () => {
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      try {
        const r = await api.search(term, { signal: ctrl.signal });
        setResults(r.items);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') setError('Search is unavailable right now.');
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const pick = (c) => { selectCrossing(c); onClose(); };

  const locate = () => {
    if (!navigator.geolocation) { setGeoState('unsupported'); return; }
    setGeoState('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await api.nearest(pos.coords.latitude, pos.coords.longitude);
          setNear(r.items);
          setGeoState('done');
        } catch {
          setGeoState('error');
        }
      },
      (err) => setGeoState(err.code === 1 ? 'denied' : 'error'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  const geoMsg = {
    locating: 'Finding crossings near you…',
    denied: 'Location permission was denied — search by name or station instead.',
    unsupported: 'This browser cannot share location.',
    error: 'Could not get your location. Try again or search instead.',
  }[geoState];

  return (
    <Sheet title="Choose a crossing" onClose={onClose}>
      <div className="stack">
        <div className="search-box">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Search a phatak or nearby station…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search crossings"
            autoComplete="off"
          />
        </div>

        <button className="btn btn-gold btn-block" onClick={locate} disabled={geoState === 'locating'}>
          <Icon name="locate" size={18} /> {geoState === 'locating' ? 'Locating…' : 'Near me'}
        </button>
        {geoMsg && <p className="small text-2">{geoMsg}</p>}
        {error && <p className="small" style={{ color: 'var(--danger-text)' }}>{error}</p>}

        {near && q.trim().length < 2 && (
          <div>
            <div className="eyebrow" style={{ margin: '4px 0 6px' }}>Closest to you</div>
            {near.length === 0 && <p className="small text-2">No crossings within 50 km.</p>}
            {near.map((c) => <ResultRow key={c.id} c={c} onPick={pick} extra={`${c.distanceKm} km away`} />)}
          </div>
        )}

        {results && (
          <div>
            <div className="eyebrow" style={{ margin: '4px 0 6px' }}>Results</div>
            {results.length === 0 && <p className="small text-2">No crossing matches “{q}”. Try a station name, e.g. “Rajpura”.</p>}
            {results.map((c) => <ResultRow key={c.id} c={c} onPick={pick} />)}
          </div>
        )}

        {!results && !near && recents.length > 0 && (
          <div>
            <div className="eyebrow" style={{ margin: '4px 0 6px' }}>Recent</div>
            {recents.map((r) => (
              <button className="result" key={r.id} onClick={() => pick(r)}>
                <Icon name="history" size={18} color="var(--muted)" />
                <div className="grow result-name ellipsis">{r.label}</div>
                <Icon name="chevronRight" size={16} color="var(--muted)" />
              </button>
            ))}
          </div>
        )}
        <p className="tiny muted">Crossings: © OpenStreetMap contributors. Most are unnamed there, so they’re labelled by the nearest station.</p>
      </div>
    </Sheet>
  );
}

export default function CrossingPicker({ crossing, fallbackLabel }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="picker-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Icon name="pin" size={20} color="var(--gold)" />
        <div className="grow">
          <div className="picker-name ellipsis">{crossing?.name || crossing?.label || fallbackLabel}</div>
          <div className="picker-meta ellipsis">{crossing ? describeCrossing(crossing) || 'Tap to change' : 'Tap to change crossing'}</div>
        </div>
        <span className="tiny text-2 row" style={{ gap: 4 }}>Change <Icon name="chevronDown" size={14} /></span>
      </button>
      {open && <PickerSheet onClose={() => setOpen(false)} />}
    </>
  );
}
