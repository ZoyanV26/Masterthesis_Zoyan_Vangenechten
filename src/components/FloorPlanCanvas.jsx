import React, { useEffect, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
import proj4 from "proj4";

const FloorPlanCanvas = ({ geojson }) => {
  const [scaledCoords, setScaledCoords] = useState([]);
  const canvasWidth = window.innerWidth * 0.8; // 80% van de schermbreedte
  const canvasHeight = 500; // Vaste hoogte voor goed zicht

  useEffect(() => {
    if (!geojson || !geojson.coordinates) {
      console.warn("❌ Geen geldige geojson ontvangen!");
      return;
    }

    console.log("📌 Ontvangen geojson:", geojson);

    // 🔹 Definieer coördinaten om WGS84 om te zetten naar Belgische Lambert 72
    proj4.defs([
      ["EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs"],
      [
        "EPSG:31370",
        "+proj=lcc +lat_1=49.8333339 +lat_2=51.1666672333333 +lat_0=90 +lon_0=4.36748666666667 +x_0=150000.01256 +y_0=5400088.4378 +datum=WGS84 +units=m +no_defs",
      ],
    ]);

    // 🔹 Zet de geojson-coördinaten om naar meters
    const convertedCoords = geojson.coordinates[0].map(([lon, lat]) =>
      proj4("EPSG:4326", "EPSG:31370", [lon, lat])
    );

    console.log("📌 Omgezette coördinaten (meters):", convertedCoords);

    // 🔹 Rotatie berekenen
    const [x1, y1] = convertedCoords[0];
    const [x2, y2] = convertedCoords[1];
    const angle = -Math.atan2(y2 - y1, x2 - x1); // Correcte hoek bepalen
    console.log(`📐 Rotatiehoek: ${angle} rad`);

    // 🔹 Rotatie toepassen
    const rotatedCoords = convertedCoords.map(([x, y]) => {
      const newX = Math.cos(angle) * x - Math.sin(angle) * y;
      const newY = Math.sin(angle) * x + Math.cos(angle) * y;
      return [newX, newY];
    });

    console.log("📌 Gecorrigeerde coördinaten (na rotatie):", rotatedCoords);

    // 🔹 Centreer de punten zodat (0,0) op een hoek ligt
    const minX = Math.min(...rotatedCoords.map(([x]) => x));
    const minY = Math.min(...rotatedCoords.map(([, y]) => y));

    const centeredCoords = rotatedCoords.map(([x, y]) => [
      x - minX,
      y - minY,
    ]);

    console.log("📌 Gecentreerde coördinaten:", centeredCoords);

    // 🔹 Automatische schaal berekenen zodat alles past
    const maxX = Math.max(...centeredCoords.map(([x]) => x));
    const maxY = Math.max(...centeredCoords.map(([, y]) => y));
    const scaleFactor = Math.min(canvasWidth / maxX, canvasHeight / maxY) * 0.9; // 90% van canvasruimte benutten

    console.log(`📏 Schaalfactor: ${scaleFactor}`);

    // 🔹 Schaal de coördinaten naar het canvas-formaat
    let scaled = centeredCoords.map(([x, y]) => [
      x * scaleFactor,
      y * scaleFactor,
    ]);

    // 🔹 X- en Y-centrering toepassen
    const xOffset = (canvasWidth - maxX * scaleFactor) / 2;
    const yOffset = (canvasHeight - maxY * scaleFactor) / 2;

    scaled = scaled.flatMap(([x, y]) => [x + xOffset, y + yOffset]);

    console.log("📌 Geschaalde en gecentreerde coördinaten (pixels):", scaled);

    setScaledCoords(scaled);
  }, [geojson]);

  return (
    <div>
      <h3>📐 Grondplan</h3>
      <Stage width={canvasWidth} height={canvasHeight} style={{ border: "1px solid black" }}>
        <Layer>
          {scaledCoords.length > 0 ? (
            <Line
              points={scaledCoords}
              stroke="black"
              strokeWidth={4}
              closed
              fill="lightgray"
            />
          ) : (
            <text x={50} y={200} text="Geen data" fontSize={20} fill="red" />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default FloorPlanCanvas;
