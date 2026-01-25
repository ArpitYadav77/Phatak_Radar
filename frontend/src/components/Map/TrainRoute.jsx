import { Polyline } from 'react-leaflet';

export default function TrainRoute({ route, trainNumber }) {
  if (!route?.coordinates || route.coordinates.length < 2) {
    return null;
  }

  // Convert from [lng, lat] to [lat, lng] for Leaflet
  const positions = route.coordinates.map(([lng, lat]) => [lat, lng]);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: '#60a5fa',
        weight: 3,
        opacity: 0.6,
        dashArray: '10, 10',
        lineCap: 'round',
        lineJoin: 'round'
      }}
    />
  );
}
