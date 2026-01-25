import { Marker, Popup, Tooltip } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { useMemo } from 'react';

const getDelayColor = (delayMinutes) => {
  if (delayMinutes === 0) return '#34d399'; // Green - on time
  if (delayMinutes < 10) return '#60a5fa'; // Blue - slight delay
  if (delayMinutes < 20) return '#fb923c'; // Orange - moderate delay
  return '#f87171'; // Red - heavy delay
};

const getDelayLabel = (delayMinutes) => {
  if (delayMinutes === 0) return 'On Time';
  if (delayMinutes < 10) return 'Slight Delay';
  if (delayMinutes < 20) return 'Moderate Delay';
  return 'Heavy Delay';
};

export default function TrainMarker({ train, onClick, isSelected }) {
  const icon = useMemo(() => {
    const color = getDelayColor(train.delayMinutes);
    const rotation = train.direction || 0;
    
    // Create directional arrow SVG
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
        <g transform="rotate(${rotation}, 20, 20)">
          <!-- Shadow -->
          <path d="M20 8 L28 32 L20 28 L12 32 Z" fill="#000" opacity="0.3" transform="translate(1, 1)"/>
          <!-- Main arrow -->
          <path d="M20 8 L28 32 L20 28 L12 32 Z" fill="${color}" stroke="#0f172a" stroke-width="2"/>
          <!-- Highlight -->
          <path d="M20 8 L24 20 L20 18 L16 20 Z" fill="#fff" opacity="0.4"/>
          ${isSelected ? `<circle cx="20" cy="20" r="18" fill="none" stroke="#fbbf24" stroke-width="2" opacity="0.8"/>` : ''}
        </g>
        <!-- Train icon on top -->
        <text x="20" y="24" text-anchor="middle" font-size="14" fill="#fff" font-weight="bold">🚂</text>
      </svg>
    `;
    
    return new DivIcon({
      html: svgIcon,
      className: 'train-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  }, [train.direction, train.delayMinutes, isSelected]);

  if (!train.currentPosition?.coordinates) return null;

  const [lng, lat] = train.currentPosition.coordinates;
  const delayColor = getDelayColor(train.delayMinutes);

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick && onClick(train)
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
        <div style={{ minWidth: '150px' }}>
          <div style={{ fontWeight: '600', color: '#0f172a' }}>
            {train.trainName}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#475569' }}>
            {train.trainNumber}
          </div>
        </div>
      </Tooltip>
      
      <Popup>
        <div style={{ minWidth: '250px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.75rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🚂</span>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem', color: '#0f172a' }}>
                {train.trainName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Train #{train.trainNumber}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569', fontSize: '0.875rem' }}>Status:</span>
              <span style={{
                backgroundColor: delayColor,
                color: '#fff',
                padding: '0.125rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {getDelayLabel(train.delayMinutes)}
              </span>
            </div>

            {train.delayMinutes > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569', fontSize: '0.875rem' }}>Delay:</span>
                <span style={{ color: '#0f172a', fontWeight: '600', fontSize: '0.875rem' }}>
                  {train.delayMinutes} min
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569', fontSize: '0.875rem' }}>Speed:</span>
              <span style={{ color: '#0f172a', fontWeight: '600', fontSize: '0.875rem' }}>
                {train.speed} km/h
              </span>
            </div>

            {train.affectedPhataks && train.affectedPhataks.length > 0 && (
              <div style={{ 
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Approaching Crossings:
                </div>
                {train.affectedPhataks.slice(0, 3).map((phatak, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', color: '#0f172a', marginLeft: '0.5rem' }}>
                    • ETA {phatak.eta} min ({(phatak.distance / 1000).toFixed(1)} km)
                  </div>
                ))}
              </div>
            )}

            <div style={{ 
              marginTop: '0.5rem',
              fontSize: '0.7rem', 
              color: '#94a3b8',
              textAlign: 'center'
            }}>
              Updated {new Date(train.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
