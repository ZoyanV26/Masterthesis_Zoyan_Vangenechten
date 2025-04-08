import React, { useState } from "react";
import { Stage, Layer, Line, Rect } from "react-konva";

const GRID_SIZE = 20;
const WALL_THICKNESS = 10;

export default function Tryout() {
  const [walls, setWalls] = useState([]);
  const [drawingWall, setDrawingWall] = useState(null);

  const snap = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  const handleClick = (e) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const x = snap(pointer.x);
    const y = snap(pointer.y);

    if (!drawingWall) {
      setDrawingWall({ x1: x, y1: y, x2: x, y2: y });
    } else {
      const newWall = { x1: drawingWall.x1, y1: drawingWall.y1, x2: x, y2: y };
      setWalls([...walls, newWall]);
      setDrawingWall(null);
    }
  };

  const renderWall = (wall, index) => {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return (
      <Rect
        key={index}
        x={wall.x1}
        y={wall.y1 - WALL_THICKNESS / 2}
        width={length}
        height={WALL_THICKNESS}
        rotation={angle}
        fill="black"
      />
    );
  };

  return (
    <div>
      <h3 className="text-md font-semibold mb-1">✏️ Teken binnenmuren (klik 2 punten)</h3>
      <Stage
        width={800}
        height={600}
        onClick={handleClick}
        style={{ border: "1px solid #ccc", background: "#f9f9f9" }}
      >
        <Layer>
          {/* Raster */}
          {[...Array(800 / GRID_SIZE)].map((_, i) => (
            <Line
              key={`v${i}`}
              points={[i * GRID_SIZE, 0, i * GRID_SIZE, 600]}
              stroke="#eee"
            />
          ))}
          {[...Array(600 / GRID_SIZE)].map((_, i) => (
            <Line
              key={`h${i}`}
              points={[0, i * GRID_SIZE, 800, i * GRID_SIZE]}
              stroke="#eee"
            />
          ))}

          {/* Muren */}
          {walls.map((wall, index) => renderWall(wall, index))}

          {/* Actieve muur */}
          {drawingWall && (
            <Line
              points={[
                drawingWall.x1,
                drawingWall.y1,
                drawingWall.x2,
                drawingWall.y2,
              ]}
              stroke="blue"
              strokeWidth={2}
              dash={[4, 4]}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
