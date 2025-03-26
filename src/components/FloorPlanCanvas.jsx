import React, { useEffect, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
import proj4 from "proj4";

const gevelOpties = ["Voorgevel", "Achtergevel", "Zijgevel Links", "Zijgevel Rechts"];

const FloorPlanCanvas = ({ geojson }) => {
  const [scaledCoords, setScaledCoords] = useState([]);
  const [segments, setSegments] = useState([]);
  const [selectedGevel, setSelectedGevel] = useState("");
  const [gevelKoppelingen, setGevelKoppelingen] = useState({});

  const canvasWidth = window.innerWidth * 0.8;
  const canvasHeight = 500;

  useEffect(() => {
    if (!geojson || !geojson.coordinates) return;

    proj4.defs([
      ["EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs"],
      [
        "EPSG:31370",
        "+proj=lcc +lat_1=49.8333339 +lat_2=51.1666672333333 +lat_0=90 +lon_0=4.36748666666667 +x_0=150000.01256 +y_0=5400088.4378 +datum=WGS84 +units=m +no_defs",
      ],
    ]);

    const convertedCoords = geojson.coordinates[0].map(([lon, lat]) =>
      proj4("EPSG:4326", "EPSG:31370", [lon, lat])
    );

    const [x1, y1] = convertedCoords[0];
    const [x2, y2] = convertedCoords[1];
    const angle = -Math.atan2(y2 - y1, x2 - x1);

    const rotatedCoords = convertedCoords.map(([x, y]) => {
      const newX = Math.cos(angle) * x - Math.sin(angle) * y;
      const newY = Math.sin(angle) * x + Math.cos(angle) * y;
      return [newX, newY];
    });

    const minX = Math.min(...rotatedCoords.map(([x]) => x));
    const minY = Math.min(...rotatedCoords.map(([, y]) => y));

    const centeredCoords = rotatedCoords.map(([x, y]) => [x - minX, y - minY]);

    const maxX = Math.max(...centeredCoords.map(([x]) => x));
    const maxY = Math.max(...centeredCoords.map(([, y]) => y));
    const scaleFactor = Math.min(canvasWidth / maxX, canvasHeight / maxY) * 0.9;

    const xOffset = (canvasWidth - maxX * scaleFactor) / 2;
    const yOffset = (canvasHeight - maxY * scaleFactor) / 2;

    const scaled = centeredCoords.map(([x, y]) => [x * scaleFactor + xOffset, y * scaleFactor + yOffset]);
    setScaledCoords(scaled);

    const segs = [];
    for (let i = 0; i < scaled.length - 1; i++) {
      segs.push({ id: i, start: scaled[i], end: scaled[i + 1] });
    }
    setSegments(segs);
  }, [geojson]);

  const handleSegmentClick = (id) => {
    if (!selectedGevel) {
      alert("Selecteer eerst een gevel in het dropdown-menu boven het plan.");
      return;
    }

    const nieuweKoppelingen = { ...gevelKoppelingen, [selectedGevel]: id };
    setGevelKoppelingen(nieuweKoppelingen);
    console.log("📌 Gevel gekoppeld:", nieuweKoppelingen);
  };

  return (
    <div>
      <h3>📐 Grondplan</h3>

      <label style={{ display: "block", marginBottom: 5 }}>Kies gevel om te koppelen:</label>
      <select
        value={selectedGevel}
        onChange={(e) => setSelectedGevel(e.target.value)}
        style={{ marginBottom: 10 }}
      >
        <option value="">-- Selecteer gevel --</option>
        {gevelOpties.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>

      <Stage width={canvasWidth} height={canvasHeight} style={{ border: "1px solid black" }}>
        <Layer>
          {segments.map((seg) => (
            <Line
              key={seg.id}
              points={[...seg.start, ...seg.end]}
              stroke={Object.values(gevelKoppelingen).includes(seg.id) ? "green" : "gray"}
              strokeWidth={6}
              onClick={() => handleSegmentClick(seg.id)}
              perfectDrawEnabled={false}
              hitStrokeWidth={10}
              strokeScaleEnabled={false}
              listening={true}
            />
          ))}
        </Layer>

        <Layer>
          {scaledCoords.length > 0 && (
            <Line
              points={scaledCoords.flat()}
              stroke="black"
              strokeWidth={2}
              closed
              fill="lightgray"
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      <div style={{ marginTop: 10 }}>
        <strong>Gekoppelde segmenten:</strong>
        <ul>
          {Object.entries(gevelKoppelingen).map(([gevel, id]) => (
            <li key={gevel}>{gevel}: segment {id}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FloorPlanCanvas;
