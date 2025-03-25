import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

function MapZoomHandler({ geojson }) {
  const map = useMap();

  useEffect(() => {
    if (!geojson) return;

    const geoJsonLayer = L.geoJSON(geojson);
    const bounds = geoJsonLayer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, { maxZoom: 18 });
    }
  }, [geojson, map]);

  return null;
}

export default MapZoomHandler;
