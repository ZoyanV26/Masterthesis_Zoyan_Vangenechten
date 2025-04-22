// Volledig aangepaste Tryout.jsx met selecteerbare gevelimport en werkende canvas
import React, { useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Text, Group } from "react-konva";
import proj4 from "proj4";

const GRID_SIZE = 10;
const SCALE = 50;
const WALL_THICKNESS = 10;
const WALL_OVERSHOOT = 5;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const offsetX = CANVAS_WIDTH / 2;
const offsetY = CANVAS_HEIGHT / 2;

const exampleGeojson = {
  coordinates: [[
    [3.726, 51.05], [3.727, 51.05], [3.727, 51.051], [3.726, 51.051], [3.726, 51.05]
  ]]
};

const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export default function Tryout({ gevelExportData }) {
  const [walls, setWalls] = useState([]);
  const [drawingWall, setDrawingWall] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [hoveredWallIndex, setHoveredWallIndex] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [windows, setWindows] = useState([]);
  const [doors, setDoors] = useState([]);
  const [mode, setMode] = useState("draw");
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: offsetX, y: offsetY });
  const [selectedGevel, setSelectedGevel] = useState(null);

  const gevelKoppelingen = {
    "Voorgevel": 0,
    "Achtergevel": 1,
    "Zijgevel Links": 2,
    "Zijgevel Rechts": 3,
  };
  const gevelSegmentLengtes = {
    "Voorgevel": 8.4,
    "Achtergevel": 8.4,
    "Zijgevel Links": 6.2,
    "Zijgevel Rechts": 6.2,
  };

  useEffect(() => {
    if (!exampleGeojson?.coordinates) return;
    const coordinates = exampleGeojson.coordinates[0];
    proj4.defs([
      ["EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs"],
      [
        "EPSG:31370",
        "+proj=lcc +lat_1=49.8333339 +lat_2=51.1666672333333 +lat_0=90 +lon_0=4.36748666666667 +x_0=150000.01256 +y_0=5400088.4378 +datum=WGS84 +units=m +no_defs"
      ]
    ]);
    const converted = coordinates.map(([lon, lat]) => proj4("EPSG:4326", "EPSG:31370", [lon, lat]));
    const minX = Math.min(...converted.map(([x]) => x));
    const minY = Math.min(...converted.map(([, y]) => y));
    const maxX = Math.max(...converted.map(([x]) => x));
    const maxY = Math.max(...converted.map(([, y]) => y));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centered = converted.map(([x, y]) => [x - centerX, y - centerY]);
    const correctieFactor = 0.1;
    const corrected = centered.map(([x, y]) => [x * correctieFactor, y * correctieFactor]);
    const newWalls = [];
    for (let i = 0; i < corrected.length - 1; i++) {
      const [x1m, y1m] = corrected[i];
      const [x2m, y2m] = corrected[i + 1];
      newWalls.push({
        x1: x1m * SCALE,
        y1: y1m * SCALE,
        x2: x2m * SCALE,
        y2: y2m * SCALE,
        length: distance(x1m, y1m, x2m, y2m).toFixed(2)
      });
    }
    setWalls(newWalls);
  }, []);

  useEffect(() => {
    if (!selectedGevel || !gevelExportData) return;
    const geselecteerdeGevel = gevelExportData.find(g => g.gevelType === selectedGevel);
    if (!geselecteerdeGevel || !geselecteerdeGevel.polygons) return;

    const segmentLengte = gevelSegmentLengtes[selectedGevel] || 1;
    const schaal = (() => {
      const sl = geselecteerdeGevel.scaleLine;
      if (sl.length === 2) {
        const dx = sl[1].x - sl[0].x;
        const dy = sl[1].y - sl[0].y;
        const pixels = Math.sqrt(dx * dx + dy * dy);
        return segmentLengte / pixels;
      }
      return 1;
    })();

    const nieuweRuiten = [];
    const nieuweDeuren = [];

    geselecteerdeGevel.polygons.forEach((poly) => {
      const xs = poly.points.map(p => p.x);
      const ys = poly.points.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const width = (maxX - minX) * schaal * SCALE;
      const height = (maxY - minY) * schaal * SCALE;

      const isHorizontaal = width > height;
      const lengte = isHorizontaal ? width : height;

      const x1 = centerX * schaal * SCALE - (isHorizontaal ? lengte / 2 : 0);
      const y1 = centerY * schaal * SCALE - (!isHorizontaal ? lengte / 2 : 0);
      const x2 = centerX * schaal * SCALE + (isHorizontaal ? lengte / 2 : 0);
      const y2 = centerY * schaal * SCALE + (!isHorizontaal ? lengte / 2 : 0);

      const lijn = { x1, y1, x2, y2 };

      if (poly.name === "Window") nieuweRuiten.push(lijn);
      else if (poly.name === "Door") nieuweDeuren.push(lijn);
    });

    setWindows(prev => [...prev, ...nieuweRuiten]);
    setDoors(prev => [...prev, ...nieuweDeuren]);
    setSelectedGevel(null);
  }, [selectedGevel, gevelExportData]);

  return (
    <div>
      <h3>🧭 Modusselectie:</h3>
      {Object.keys(gevelKoppelingen).map((gevel) => (
        <button
          key={gevel}
          onClick={() => setSelectedGevel(gevel)}
          style={{ marginRight: 6 }}
        >
          ➕ Voeg {gevel}-openingen toe
        </button>
      ))}
      <Stage
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        draggable
        style={{ border: "1px solid #ccc" }}
      >
        <Layer>
          {[...Array(200)].map((_, i) => {
            const pos = (i - 100) * GRID_SIZE;
            return (
              <Group key={`grid-group-${i}`}>
                <Line points={[pos, -1000, pos, 1000]} stroke="#eee" strokeWidth={1} />
                <Line points={[-1000, pos, 1000, pos]} stroke="#eee" strokeWidth={1} />
              </Group>
            );
          })}

          {walls.map((wall, index) => (
            <Group key={index}>
              <Line
                points={[wall.x1, wall.y1, wall.x2, wall.y2]}
                stroke="black"
                strokeWidth={WALL_THICKNESS}
              />
              <Text
                text={`${wall.length} m`}
                x={(wall.x1 + wall.x2) / 2 + 5}
                y={(wall.y1 + wall.y2) / 2 + 5}
                fontSize={12}
                fill="#555"
              />
            </Group>
          ))}

          {windows.map((win, i) => (
            <Line
              key={`win-${i}`}
              points={[win.x1, win.y1, win.x2, win.y2]}
              stroke="blue"
              strokeWidth={WALL_THICKNESS}
            />
          ))}

          {doors.map((door, i) => (
            <Line
              key={`door-${i}`}
              points={[door.x1, door.y1, door.x2, door.y2]}
              stroke="brown"
              strokeWidth={WALL_THICKNESS}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
