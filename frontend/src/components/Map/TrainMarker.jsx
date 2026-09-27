import { Marker, Popup, Tooltip } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { useMemo } from 'react';
import { P, FONT, FONT_MONO } from '../../styles/palette';

// Trains are info-blue; delay escalates to amber. Red is reserved for gate-closing (CRITICAL).
const getDelayColor = (delayMinutes) => {
  if (delayMinutes < 10) return P.info;
  return P.warning;
};

const getApproachColor = (approachStatus) => {
  if (approachStatus === 'CRITICAL') return P.danger;
  if (approachStatus === 'APPROACHING') return P.warning;
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
          <path d="M22 6 L31 36 L22 30 L13 36 Z" fill="${borderColor}" stroke="${P.bg}" stroke-width="2"/>
          <path d="M22 6 L26 20 L22 18 L18 20 Z" fill="${P.text}" opacity="0.35"/>
          ${isSelected ? `<circle cx="22" cy="22" r="20" fill="none" stroke="${P.gold}" stroke-width="1.5" opacity="0.9"/>` : ''}
          ${approachColor ? `
            <circle cx="22" cy="22" r="20" fill="none" stroke="${approachColor}" stroke-width="2" opacity="0.6">
              <animate attributeName="r" values="20;24;20" dur="1.2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.2s" repeatCount="indefinite"/>
            </circle>
          ` : ''}
        </g>
        <circle cx="22" cy="22" r="3" fill="${P.text}"/>
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
        <div style={{ minWidth: '160px', fontFamily: FONT }}>
          <div style={{ fontWeight: 600, color: P.text, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {(isCritical || isApproaching) && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isCritical ? P.danger : P.warning }} />}
            {train.trainName}
          </div>
          <div style={{ fontSize: '0.7rem', color: P.infoText, fontFamily: FONT_MONO }}>#{train.trainNumber}</div>
          <div style={{ fontSize: '0.75rem', color: P.text2, marginTop: '0.25rem' }}>
            {train.speed || 60} km/h
          </div>
          {train.distToPhatak23 != null && (
            <div style={{ fontSize: '0.7rem', color: isCritical ? P.dangerText : isApproaching ? P.warning : P.muted, fontWeight: isCritical ? 600 : 400 }}>
              Pk23: {train.distToPhatak23} km · ETA {train.etaToPhatak23} min
            </div>
          )}
        </div>
      </Tooltip>

      <Popup>
        <div style={{ minWidth: '260px', fontFamily: FONT, color: P.text }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${P.border}` }}>
            <span style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: P.info }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: P.text }}>{train.trainName}</div>
              <div style={{ fontSize: '0.75rem', color: P.infoText, fontFamily: FONT_MONO }}>Train #{train.trainNumber}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div>
              <div style={{ color: P.muted, fontSize: '0.625rem', letterSpacing: '0.08em' }}>SPEED</div>
              <div style={{ fontWeight: 500 }}>{train.speed || 60} km/h</div>
            </div>
            <div>
              <div style={{ color: P.muted, fontSize: '0.625rem', letterSpacing: '0.08em' }}>DELAY</div>
              <div style={{ fontWeight: 500, color: (train.delayMinutes || 0) > 0 ? P.warning : P.text }}>
                {(train.delayMinutes || 0) > 0 ? `+${train.delayMinutes} min` : 'On time'}
              </div>
            </div>
            {train.distToPhatak23 != null && (
              <>
                <div>
                  <div style={{ color: P.muted, fontSize: '0.625rem', letterSpacing: '0.08em' }}>PHATAK 23</div>
                  <div style={{ fontWeight: 500, color: train.distToPhatak23 < 5 ? P.dangerText : P.text }}>
                    {train.distToPhatak23} km · {train.etaToPhatak23} min
                  </div>
                </div>
                <div>
                  <div style={{ color: P.muted, fontSize: '0.625rem', letterSpacing: '0.08em' }}>PHATAK 24</div>
                  <div style={{ fontWeight: 500, color: train.distToPhatak24 < 5 ? P.dangerText : P.text }}>
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
              backgroundColor: isCritical ? P.dangerBg : P.warningBg,
              border: `1px solid ${isCritical ? P.dangerBorder : P.warningBorder}`,
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isCritical ? P.dangerText : P.warning,
              textAlign: 'center',
            }}>
              {isCritical ? 'CLOSE GATE — Train within 5 km' : 'Gate Warning — Train Approaching'}
            </div>
          )}

          {train.schedule?.origin && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: P.muted }}>
              {train.schedule.origin} → {train.schedule.destination}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
