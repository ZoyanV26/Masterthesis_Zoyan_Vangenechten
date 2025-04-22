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
  const [selectedWallIndex, setSelectedWallIndex] = useState(null);
  const [drawingWall, setDrawingWall] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [hoveredWallIndex, setHoveredWallIndex] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [windows, setWindows] = useState([]);
  const [doors, setDoors] = useState([]);
  const [mode, setMode] = useState("draw");
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: offsetX, y: offsetY });
  const [verdieping, setVerdieping] = useState(0); // 0 = gelijkvloers


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
    console.log("gevelExportData ontvangen:", gevelExportData);
  }, [gevelExportData]);




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

    
  }, [gevelExportData]);

// Vervolg van component na useEffect

// Vervolg van component na useEffect

const snap = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE;

const handleClick = (e) => {
  const stage = e.target.getStage();
  const pointer = stage.getPointerPosition();
  const x = snap((pointer.x - stagePosition.x) / stageScale);
  const y = snap((pointer.y - stagePosition.y) / stageScale);

  if (mode === "select") {
    floodFill(x, y);
    return;
  }
  if (mode === "delete") {
    const toDelete = walls.findIndex(
      (wall) => pointToSegment(x, y, wall.x1, wall.y1, wall.x2, wall.y2) < WALL_THICKNESS / 2
    );
    if (toDelete !== -1) {
      const updated = [...walls];
      updated.splice(toDelete, 1);
      setWalls(updated);
    }
    return;
  }
  if (mode === "deleteWindow") {
    const toDelete = windows.findIndex(
      (w) => pointToSegment(x, y, w.x1, w.y1, w.x2, w.y2) < WALL_THICKNESS / 2
    );
    if (toDelete !== -1) {
      const updated = [...windows];
      updated.splice(toDelete, 1);
      setWindows(updated);
    }
    return;
  }
  if (mode === "deleteDoor") {
    const toDelete = doors.findIndex(
      (d) => pointToSegment(x, y, d.x1, d.y1, d.x2, d.y2) < WALL_THICKNESS / 2
    );
    if (toDelete !== -1) {
      const updated = [...doors];
      updated.splice(toDelete, 1);
      setDoors(updated);
    }
    return;
  }
  if (mode === "addWindow" || mode === "addDoor") {
    let closest = null;
    let minDist = Infinity;
    let clickedProjection = null;

    for (const wall of walls) {
      const dist = pointToSegment(x, y, wall.x1, wall.y1, wall.x2, wall.y2);
      if (dist < minDist && dist < WALL_THICKNESS * 2) {
        minDist = dist;
        closest = wall;

        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len;
        const uy = dy / len;

        const vx = x - wall.x1;
        const vy = y - wall.y1;
        const dot = vx * ux + vy * uy;

        const clampedDot = Math.max(0, Math.min(dot, len));
        const projX = wall.x1 + ux * clampedDot;
        const projY = wall.y1 + uy * clampedDot;

        clickedProjection = { x: projX, y: projY, ux, uy };
      }
    }

    if (closest && clickedProjection) {
      const input = prompt(`Geef de lengte van de ${mode === "addDoor" ? "deur" : "ruit"} in meters:`, "1");
      const lengthMeters = parseFloat(input);
      if (isNaN(lengthMeters) || lengthMeters <= 0) return;

      const elemLen = lengthMeters * SCALE;
      const { x, y, ux, uy } = clickedProjection;

      const x1 = x - (ux * elemLen) / 2;
      const y1 = y - (uy * elemLen) / 2;
      const x2 = x + (ux * elemLen) / 2;
      const y2 = y + (uy * elemLen) / 2;

      const newElem = { x1, y1, x2, y2 };
      if (mode === "addWindow") setWindows([...windows, newElem]);
      else if (mode === "addDoor") setDoors([...doors, newElem]);
    }
    return;
  }
  if (mode === "draw") {
    if (!drawingWall) {
      setDrawingWall({ x1: x, y1: y, x2: x, y2: y });
    } else {
      const newWall = {
        x1: drawingWall.x1,
        y1: drawingWall.y1,
        x2: x,
        y2: y,
        length: (distance(drawingWall.x1, drawingWall.y1, x, y) / SCALE).toFixed(2)
      };
      setWalls([...walls, newWall]);
      setDrawingWall(null);
    }
  }
};

  const handleMouseMove = (e) => {
  const stage = e.target.getStage();
  const pointer = stage.getPointerPosition();
  setMousePos(pointer);
  if (drawingWall) {
    setDrawingWall({
      ...drawingWall,
      x2: snap((pointer.x - stagePosition.x) / stageScale),
      y2: snap((pointer.y - stagePosition.y) / stageScale)
    });
  }
};

