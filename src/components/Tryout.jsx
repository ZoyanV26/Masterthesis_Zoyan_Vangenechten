import React, { useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Text, Group } from "react-konva";
import proj4 from "proj4";

const GRID_SIZE = 10;
const SCALE = 50;
const WALL_THICKNESS = 10;
const WALL_OVERSHOOT = 5;
const CANVAS_WIDTH = 1156;
const CANVAS_HEIGHT = 600;
const offsetX = 0;
const offsetY = 0;
const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

function verwijderDubbeleMuren(muren) {
  const uniek = [];
  const gezien = new Set();

  for (const m of muren) {
    const key1 = `${m.x1},${m.y1},${m.x2},${m.y2}`;
    const key2 = `${m.x2},${m.y2},${m.x1},${m.y1}`;
    if (!gezien.has(key1) && !gezien.has(key2)) {
      uniek.push(m);
      gezien.add(key1);
      gezien.add(key2);
    }
  }

  return uniek;
}

export default function Tryout({ gevelExportData, polygonFromSearch, onExport3D }) {
  const [selectedWallIndex, setSelectedWallIndex] = useState(null);
  const [drawingWall, setDrawingWall] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [hoveredWallIndex, setHoveredWallIndex] = useState(null);
  const [mode, setMode] = useState("none");
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
  const [verdieping, setVerdieping] = useState(0); // 0 = gelijkvloers
  const [verdiepingGegevens, setVerdiepingGegevens] = useState({});
  const getVerdiepData = (v) => {
    const data = verdiepingGegevens[v] || {};
    const isVerdieping0 = v === 0;
    const footprintWalls = verdiepingGegevens[0]?.walls?.filter(w => w.isFootprint) || [];
    return {
      walls: isVerdieping0 ? (data.walls || []) : [...footprintWalls, ...(data.walls || [])],
      rooms: data.rooms || [],
      windows: data.windows || [],
      doors: data.doors || []
    };
  };


  const getFootprintWalls = () =>
    (verdiepingGegevens[0]?.walls || []).filter(w => w.isFootprint);
  
  const getInteriorWalls = () => {
    const alleMuren = getVerdiepData(verdieping).walls || [];
    const footprintMuren = getFootprintWalls();
    
    return alleMuren.filter(
      muur => !footprintMuren.some(fp =>
        fp.x1 === muur.x1 &&
        fp.y1 === muur.y1 &&
        fp.x2 === muur.x2 &&
        fp.y2 === muur.y2
      )
    );
  };
  
  const gevelKoppelingen = {
    "Voorgevel": 0,
    "Achtergevel": 1,
    "Zijgevel Links": 2,
    "Zijgevel Rechts": 3,
  };

  useEffect(() => {
  }, [gevelExportData]);

  useEffect(() => {
    if (!polygonFromSearch || !Array.isArray(polygonFromSearch[0]) || polygonFromSearch[0].length < 2) return;

    const coordinates = polygonFromSearch[0];

    proj4.defs([
      ["EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs"],
      [
        "EPSG:31370",
        "+proj=lcc +lat_1=49.8333339 +lat_2=51.1666672333333 +lat_0=90 +lon_0=4.36748666666667 +x_0=150000.01256 +y_0=5400088.4378 +datum=WGS84 +units=m +no_defs"
      ]
    ]);

    const converted = coordinates.map(([lon, lat]) =>
      proj4("EPSG:4326", "EPSG:31370", [lon, lat])
    );

    const minX = Math.min(...converted.map(([x]) => x));
    const minY = Math.min(...converted.map(([, y]) => y));
    const maxX = Math.max(...converted.map(([x]) => x));
    const maxY = Math.max(...converted.map(([, y]) => y));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centered = converted.map(([x, y]) => [x - centerX, y - centerY]);

    let maxLength = 0;
    let bestAngle = 0;
    for (let i = 0; i < centered.length - 1; i++) {
      const [x1, y1] = centered[i];
      const [x2, y2] = centered[i + 1];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > maxLength) {
        maxLength = length;
        bestAngle = -Math.atan2(dy, dx); 
      }
    }

    const rotated = centered.map(([x, y]) => {
      const newX = x * Math.cos(bestAngle) - y * Math.sin(bestAngle);
      const newY = x * Math.sin(bestAngle) + y * Math.cos(bestAngle);
      return [newX, newY];
    });

    const mirrored = rotated.map(([x, y]) => [-x, y]);

    const newWalls = [];
    for (let i = 0; i < mirrored.length - 1; i++) {
      const [x1m, y1m] = mirrored[i];
      const [x2m, y2m] = mirrored[i + 1];
      newWalls.push({
        x1: x1m * SCALE,
        y1: y1m * SCALE,
        x2: x2m * SCALE,
        y2: y2m * SCALE,
        length: distance(x1m, y1m, x2m, y2m).toFixed(2),
        isFootprint: true
      });
    }

    setVerdiepingGegevens(prev => ({
      ...prev,
      0: {
        ...getVerdiepData(0),
        walls: newWalls
      }
    }));
  }, [polygonFromSearch]);

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
    const huidige = getVerdiepData(verdieping);
    const toDelete = huidige.walls.findIndex(
      (wall) => pointToSegment(x, y, wall.x1, wall.y1, wall.x2, wall.y2) < WALL_THICKNESS / 2
    );
    if (toDelete !== -1) {
      const updated = [...huidige.walls];
      updated.splice(toDelete, 1);
      setVerdiepingGegevens(prev => ({
        ...prev,
        [verdieping]: {
          ...huidige,
          walls: updated
        }
      }));
    }
    return;
  }
  
  if (mode === "deleteWindow") {
    const huidige = getVerdiepData(verdieping);
    const toDelete = huidige.windows.findIndex(

      (w) => pointToSegment(x, y, w.x1, w.y1, w.x2, w.y2) < WALL_THICKNESS / 2
    );
    if (toDelete !== -1) {
      const huidige = getVerdiepData(verdieping);
      const updated = [...huidige.windows];
      updated.splice(toDelete, 1);
      setVerdiepingGegevens(prev => ({
        ...prev,
        [verdieping]: {
          ...huidige,
          windows: updated
        }
      }));

    }
    return;
  }
  if (mode === "deleteDoor") {
    const huidige = getVerdiepData(verdieping);
    const toDelete = huidige.doors.findIndex(
      (d) => pointToSegment(x, y, d.x1, d.y1, d.x2, d.y2) < WALL_THICKNESS / 2
    );

    if (toDelete !== -1) {
      const huidige = getVerdiepData(verdieping);
      const updated = [...huidige.doors];
      updated.splice(toDelete, 1);
      setVerdiepingGegevens(prev => ({
        ...prev,
        [verdieping]: {
          ...huidige,
          doors: updated
        }
      }));

    }
    return;
  }
  if (mode === "addWindow" || mode === "addDoor") {
    let closest = null;
    let minDist = Infinity;
    let clickedProjection = null;

    for (const wall of getVerdiepData(verdieping).walls)      {
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
      const huidige = getVerdiepData(verdieping);
      if (mode === "addWindow") {
        setVerdiepingGegevens(prev => ({
          ...prev,
          [verdieping]: {
            ...huidige,
            windows: [...huidige.windows, newElem]
          }
        }));
      } else if (mode === "addDoor") {
        setVerdiepingGegevens(prev => ({
          ...prev,
          [verdieping]: {
            ...huidige,
            doors: [...huidige.doors, newElem]
          }
        }));
      }

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
      const bestaande = getVerdiepData(verdieping).walls || [];
      const uniekeWalls = bestaande.filter(w =>
        !(w.x1 === newWall.x1 && w.y1 === newWall.y1 && w.x2 === newWall.x2 && w.y2 === newWall.y2)
      );
      const nieuweWalls = [...uniekeWalls, newWall];

      setVerdiepingGegevens(prev => ({
        ...prev,
        [verdieping]: {
          ...getVerdiepData(verdieping),
          walls: nieuweWalls
        }
      }));

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
  setVerdiepingGegevens(prev => {
    const huidige = getVerdiepData(verdieping);
    return {
      ...prev,
      [verdieping]: {
        ...huidige,
        rooms: [...huidige.rooms, filled]
      }
    };
  });
  
};

const touchesWall = (x, y) => {
  let muren = getVerdiepData(verdieping).walls;

  if (verdieping > 0) {
    const footprint = getFootprintWalls();
    muren = [...muren, ...footprint];
  }

  return muren.some((wall) =>
    pointToSegment(x, y, wall.x1, wall.y1, wall.x2, wall.y2) < WALL_THICKNESS / 2
  );
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
  const updated = [...getVerdiepData(verdieping).walls];
  updated[selectedWallIndex].gevelType = gevelType;

  const muur = updated[selectedWallIndex];
  projecteerPolygonenOpMuur(gevelType, muur);

};

const verwerkAlleGevels = () => {
  const nieuweVerdiepData = {};

  getVerdiepData(verdieping).walls.forEach((muur) => {
    const gevelType = muur.gevelType;
    if (!gevelType) return;
    const gevel = gevelExportData?.find(g => g.gevelType === gevelType);
    if (!gevel || gevel.polygons.length === 0 || gevel.scaleLine.length !== 2) return;

    const afbeeldingBreedte = gevel.displaySize.width;
    const afbeeldingHoogte = gevel.displaySize.height;
    const [p1, p2] = gevel.scaleLine;
    const pixelAfstand = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const muurLengteCanvas = distance(muur.x1, muur.y1, muur.x2, muur.y2);
    const muurLengteMeters = muurLengteCanvas / SCALE;
    const pixelPerMeter = pixelAfstand / muurLengteMeters;

    let muurDx = muur.x2 - muur.x1;
    let muurDy = muur.y2 - muur.y1;
    const muurLen = Math.sqrt(muurDx * muurDx + muurDy * muurDy);
    muurDx /= muurLen;
    muurDy /= muurLen;

    gevel.polygons.forEach((poly) => {
      const points = poly.points.map(p => ({
        x: p.x * afbeeldingBreedte,
        y: p.y * afbeeldingHoogte
      }));
      const minY = Math.min(...points.map(p => p.y));
      const maxY = Math.max(...points.map(p => p.y));
      const openingHoogteMeters = (maxY - minY) / pixelPerMeter;
      const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
      const ySchaallijn = (p1.y + p2.y) / 2;
      const hoogteMeters = (ySchaallijn - centerY) / pixelPerMeter;
      const verdiepingIndex = Math.floor(hoogteMeters / 3);
      const minX = Math.min(...points.map(p => p.x));
      const maxX = Math.max(...points.map(p => p.x));
      const breedtePx = maxX - minX;
      const breedteMeters = breedtePx / pixelPerMeter;
      const breedte = breedteMeters * SCALE;
      const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const startXAfbeelding = Math.min(p1.x, p2.x);
      const endXAfbeelding = Math.max(p1.x, p2.x);
      const ratioOpAfbeelding = (centerX - startXAfbeelding) / (endXAfbeelding - startXAfbeelding);
      const moetSpiegelen = ["Voorgevel", "Achtergevel", "Zijgevel Links", "Zijgevel Rechts"].includes(gevelType);
      const ratioCorrected = moetSpiegelen ? 1 - ratioOpAfbeelding : ratioOpAfbeelding;
      const projectieX = muur.x1 + muurDx * (ratioCorrected * muurLen);
      const projectieY = muur.y1 + muurDy * (ratioCorrected * muurLen);
      const x1 = projectieX - (muurDx * breedte) / 2;
      const y1 = projectieY - (muurDy * breedte) / 2;
      const x2 = projectieX + (muurDx * breedte) / 2;
      const y2 = projectieY + (muurDy * breedte) / 2;
      const segment = {
        x1,
        y1,
        x2,
        y2,
        ruimte: poly.ruimte,
        hoogte: openingHoogteMeters * SCALE,
        afstandTotSchaallijn: hoogteMeters * SCALE
      };

      if (!nieuweVerdiepData[verdiepingIndex]) {
        nieuweVerdiepData[verdiepingIndex] = { windows: [], doors: [] };
      }
      if (poly.name === "Window") nieuweVerdiepData[verdiepingIndex].windows.push(segment);
      else if (poly.name === "Door") nieuweVerdiepData[verdiepingIndex].doors.push(segment);
    });
  });

  setVerdiepingGegevens(prev => {
    const updated = { ...prev };

    Object.entries(nieuweVerdiepData).forEach(([verdieping, data]) => {
      const vorige = prev[verdieping] || { windows: [], doors: [], walls: [] };

      updated[verdieping] = {
        ...vorige,
        windows: [...vorige.windows, ...(data.windows || [])],
        doors: [...vorige.doors, ...(data.doors || [])],
        walls: vorige.walls, // ✅ NIET aanpassen!
      };
    });

    return updated;
  });

    
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
  
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    const ySchaallijn = (p1.y + p2.y) / 2;
    const deltaY = ySchaallijn - centerY;
    const hoogteMeters = deltaY / pixelPerMeter;
    const standaardVerdiepingHoogte = 2.6;
    const polyVerdieping = Math.floor(hoogteMeters / standaardVerdiepingHoogte);

    if (polyVerdieping !== verdieping) return;

    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const breedtePx = maxX - minX;
    const breedteMeters = breedtePx / pixelPerMeter;
    const breedte = breedteMeters * SCALE;
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const startXAfbeelding = Math.min(p1.x, p2.x);
    const endXAfbeelding = Math.max(p1.x, p2.x);
    const ratioOpAfbeelding = (centerX - startXAfbeelding) / (endXAfbeelding - startXAfbeelding);
    const startX = muur.x1;
    const endX = muur.x2;
    const startY = muur.y1;
    const endY = muur.y2;
    const muurStart = { x: startX, y: startY };
    const muurEind = { x: endX, y: endY };
    let muurUx = muurEind.x - muurStart.x;
    let muurUy = muurEind.y - muurStart.y;
    const muurLen = Math.sqrt(muurUx * muurUx + muurUy * muurUy);
    muurUx /= muurLen;
    muurUy /= muurLen;

    const moetSpiegelen = ["Voorgevel", "Achtergevel", "Zijgevel Links", "Zijgevel Rechts"].includes(gevelType);
    const ratioCorrected = moetSpiegelen ? 1 - ratioOpAfbeelding : ratioOpAfbeelding;
    const projectieX = muurStart.x + muurUx * (ratioCorrected * muurLen);
    const projectieY = muurStart.y + muurUy * (ratioCorrected * muurLen);
    const x1 = projectieX - (muurUx * breedte) / 2;
    const y1 = projectieY - (muurUy * breedte) / 2;
    const x2 = projectieX + (muurUx * breedte) / 2;
    const y2 = projectieY + (muurUy * breedte) / 2;
    const segment = {
      x1,
      y1,
      x2,
      y2,
      ruimte: poly.ruimte,
    };

    setVerdiepingGegevens(prev => {
      const huidige = prev[polyVerdieping] || { windows: [], doors: [], walls: [] };
      if (poly.name === "Window") {
        return {
          ...prev,
          [polyVerdieping]: {
            ...huidige,
            windows: [...huidige.windows, segment],
            doors: huidige.doors
          }
        };
      } else if (poly.name === "Door") {
        return {
          ...prev,
          [polyVerdieping]: {
            ...huidige,
            windows: huidige.windows,
            doors: [...huidige.doors, segment]
          }
        };
      } else {
        return prev;
      }
    });
    
  });
};





