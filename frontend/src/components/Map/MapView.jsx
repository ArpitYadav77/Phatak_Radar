import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TrainMarker from './TrainMarker';
import TrainRoute from './TrainRoute';
import { useState } from 'react';

const center = [28.6139, 77.2090]; // [lat, lng] for Delhi

// Create custom icons for different statuses
const createIcon = (status, isSelected) => {
  const colors = {
    open: '#10b981',
    closed: '#ef4444',
    unknown: '#64748b'
  };
  
  const color = colors[status?.toLowerCase()] || colors.unknown;
  const glowColor = '#14b8a6'; // Teal glow for selection
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="36" height="48">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <!-- Pin shape -->
        <path d="M12 0C7.031 0 3 4.031 3 9c0 6.75 9 18 9 18s9-11.25 9-18c0-4.969-4.031-9-9-9z" 
              fill="${color}" 
              stroke="#0a0f1e" 
              stroke-width="1.5"
              filter="url(#shadow)"/>
        <!-- Inner circle -->
        <circle cx="12" cy="9" r="4" fill="#0a0f1e" opacity="0.3"/>
        <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
        ${isSelected ? `
          <!-- Selection ring with teal glow -->
          <circle cx="12" cy="9" r="7" fill="none" stroke="${glowColor}" stroke-width="2.5" opacity="0.8" filter="url(#glow)">
            <animate attributeName="r" values="7;10;7" dur="1.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.8s" repeatCount="indefinite"/>
          </circle>
          <circle cx="12" cy="9" r="8" fill="none" stroke="${glowColor}" stroke-width="1" opacity="0.4">
            <animate attributeName="r" values="8;11;8" dur="1.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.8s" repeatCount="indefinite"/>
          </circle>
        ` : ''}
      </svg>
    `)}`,
    iconSize: [36, 48],
    iconAnchor: [18, 45],
    popupAnchor: [0, -45]
  });
};

export default function MapView({ phataks, trains, onPhatakClick, onTrainClick, selectedTrain, selectedPhatak }) {
  const [showTrainRoutes, setShowTrainRoutes] = useState(false);

  return (
    <MapContainer 
      center={center} 
      zoom={12} 
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Phatak Markers (Static Layer) */}
      {phataks && phataks.map((phatak) => {
        if (!phatak.location?.coordinates) return null;
        
        const [lng, lat] = phatak.location.coordinates;
        const isSelected = selectedPhatak?._id === phatak._id;
        
        return (
          <Marker
            key={phatak._id}
            position={[lat, lng]}
            icon={createIcon(phatak.status, isSelected)}
            eventHandlers={{
              click: () => onPhatakClick && onPhatakClick(phatak)
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{phatak.name}</strong>
                <div style={{ 
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 
                    phatak.status?.toLowerCase() === 'closed' ? '#f87171' : 
                    phatak.status?.toLowerCase() === 'open' ? '#34d399' : '#94a3b8',
                  color: '#0f172a',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  display: 'inline-block'
                }}>
                  {phatak.status || 'Unknown'}
                </div>
                {phatak.trainInfo && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                    🚂 {phatak.trainInfo}
                  </div>
                )}
                {phatak.eta && (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#f87171', fontWeight: '600' }}>
                    ETA: {phatak.eta} minutes
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Train Route (Context Layer) - Only for selected train */}
      {selectedTrain && selectedTrain.route && (
        <TrainRoute 
          route={selectedTrain.route} 
          trainNumber={selectedTrain.trainNumber}
        />
      )}

      {/* Train Markers (Dynamic Layer) */}
      {trains && trains.map((train) => (
        <TrainMarker
          key={train._id}
          train={train}
          onClick={onTrainClick}
          isSelected={selectedTrain?._id === train._id}
        />
      ))}
    </MapContainer>
  );
}
