import { Marker, Popup, Tooltip } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { useMemo } from 'react';

const getDelayColor = (delayMinutes) => {
  if (delayMinutes === 0) return '#34d399';
  if (delayMinutes < 10) return '#60a5fa';
  if (delayMinutes < 20) return '#fb923c';
  return '#f87171';
};

const getApproachColor = (approachStatus) => {
  if (approachStatus === 'CRITICAL') return '#ef4444';
  if (approachStatus === 'APPROACHING') return '#f59e0b';
  return null;
};

export default function TrainMarker({ train, onClick, isSelected }) {
  const icon = useMemo(() => {
    const delayColor = getDelayColor(train.delayMinutes || 0);
    const approachColor = getApproachColor(train.approachStatus);
    const borderColor = approachColor || delayColor;
    const rotation = train.direction || 0;

    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="44" height="44">
        <g transform="rotate(${rotation}, 22, 22)">
          <path d="M22 6 L31 36 L22 30 L13 36 Z" fill="${borderColor}" stroke="#0f172a" stroke-width="2"/>
          <path d="M22 6 L26 20 L22 18 L18 20 Z" fill="#fff" opacity="0.4"/>
          ${isSelected ? `<circle cx="22" cy="22" r="20" fill="none" stroke="#fbbf24" stroke-width="2" opacity="0.85"/>` : ''}
          ${approachColor ? `
            <circle cx="22" cy="22" r="20" fill="none" stroke="${approachColor}" stroke-width="2.5" opacity="0.6">
              <animate attributeName="r" values="20;24;20" dur="1.2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.2s" repeatCount="indefinite"/>
            </circle>
          ` : ''}
        </g>
        <text x="22" y="26" text-anchor="middle" font-size="13" fill="#fff" font-weight="bold">🚂</text>
      </svg>
    `;

    return new DivIcon({
      html: svgIcon,
      className: 'train-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
    });
  }, [train.direction, train.delayMinutes, train.approachStatus, isSelected]);

  if (!train.currentPosition?.coordinates) return null;
  const [lng, lat] = train.currentPosition.coordinates;

  const isCritical = train.approachStatus === 'CRITICAL';
  const isApproaching = train.approachStatus === 'APPROACHING';

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{ click: () => onClick && onClick(train) }}
    >
      <Tooltip direction="top" offset={[0, -22]} opacity={0.95} permanent={isCritical}>
        <div style={{ minWidth: '160px', fontFamily: 'system-ui' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {isCritical && <span>🚨</span>}
            {isApproaching && !isCritical && <span>⚠️</span>}
            {train.trainName}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#475569' }}>#{train.trainNumber}</div>
          <div style={{ fontSize: '0.75rem', color: '#1e40af', marginTop: '0.25rem' }}>
            ⚡ {train.speed || 60} km/h
          </div>
          {train.distToPhatak23 != null && (
            <div style={{ fontSize: '0.7rem', color: isCritical ? '#ef4444' : isApproaching ? '#f59e0b' : '#475569', fontWeight: isCritical ? 700 : 400 }}>
              Pk23: {train.distToPhatak23} km · ETA {train.etaToPhatak23} min
            </div>
          )}
        </div>
      </Tooltip>

      <Popup>
        <div style={{ minWidth: '260px', fontFamily: 'system-ui' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '1.5rem' }}>🚂</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{train.trainName}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Train #{train.trainNumber}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.65rem' }}>SPEED</div>
              <div style={{ fontWeight: 700 }}>{train.speed || 60} km/h</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.65rem' }}>DELAY</div>
              <div style={{ fontWeight: 700, color: (train.delayMinutes || 0) > 0 ? '#ef4444' : '#10b981' }}>
                {(train.delayMinutes || 0) > 0 ? `+${train.delayMinutes} min` : 'On time'}
              </div>
            </div>
            {train.distToPhatak23 != null && (
              <>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.65rem' }}>PHATAK 23</div>
                  <div style={{ fontWeight: 700, color: train.distToPhatak23 < 5 ? '#ef4444' : '#0f172a' }}>
                    {train.distToPhatak23} km · {train.etaToPhatak23} min
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.65rem' }}>PHATAK 24</div>
                  <div style={{ fontWeight: 700, color: train.distToPhatak24 < 5 ? '#ef4444' : '#0f172a' }}>
                    {train.distToPhatak24} km · {train.etaToPhatak24} min
                  </div>
                </div>
              </>
            )}
          </div>

          {train.approachStatus && train.approachStatus !== 'CLEAR' && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              backgroundColor: isCritical ? '#fee2e2' : '#fef3c7',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: isCritical ? '#991b1b' : '#92400e',
              textAlign: 'center',
            }}>
              {isCritical ? '🚨 CLOSE GATE — Train within 5 km' : '⚠️ Gate Warning — Train Approaching'}
            </div>
          )}

          {train.schedule?.origin && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#64748b' }}>
              {train.schedule.origin} → {train.schedule.destination}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
