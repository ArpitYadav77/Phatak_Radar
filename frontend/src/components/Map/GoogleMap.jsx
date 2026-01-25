import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import PhatakMarker from "./PhatakMarker";
import { fetchPhataks } from "../../api/phatak.api";
import { useState } from "react";

export default function MapView() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  });

  const [phataks, setPhataks] = useState([]);

  const onIdle = async (map) => {
    const bounds = map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const res = await fetchPhataks({
      neLat: ne.lat(),
      neLng: ne.lng(),
      swLat: sw.lat(),
      swLng: sw.lng()
    });

    setPhataks(res.data);
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      zoom={6}
      center={{ lat: 22.5, lng: 78.9 }}
      mapContainerStyle={{ height: "100vh", width: "100%" }}
      onIdle={onIdle}
    >
      {phataks.map(p => (
        <PhatakMarker key={p._id} phatak={p} />
      ))}
    </GoogleMap>
  );
}
