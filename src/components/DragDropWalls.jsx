import React, { useEffect, useState } from "react";
import { Stage, Layer, Line, Rect } from "react-konva";
import proj4 from "proj4";

const FloorPlanCanvas = ({ geojson }) => {
  const [scaledCoords, setScaledCoords] = useState([]);
  const [walls, setWalls] = useState([]);

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

    // 🔹 Centreer de punten zodat (0,0) op een hoek ligt
    const minX = Math.min(...convertedCoords.map(([x]) => x));
    const minY = Math.min(...convertedCoords.map(([, y]) => y));

    const centeredCoords = convertedCoords.map(([x, y]) => [
      x - minX,
      y - minY,
    ]);

    console.log("📌 Gecentreerde coördinaten:", centeredCoords);

    // 🔹 Schaal de coördinaten naar het canvas-formaat (1m = 10px)
    const scaleFactor = 10;
    const scaled = centeredCoords.flatMap(([x, y]) => [
      x * scaleFactor,
      y * scaleFactor,
    ]);

    console.log("📌 Geschaalde coördinaten (pixels):", scaled);

    setScaledCoords(scaled);
  }, [geojson]);

  // ✅ Voeg een muur toe met standaard grootte
  const addWall = () => {
    setWalls([
      ...walls,
      { id: walls.length, x: 100, y: 100, width: 80, height: 10 },
    ]);
  };

  // ✅ Update de positie van een muur
  const moveWall = (id, newX, newY) => {
    setWalls(
      walls.map((wall) =>
        wall.id === id ? { ...wall, x: newX, y: newY } : wall
      )
    );
  };

  return (
    <div>
      <h3>📐 Grondplan</h3>
      <button onClick={addWall}>➕ Voeg Muur Toe</button>
      <Stage width={600} height={600} style={{ border: "1px solid black" }}>
        <Layer>
          {/* 🔹 Grondplan tekenen */}
          {scaledCoords.length > 0 && (
            <Line
              points={scaledCoords}
              stroke="black"
              strokeWidth={4}
              closed
              fill="lightgray"
            />
          )}

          {/* 🔹 Binnenmuren tekenen en verplaatsbaar maken */}
          {walls.map((wall) => (
            <Rect
              key={wall.id}
              x={wall.x}
              y={wall.y}
              width={wall.width}
              height={wall.height}
              fill="black"
              draggable
              onDragMove={(e) =>
                moveWall(wall.id, e.target.x(), e.target.y())
              }
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default FloorPlanCanvas;
