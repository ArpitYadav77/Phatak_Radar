import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TrainMarker from './TrainMarker';
import TrainRoute from './TrainRoute';
import { useState, useEffect } from 'react';
import { PHATAK_23, PHATAK_24, APPROACH_RADIUS_KM, CRITICAL_RADIUS_KM } from '../../lib/trainData';
import { P, FONT } from '../../styles/palette';

// ─── Patiala city center (Rajpura–Patiala–Dhuri line) ───────────────────────
const PATIALA = [30.3398, 76.3869];

// ─── Phatak icon factory ──────────────────────────────────────────────────────
function createPhatakIcon(gateStatus, isSelected) {
  const colorMap = {
    OPEN: P.success,
    WARNING: P.warning,
    CLOSED: P.danger,
    UNKNOWN: P.muted,
  };
  const color = colorMap[gateStatus] || colorMap.UNKNOWN;
  const pulse = gateStatus === 'CLOSED' || isSelected;

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="32" height="48">
      <defs>
        <filter id="sh">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity="0.5"/>
        </filter>
      </defs>
      <path d="M16 0C9.4 0 4 5.4 4 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"
            fill="${color}" stroke="${isSelected ? P.gold : P.bg}" stroke-width="${isSelected ? 2 : 1.5}" filter="url(#sh)"/>
      <circle cx="16" cy="12" r="4.5" fill="${P.bg}" opacity="0.35"/>
      <circle cx="16" cy="12" r="3" fill="${P.text}"/>
      ${pulse ? `
        <circle cx="16" cy="12" r="9" fill="none" stroke="${isSelected && gateStatus !== 'CLOSED' ? P.gold : color}" stroke-width="2" opacity="0.7">
          <animate attributeName="r" values="9;14;9" dur="1.6s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1.6s" repeatCount="indefinite"/>
        </circle>
      ` : ''}
    </svg>
  `;

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgContent)}`,
    iconSize: [32, 48],
    iconAnchor: [16, 45],
    popupAnchor: [0, -45],
  });
}

// ─── Component to handle map re-centering ─────────────────────────────────────
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    // Only set view once on mount
  }, []);
  return null;
}

// ─── Approach line from train to phatak ───────────────────────────────────────
function ApproachLine({ trainPos, phatakPos, color }) {
  if (!trainPos || !phatakPos) return null;
  return (
    <Polyline
      positions={[trainPos, phatakPos]}
      pathOptions={{ color, weight: 2, dashArray: '8,6', opacity: 0.7 }}
    />
  );
}