return (
  <>
    <div style={{ marginBottom: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Geveltoewijzing */}
      <h3 style={{ fontSize: "18px", marginBottom: "8px", color: "#333" }}>1. Wijs geveltype toe aan geselecteerde muur</h3>
      <div style={{ marginBottom: "20px" }}>
        {["Voorgevel", "Achtergevel", "Zijgevel Links", "Zijgevel Rechts"].map(type => (
          <button
            key={type}
            onClick={() => handleGevelToewijzing(type)}
            style={{
              padding: "8px 16px",
              marginRight: "10px",
              marginBottom: "10px",
              backgroundColor: "#004085",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Gegevens laden */}
      <h3 style={{ fontSize: "18px", marginBottom: "8px", color: "#333" }}>2. Importeren van geveldata</h3>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={verwerkAlleGevels}
          style={{
            padding: "8px 16px",
            backgroundColor: "#006400",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Importeer openingen vanuit gevelanalyse
        </button>
      </div>

      {/* Tools */}
      <h3 style={{ fontSize: "18px", marginBottom: "8px", color: "#333" }}>3. Teken- en bewerktools</h3>
      <div style={{ marginBottom: "20px" }}>
        {[
          { mode: "draw", label: "Teken muur" },
          { mode: "none", label: "Stop tekenen" },
          { mode: "delete", label: "Verwijder muur" },
          { mode: "select", label: "Selecteer kamer" },
          { mode: "addWindow", label: "Voeg ruit toe" },
          { mode: "deleteWindow", label: "Verwijder ruit" },
          { mode: "addDoor", label: "Voeg deur toe" },
          { mode: "deleteDoor", label: "Verwijder deur" },
        ].map(({ mode: m, label }) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "8px 12px",
              marginRight: "10px",
              marginBottom: "8px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Verdieping selector */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontSize: "16px", marginRight: "8px" }}>Actieve verdieping:</label>
        <select
          value={verdieping}
          onChange={(e) => setVerdieping(parseInt(e.target.value))}
          style={{ padding: "6px 12px", fontSize: "16px" }}
        >
          {Object.keys(verdiepingGegevens).map((v) => (
            <option key={v} value={v}>
              Verdieping {v}
            </option>
          ))}
        </select>
      </div>
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
        {[...Array(1001).keys()].map((i) => {
          const pos = (i - 500) * GRID_SIZE;
          return (
            <Group key={`grid-group-${i}`}>
              <Line points={[pos, -100000, pos, 100000]} stroke="#eee" strokeWidth={1} />
              <Line points={[-100000, pos, 100000, pos]} stroke="#eee" strokeWidth={1} />
            </Group>
          );
        })}

        {getVerdiepData(verdieping).rooms.map((room, i) => (
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

        {[...getFootprintWalls(), ...getInteriorWalls()].map((wall, index) => {
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
                x={midX + 20}
                y={midY -30}
                fontSize={15}
                fill="#666"
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

        {getVerdiepData(verdieping).windows.map((win, i) => (
          <React.Fragment key={`win-${i}`}>
            <Line
              points={[win.x1, win.y1, win.x2, win.y2]}
              stroke="blue"
              strokeWidth={WALL_THICKNESS}
            />
            <Text
              x={(win.x1 + win.x2) / 2-30}
              y={(win.y1 + win.y2) / 2 +30}
              fontSize={15}
              text={win.ruimte ? '  ' + win.ruimte : ''}
              fill="blue"
              align="center"

            />
          </React.Fragment>
        ))}

        {getVerdiepData(verdieping).doors.map((door, i) => (
          <React.Fragment key={`door-${i}`}>
            <Line
              points={[door.x1, door.y1, door.x2, door.y2]}
              stroke="red"
              strokeWidth={WALL_THICKNESS}
            />
            <Text
              x={(door.x1 + door.x2) / 2 -20}
              y={(door.y1 + door.y2) / 2 + 12}
              fontSize={15}
              text={door.ruimte ? '  ' + door.ruimte : ''}
              fill="red"
              allign="center"
            />
          </React.Fragment>
        ))}
      </Layer>
    </Stage>
    <div style={{ marginTop: "20px", textAlign: "center" }}>
      <button
        onClick={() => {
          const opgeschoond = {};
          for (const [v, data] of Object.entries(verdiepingGegevens)) {
            opgeschoond[v] = {
              ...data,
              walls: verwijderDubbeleMuren(data.walls || [])
            };
          }
          onExport3D(opgeschoond);
        }}

        style={{
          padding: "10px 20px",
          backgroundColor: "#8B4513",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Toon in 3D Viewer
      </button>
    </div>

  </>
);
}
