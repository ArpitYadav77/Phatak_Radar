import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '../UI/Icon';
import { api } from '../../lib/api';
import { P } from '../../styles/palette';
import { TYPE_FILTERS, typeInfo } from '../../lib/trainTypes';
import { usePolling } from '../../hooks/usePolling';
import { load, save } from '../../lib/storage';

const PATIALA = [30.3406, 76.3868];
const MIN_ZOOM_ALL = 12;

const STATUS_COLOR = {
  OPEN: P.success,
  CLOSING_SOON: P.warning,
  CLOSED: P.danger,
  UNKNOWN: P.muted,
};
const STATUS_WORD = { OPEN: 'Open', CLOSING_SOON: 'Closing soon', CLOSED: 'Closed', UNKNOWN: 'No timetable' };

function trainIcon(t, dim) {
  const color = typeInfo(t.type).color;
  const html = `
    <div style="transform: rotate(${t.bearing || 0}deg); width:34px; height:34px; opacity:${dim ? 0.35 : 1}">
      <svg viewBox="0 0 34 34" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 3 L26 29 L17 23 L8 29 Z" fill="${color}" stroke="${P.bg}" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    </div>`;
  return new DivIcon({ html, className: 'train-icon', iconSize: [34, 34], iconAnchor: [17, 17] });
}

/** Loads crossings for the visible area (zoomed in) or the curated ones (zoomed out). */
function CrossingLayer({ selectedId, onSelect, onInfo }) {
  const map = useMap();
  const [items, setItems] = useState([]);
  const ctrlRef = useRef(null);
  const timerRef = useRef(null);

  const refresh = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      const z = map.getZoom();
      try {
        if (z >= MIN_ZOOM_ALL) {
          const b = map.getBounds();
          const r = await api.inBbox([b.getSouth(), b.getWest(), b.getNorth(), b.getEast()], { signal: ctrl.signal });
          setItems(r.items);
          onInfo({ zoomedOut: false, truncated: r.truncated, count: r.total });
        } else {
          const r = await api.curated({ signal: ctrl.signal });
          setItems(r.items);
          onInfo({ zoomedOut: true, truncated: false, count: r.total });
        }
      } catch (err) {
        if (err.name !== 'AbortError') onInfo({ error: true });
      }
    }, 250);
  };

  useMapEvents({ moveend: refresh });
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => { clearInterval(t); clearTimeout(timerRef.current); ctrlRef.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return items.map((c) => {
    const selected = c.id === selectedId;
    const known = c.status !== 'UNKNOWN';
    return (
      <CircleMarker
        key={c.id}
        center={[c.lat, c.lng]}
        radius={selected ? 11 : c.curated ? 9 : known ? 7 : 5}
        pathOptions={{
          color: selected ? P.gold : P.bg,
          weight: selected ? 3 : 1.5,
          fillColor: STATUS_COLOR[c.status] || P.muted,
          fillOpacity: known ? 0.95 : 0.7,
        }}
        eventHandlers={{ click: () => onSelect(c) }}
      >
        <Tooltip direction="top" offset={[0, -6]}>
          <strong>{c.name || c.label}</strong><br />
          {STATUS_WORD[c.status]}{c.train?.name ? ` · ${c.train.name}` : ''}
        </Tooltip>
      </CircleMarker>
    );
  });
}

function FlyTo({ center }) {
  const map = useMap();
  const last = useRef(null);
  useEffect(() => {
    if (!center) return;
    const key = center.join(',');
    if (last.current === key) return;
    last.current = key;
    const zoom = Math.max(map.getZoom(), 14);
    // flyTo needs a laid-out map; a hidden/zero-size container would produce NaN coordinates.
    const size = map.getSize();
    if (size.x > 0 && size.y > 0) map.flyTo(center, zoom, { duration: 0.6 });
    else map.setView(center, zoom, { animate: false });
  }, [center, map]);
  return null;
}

export default function CrossingMap({ center, selectedId, onSelect, showToolbar = true }) {
  const [railOverlay, setRailOverlay] = useState(() => load('pr-map-rail', true));
  const [hidden, setHidden] = useState(() => new Set(load('pr-map-hidden', [])));
  const [info, setInfo] = useState({});
  const trainsQ = usePolling((signal) => api.trains({ signal }), 15000);

  useEffect(() => save('pr-map-rail', railOverlay), [railOverlay]);
  useEffect(() => save('pr-map-hidden', [...hidden]), [hidden]);

  const hiddenTypes = useMemo(
    () => new Set(TYPE_FILTERS.filter((f) => hidden.has(f.key)).flatMap((f) => f.types)),
    [hidden],
  );
  const trains = (trainsQ.data?.trains || []).filter((t) => !hiddenTypes.has(t.type));

  const toggle = (key) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  return (
    <div className="stack" style={{ height: '100%', gap: 10 }}>
      {showToolbar && (
        <div className="chips" role="group" aria-label="Map layers and train filters">
          <button className={`chip ${railOverlay ? 'on' : ''}`} onClick={() => setRailOverlay((v) => !v)} aria-pressed={railOverlay}>
            <Icon name="layers" size={15} /> Rail lines
          </button>
          {TYPE_FILTERS.map((f) => (
            <button key={f.key} className={`chip ${hidden.has(f.key) ? '' : 'on'}`} onClick={() => toggle(f.key)} aria-pressed={!hidden.has(f.key)}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: typeInfo(f.types[0]).color }} />
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="map-frame">
        <MapContainer center={center || PATIALA} zoom={14} zoomControl scrollWheelZoom style={{ height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles-dark"
          />
          {railOverlay && (
            <TileLayer
              attribution='<a href="https://www.openrailwaymap.org/">OpenRailwayMap</a> (CC-BY-SA)'
              url="https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
              opacity={0.7}
              maxZoom={19}
            />
          )}
          <FlyTo center={center} />
          <CrossingLayer selectedId={selectedId} onSelect={onSelect} onInfo={setInfo} />
          {trains.map((t) => (
            <Marker key={`${t.number}-${t.state}`} position={[t.lat, t.lng]} icon={trainIcon(t, false)} zIndexOffset={500}>
              <Tooltip direction="top" offset={[0, -14]}>
                <strong>{t.name}</strong> <span className="mono">#{t.number}</span><br />
                {typeInfo(t.type).label} · {t.state === 'AT_PTA' ? 'at Patiala station' : 'estimated position'}
                {t.delayMin > 0 ? ` · ${t.delayMin} min late` : ''}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>

        <div className="map-overlay">
          {info.zoomedOut && <div className="map-note">Zoom in to see every crossing in view</div>}
          {info.truncated && <div className="map-note">Showing {info.count > 0 ? 'part' : 'none'} of {info.count} crossings — zoom in</div>}
          {info.error && <div className="map-note" style={{ color: 'var(--danger-text)' }}>Crossings unavailable — retrying</div>}
          <div className="legend">
            <span><i style={{ background: P.success }} />Open</span>
            <span><i style={{ background: P.warning }} />Closing soon</span>
            <span><i style={{ background: P.danger }} />Closed</span>
            <span><i style={{ background: P.muted }} />No timetable</span>
            <span className="row" style={{ gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 34 34" aria-hidden="true"><path d="M17 3 L26 29 L17 23 L8 29 Z" fill={P.info} /></svg>
              Train (timetable estimate)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