const floodFill = (x, y) => {
  const visited = new Set();
  const queue = [{ x, y }];
  const filled = [];
  const key = (x, y) => `${x},${y}`;
  while (queue.length > 0) {
    const { x, y } = queue.shift();
    if (visited.has(key(x, y))) continue;
    visited.add(key(x, y));
    filled.push({ x, y });
    const neighbors = [
      { x: x + GRID_SIZE, y },
      { x: x - GRID_SIZE, y },
      { x, y: y + GRID_SIZE },
      { x, y: y - GRID_SIZE }
    ];
    for (const n of neighbors) {
      if (!visited.has(key(n.x, n.y)) && !touchesWall(n.x, n.y)) {
        queue.push(n);
      }
    }
  }
  setRooms(prev => [...prev, filled]);
};

const touchesWall = (x, y) => {
  return walls.some((wall) => pointToSegment(x, y, wall.x1, wall.y1, wall.x2, wall.y2) < WALL_THICKNESS / 2);
};

const pointToSegment = (px, py, x1, y1, x2, y2) => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;
  let xx, yy;
  if (param < 0) { xx = x1; yy = y1; }
  else if (param > 1) { xx = x2; yy = y2; }
  else { xx = x1 + param * C; yy = y1 + param * D; }
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

const handleGevelToewijzing = (gevelType) => {
  if (selectedWallIndex === null) return;
  const updated = [...walls];
  updated[selectedWallIndex].gevelType = gevelType;
  setWalls(updated);

  const muur = updated[selectedWallIndex];
  projecteerPolygonenOpMuur(gevelType, muur);
  console.log("Toegewezen gevel:", gevelType);
  console.log("Muur:", muur);
  console.log("Gegevens gevel:", gevelExportData?.find(g => g.gevelType === gevelType));
  console.log("gevelExportData:", gevelExportData);


};

const projecteerPolygonenOpMuur = (gevelType, muur) => {
  const gevel = gevelExportData?.find(g => g.gevelType === gevelType);
  if (!gevel || gevel.polygons.length === 0 || gevel.scaleLine.length !== 2) return;

  const afbeeldingBreedte = gevel.displaySize.width;
  const afbeeldingHoogte = gevel.displaySize.height;

  const [p1, p2] = gevel.scaleLine;
  const x1_px = p1.x;
  const y1_px = p1.y;
  const x2_px = p2.x;
  const y2_px = p2.y;

  const pixelAfstand = Math.sqrt((x2_px - x1_px) ** 2 + (y2_px - y1_px) ** 2);

  const muurLengteCanvas = distance(muur.x1, muur.y1, muur.x2, muur.y2);
  const muurLengteMeters = muurLengteCanvas / SCALE;

  const pixelPerMeter = pixelAfstand / muurLengteMeters;

  const muurDx = muur.x2 - muur.x1;
  const muurDy = muur.y2 - muur.y1;
  const muurLen = Math.sqrt(muurDx * muurDx + muurDy * muurDy);
  const muurUx = muurDx / muurLen;
  const muurUy = muurDy / muurLen;

  gevel.polygons.forEach((poly) => {
    if (poly.points.length < 2) return;
  
    const points = poly.points.map(p => ({
      x: p.x * afbeeldingBreedte,
      y: p.y * afbeeldingHoogte
    }));
  
    // Middelpunt polygon
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  
    // Middelpunt schaallijn
    const ySchaallijn = (p1.y + p2.y) / 2;
  
    // Verticale afstand tot schaallijn
    const deltaY = ySchaallijn - centerY;
    const hoogteMeters = deltaY / pixelPerMeter;
  
    // Verdieping bepalen
    const standaardVerdiepingHoogte = 3;
    const polyVerdieping = Math.floor(hoogteMeters / standaardVerdiepingHoogte);
  
    // Filter: alleen polygonen op de gekozen verdieping
    if (polyVerdieping !== verdieping) return;
  
    // Breedte in pixels en meters
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const breedtePx = maxX - minX;
    const breedteMeters = breedtePx / pixelPerMeter;
    const breedte = breedteMeters * SCALE;
    const ratioOpAfbeelding = (minX + breedtePx / 2) / afbeeldingBreedte;
    const muurIsOmgekeerd = muurUx < 0; // muur loopt van rechts naar links
    const ratioCorrected = muurIsOmgekeerd ? 1 - ratioOpAfbeelding : ratioOpAfbeelding;
    const projectieX = muur.x1 + muurUx * (ratioCorrected * muurLen);
    const projectieY = muur.y1 + muurUy * (ratioCorrected * muurLen);

  
    const x1 = projectieX - (muurUx * breedte) / 2;
    const y1 = projectieY - (muurUy * breedte) / 2;
    const x2 = projectieX + (muurUx * breedte) / 2;
    const y2 = projectieY + (muurUy * breedte) / 2;
  
    const segment = { x1, y1, x2, y2 };
  
    if (poly.name === "Window") {
      setWindows(prev => [...prev, segment]);
    } else if (poly.name === "Door") {
      setDoors(prev => [...prev, segment]);
    }
  });
  


  console.log("✅ Geprojecteerde polygonen op muur:", gevelType);
};





