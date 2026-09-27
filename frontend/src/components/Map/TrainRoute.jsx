import { Polyline } from 'react-leaflet';
import { P } from '../../styles/palette';

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
        color: P.info,
        weight: 3,
        opacity: 0.6,
        dashArray: '10, 10',
        lineCap: 'round',
        lineJoin: 'round'
      }}
    />
  );
}