export default function MapView({ phataks, trains, onPhatakClick, onTrainClick, selectedTrain, selectedPhatak }) {
  const monitored = phataks.filter(
    (p) => p.phatakId === PHATAK_23.id || p.phatakId === PHATAK_24.id
  );
  const other = phataks.filter(
    (p) => p.phatakId !== PHATAK_23.id && p.phatakId !== PHATAK_24.id
  );

  return (
    <MapContainer
      center={PATIALA}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      {/* OSM tiles dimmed/desaturated via .map-tiles-dark (global.css) so status markers carry the color */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles-dark"
      />

      {/* ── Approach radius circles around Phatak 23 and 24 ── */}
      {monitored.map((phatak) => {
        if (!phatak.lat || !phatak.lng) return null;
        const gateStatus = phatak.liveStatus?.gateStatus || phatak.status || 'OPEN';
        return (
          <g key={`circles-${phatak.phatakId}`}>
            {/* 15 km warning radius */}
            <Circle
              center={[phatak.lat, phatak.lng]}
              radius={APPROACH_RADIUS_KM * 1000}
              pathOptions={{ color: P.warning, fillColor: P.warning, fillOpacity: 0.025, weight: 1, opacity: 0.55, dashArray: '6,6' }}
            />
            {/* 5 km critical radius */}
            <Circle
              center={[phatak.lat, phatak.lng]}
              radius={CRITICAL_RADIUS_KM * 1000}
              pathOptions={{ color: P.danger, fillColor: P.danger, fillOpacity: 0.06, weight: 1, opacity: 0.7 }}
            />
          </g>
        );
      })}

      {/* ── Approach lines from trains to nearest phatak ── */}
      {trains
        .filter((t) => t.approachStatus === 'CRITICAL' || t.approachStatus === 'APPROACHING')
        .map((train) => {
          if (!train.currentPosition?.coordinates) return null;
          const [lng, lat] = train.currentPosition.coordinates;
          // Find nearest monitored phatak
          const nearestPhatak = monitored.sort((a, b) =>
            (train.distToPhatak23 ?? 999) - (train.distToPhatak24 ?? 999)
          )[0];
          if (!nearestPhatak) return null;
          return (
            <ApproachLine
              key={`line-${train.trainNumber}`}
              trainPos={[lat, lng]}
              phatakPos={[nearestPhatak.lat, nearestPhatak.lng]}
              color={train.approachStatus === 'CRITICAL' ? P.danger : P.warning}
            />
          );
        })}

      {/* ── Monitored phatak markers (23 and 24) ── */}
      {monitored.map((phatak) => {
        if (!phatak.lat || !phatak.lng) return null;
        const gateStatus = phatak.liveStatus?.gateStatus || phatak.status || 'OPEN';
        const isSelected = selectedPhatak?.phatakId === phatak.phatakId;
        const approachingTrains = phatak.liveStatus?.approachingTrains || [];

        return (
          <Marker
            key={phatak.phatakId}
            position={[phatak.lat, phatak.lng]}
            icon={createPhatakIcon(gateStatus, isSelected)}
            eventHandlers={{ click: () => onPhatakClick && onPhatakClick(phatak) }}
          >
            <Popup minWidth={240}>
              <div style={{ fontFamily: FONT, color: P.text }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
                  {phatak.name}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '0.1875rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: gateStatus === 'CLOSED' ? P.dangerBg : gateStatus === 'WARNING' ? P.warningBg : P.successBg,
                  border: `1px solid ${gateStatus === 'CLOSED' ? P.dangerBorder : gateStatus === 'WARNING' ? P.warningBorder : P.successBorder}`,
                  color: gateStatus === 'CLOSED' ? P.dangerText : gateStatus === 'WARNING' ? P.warning : P.successText,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  marginBottom: '0.5rem',
                }}>
                  {gateStatus === 'CLOSED' ? 'GATE CLOSED — TRAIN IN WINDOW' : gateStatus === 'WARNING' ? 'PREPARE TO CLOSE' : 'GATE OPEN'}
                </div>

                {/* Schedule-based info */}
                {phatak.liveStatus?.scheduledTrain && (
                  <div style={{ fontSize: '0.8rem', color: P.text, marginTop: '0.25rem' }}>
                    <strong style={{ fontWeight: 500 }}>{phatak.liveStatus.scheduledTrain.trainName}</strong> <span style={{ color: P.infoText }}>({phatak.liveStatus.scheduledTrain.trainNumber})</span>
                    <br/>
                    <span style={{ fontSize: '0.75rem', color: P.text2 }}>
                      Scheduled: {phatak.liveStatus.scheduledTrain.scheduledTime}
                      {phatak.liveStatus.minutesToCrossing != null && (
                        <> · {Math.abs(Math.round(phatak.liveStatus.minutesToCrossing))} min {phatak.liveStatus.minutesToCrossing > 0 ? 'to crossing' : 'ago'}</>
                      )}
                    </span>
                  </div>
                )}

                {/* GPS-tracked trains */}
                {approachingTrains.filter(t => t.source === 'gps').length > 0 && (
                  <div style={{ marginTop: '0.5rem', borderTop: `1px solid ${P.border}`, paddingTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.625rem', color: P.muted, letterSpacing: '0.08em', marginBottom: '0.25rem' }}>GPS TRACKED</div>
                    {approachingTrains.filter(t => t.source === 'gps').slice(0, 3).map((t, i) => (
                      <div key={i} style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{t.trainName} ({t.trainNumber})</span>
                        <span style={{ color: t.distanceKm <= CRITICAL_RADIUS_KM ? P.dangerText : P.warning }}>{t.distanceKm} km · {t.eta} min</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '0.65rem', color: P.muted, marginTop: '0.5rem' }}>
                  {phatak.lat?.toFixed(4)}°N, {phatak.lng?.toFixed(4)}°E · Gate logic: ±10 min schedule
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* ── Other phatak markers ── */}
      {other.map((phatak) => {
        if (!phatak.location?.coordinates && !phatak.lat) return null;
        const lat = phatak.lat || phatak.location.coordinates[1];
        const lng = phatak.lng || phatak.location.coordinates[0];
        const isSelected = selectedPhatak?._id === phatak._id;
        const status = phatak.status || 'OPEN';

        return (
          <Marker
            key={phatak._id || phatak.phatakId}
            position={[lat, lng]}
            icon={createPhatakIcon(status, isSelected)}
            eventHandlers={{ click: () => onPhatakClick && onPhatakClick(phatak) }}
          >
            <Popup>
              <div style={{ minWidth: '180px', fontFamily: FONT, color: P.text }}>
                <strong style={{ fontWeight: 600 }}>{phatak.name}</strong>
                <div style={{
                  marginTop: '0.4rem',
                  padding: '0.125rem 0.5rem',
                  backgroundColor: status === 'CLOSED' ? P.dangerBg : P.successBg,
                  border: `1px solid ${status === 'CLOSED' ? P.dangerBorder : P.successBorder}`,
                  color: status === 'CLOSED' ? P.dangerText : P.successText,
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                }}>
                  {status}
                </div>
                {phatak.trainInfo && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: P.text2 }}>{phatak.trainInfo}</div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* ── Train route for selected train ── */}
      {selectedTrain?.route && (
        <TrainRoute route={selectedTrain.route} trainNumber={selectedTrain.trainNumber} />
      )}

      {/* ── Train markers ── */}
      {trains.map((train) => (
        <TrainMarker
          key={train._id || train.trainNumber}
          train={train}
          onClick={onTrainClick}
          isSelected={selectedTrain?._id === train._id || selectedTrain?.trainNumber === train.trainNumber}
        />
      ))}
    </MapContainer>
  );
}
