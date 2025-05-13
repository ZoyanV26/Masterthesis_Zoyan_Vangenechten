import React, { useRef, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MapZoomHandler from "./MapZoomHandler";

function MapComponent({ geojson }) {
  const geoJsonLayerRef = useRef(null);

  function ClearOldGeoJSON({ geojson }) {
    const map = useMap();

    useEffect(() => {
      if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current); // ✅ Oude polygoon verwijderen
      }

      if (geojson) {
        geoJsonLayerRef.current = L.geoJSON(geojson).addTo(map); // ✅ Nieuwe polygoon toevoegen
      }
    }, [geojson, map]);

    return null;
  }

  return (
    <MapContainer center={[51.0, 3.0]} zoom={25} style={{ height: "500px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {geojson && <ClearOldGeoJSON geojson={geojson} />}
      {geojson && <MapZoomHandler geojson={geojson} />}
    </MapContainer>
  );
}

export default MapComponent;