return (
  <div>
    <h3>🧭 Modusselectie:</h3>
    <button onClick={() => setMode("draw")} style={{ marginRight: 8 }}>➕ Teken muur</button>
    <button onClick={() => setMode("delete")} style={{ marginRight: 8 }}>🗑️ Verwijder muur</button>
    <button onClick={() => setMode("select")} style={{ marginRight: 8 }}>🏠 Selecteer kamer</button>
    <button onClick={() => setMode("addWindow")} style={{ marginRight: 8 }}>🪟 Voeg ruit toe</button>
    <button onClick={() => setMode("deleteWindow")} style={{ marginRight: 8 }}>❌ Verwijder ruit</button>
    <button onClick={() => setMode("addDoor")} style={{ marginRight: 8 }}>🚪 Voeg deur toe</button>
    <button onClick={() => setMode("deleteDoor")} style={{ marginRight: 8 }}>❌ Verwijder deur</button>
    <h3>🧱 Wijs gevel toe:</h3>
    {["Voorgevel", "Achtergevel", "Zijgevel Links", "Zijgevel Rechts"].map(type => (
    <button
    key={type}
    onClick={() => handleGevelToewijzing(type)}
    style={{ marginRight: 8 }}
    >
    {type}
    </button>
    ))}
  <div style={{ marginBottom: 10 }}>
    <label>🏢 Kies verdieping: </label>
    <select value={verdieping} onChange={(e) => setVerdieping(parseInt(e.target.value))}>
      {[0, 1, 2, 3, 4].map((v) => (
        <option key={v} value={v}>Verdieping {v}</option>
      ))}
    </select>
  </div>

    <Stage
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      scaleX={stageScale}
      scaleY={stageScale}
      x={stagePosition.x}
      y={stagePosition.y}
      draggable
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onWheel={(e) => {
        e.evt.preventDefault();
        const scaleBy = 1.05;
        const stage = e.target.getStage();
        const oldScale = stageScale;
        const pointer = stage.getPointerPosition();
        const mousePointTo = {
          x: (pointer.x - stagePosition.x) / oldScale,
          y: (pointer.y - stagePosition.y) / oldScale
        };
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        setStageScale(newScale);
        setStagePosition({
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale
        });
      }}
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

        {rooms.map((room, i) => (
          <React.Fragment key={i}>
            {room.map((cell, j) => (
              <Rect
                key={j}
                x={cell.x - GRID_SIZE / 2 - 1}
                y={cell.y - GRID_SIZE / 2 - 1}
                width={GRID_SIZE + 2}
                height={GRID_SIZE + 2}
                fill="#aad7ff"
              />
            ))}
            <Text
              text={`Ruimte ${i + 1}`}
              x={room[0].x - 25}
              y={room[0].y - 10}
              fontSize={14}
              fill="#0077ff"
            />
          </React.Fragment>
        ))}

        {walls.map((wall, index) => {
          const dx = wall.x2 - wall.x1;
          const dy = wall.y2 - wall.y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / len;
          const uy = dy / len;
          const x1 = wall.x1 - ux * WALL_OVERSHOOT;
          const y1 = wall.y1 - uy * WALL_OVERSHOOT;
          const x2 = wall.x2 + ux * WALL_OVERSHOOT;
          const y2 = wall.y2 + uy * WALL_OVERSHOOT;
          const midX = (wall.x1 + wall.x2) / 2;
          const midY = (wall.y1 + wall.y2) / 2;
          return (
            <Group key={`wall-${index}`}>
              <Line
                points={[x1, y1, x2, y2]}
                stroke={selectedWallIndex === index ? "#0077ff" : "black"}
                strokeWidth={WALL_THICKNESS}
                onClick={() => setSelectedWallIndex(index)}
              />

              <Text
                text={`${wall.length} m`}
                x={midX + 5}
                y={midY + 5}
                fontSize={12}
                fill="#555"
              />
            </Group>
          );
        })}

        {drawingWall && mousePos && (
          <Line
            points={[drawingWall.x1, drawingWall.y1, drawingWall.x2, drawingWall.y2]}
            stroke="#aaa"
            strokeWidth={2}
            dash={[4, 4]}
          />
        )}

        {windows.map((win, i) => (
          <React.Fragment key={`win-${i}`}>
            <Line
              points={[win.x1, win.y1, win.x2, win.y2]}
              stroke="blue"
              strokeWidth={WALL_THICKNESS}
            />
            <Text
              x={(win.x1 + win.x2) / 2 + 5}
              y={(win.y1 + win.y2) / 2 + 5}
              fontSize={10}
              text={`W${i}`}
              fill="blue"
            />
          </React.Fragment>
        ))}


        {doors.map((door, i) => (
          <React.Fragment key={`door-${i}`}>
            <Line
              points={[door.x1, door.y1, door.x2, door.y2]}
              stroke="brown"
              strokeWidth={WALL_THICKNESS}
            />
            <Text
              x={(door.x1 + door.x2) / 2 + 5}
              y={(door.y1 + door.y2) / 2 + 5}
              fontSize={10}
              text={`D${i}`}
              fill="brown"
            />
          </React.Fragment>
        ))}

      </Layer>
    </Stage>
  </div>
);
}
