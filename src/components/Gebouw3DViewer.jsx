import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";


const SCALE = 0.02; // meter per "canvas unit"
const MUUR_HOOGTE = 3;      // echte meterhoogte
const MUUR_DIAMETER = 0.2;  // echte meterbreedte


function Wall({ x1, y1, x2, y2, zOffset }) {
  // schaal toepassen
  const sx1 = x1 * SCALE;
  const sy1 = y1 * SCALE;
  const sx2 = x2 * SCALE;
  const sy2 = y2 * SCALE;

  const dx = sx2 - sx1;
  const dy = sy2 - sy1;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Altijd dezelfde richting van normaal vector garanderen
  const nx = dy / length;
  const ny = -dx / length;

  // Als de wand naar binnen wijst (bv. bij negatieve dx), draai dan om
  const flip = dx * ny - dy * nx < 0 ? -1 : 1;

  const finalNx = nx * flip;
  const finalNy = ny * flip;

  const half = MUUR_DIAMETER / 2;

  // Vier punten in X-Y vlak (wordt straks Y -> Z)
  const p1 = [sx1 + finalNx * half, sy1 + finalNy * half];
  const p2 = [sx1 - finalNx * half, sy1 - finalNy * half];
  const p3 = [sx2 - finalNx * half, sy2 - finalNy * half];
  const p4 = [sx2 + finalNx * half, sy2 + finalNy * half];

  const shape = new THREE.Shape();
  shape.moveTo(p1[0], p1[1]);
  shape.lineTo(p2[0], p2[1]);
  shape.lineTo(p3[0], p3[1]);
  shape.lineTo(p4[0], p4[1]);
  shape.lineTo(p1[0], p1[1]);

  const extrudeSettings = {
    steps: 1,
    depth: MUUR_HOOGTE,
    bevelEnabled: false
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.rotateX(-Math.PI / 2);

  return (
    <mesh geometry={geometry} position={[0, zOffset - MUUR_HOOGTE, 0]}>
      <meshStandardMaterial color="lightgray" />
    </mesh>
  );
}

const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

function WindowOrDoor({ x, y, width, height, zOffset, color,rotation = 0 }) {
  const sx = x * SCALE;
  const sy = y * SCALE;
  const sWidth = width * SCALE;
  const sHeight = (height || 100) * SCALE;

  return (
    <mesh
      position={[sx, zOffset - sHeight / 2, -sy]}
      rotation={[0, rotation , 0]}
      

    >
      <boxGeometry args={[sWidth, sHeight, MUUR_DIAMETER * 1.2]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function FloorPlateFromShape({ shape, zOffset }) {
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  return (
    <mesh position={[0, zOffset + 0.001, 0]}>

      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color="#e0e0e0" side={THREE.DoubleSide} />

    </mesh>
  );
}


function createFloorShapeFromFootprint(walls) {
  const footprint = walls.filter(w => w.isFootprint);

  const points = footprint.map(w => [w.x1, w.y1]);

  if (points.length > 0) {
    const [firstX, firstY] = points[0];
    points.push([firstX, firstY]); // zorg dat de polygoon sluit
  }

  const scaledPoints = points.map(([x, y]) => new THREE.Vector2(x * SCALE, y * SCALE));
  const shape = new THREE.Shape(scaledPoints);
  return shape;
}


export default function Gebouw3DViewer({ verdiepingGegevens, hoogtePerVerdieping }) {
  console.log("🧱 VerdiepingGegevens ontvangen:", verdiepingGegevens);
  const [actieveVerdieping, setActieveVerdieping] = React.useState("0");

  // Verzamel alle coördinaten
  const allCoords = [];

  Object.values(verdiepingGegevens).forEach((data) => {
    data.walls?.forEach(({ x1, y1, x2, y2 }) => {
      allCoords.push([x1, y1], [x2, y2]);
    });
  });

  if (allCoords.length === 0) {
    return <div style={{ height: "600px" }}>❗Geen coördinaten beschikbaar voor weergave.</div>;
  }

  const xs = allCoords.map(([x]) => x);
  const ys = allCoords.map(([, y]) => y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const center = [(minX + maxX) / 2 * SCALE, (minY + maxY) / 2 * SCALE];
  const maxDim = Math.max(maxX - minX, maxY - minY) * SCALE;
  console.log("maxDim =", maxDim);


  // Camera op logische afstand
  const cameraPos = [center[0], maxDim*1.5, -center[1] - maxDim*1.5];


  return (
    <div
      style={{
        width: "1200px",
        height: "900px",
        border: "2px solid #ccc",
        borderRadius: "12px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        overflow: "hidden",
        background: "#fff"
      }}
    >
      <div style={{ display: "flex", gap: "8px", padding: "8px" }}>
        {Object.keys(verdiepingGegevens).map((verdieping) => (
          <button
            key={verdieping}
            onClick={() => setActieveVerdieping(verdieping)}
            style={{
              padding: "6px 12px",
              backgroundColor: verdieping === actieveVerdieping ? "#444" : "#ddd",
              color: verdieping === actieveVerdieping ? "#fff" : "#000",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Verdieping {verdieping}
          </button>
        ))}
      </div>

      <Canvas camera={{ position: cameraPos, fov: 40, near: 0.1, far: 100000 }}>

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} />
        <OrbitControls target={[center[0], MUUR_HOOGTE / 2, -center[1]]} />


        {/* Global helpers */}
        <primitive object={new THREE.AxesHelper(maxDim)} />


        {/* Gebouwgeometrie */}
        <group rotation={[Math.PI,0, 0]}>
          {Object.entries(verdiepingGegevens)
            .filter(([verdieping]) => verdieping === actieveVerdieping)
            .map(([verdieping, data]) => {
              const zOffset = hoogtePerVerdieping[verdieping] || 0;

              const footprintShape = createFloorShapeFromFootprint(data.walls || []);

              return (
                <group
                  key={verdieping}
                  rotation={[0, Math.PI, 0]} // behoud spiegeling per verdieping
                  position={[0, 0, 0]}
                >
                  {footprintShape && (
                    <FloorPlateFromShape shape={footprintShape} zOffset={zOffset} />
                  )}

                  {data.walls?.map((wall, i) => (
                    <Wall key={i} {...wall} zOffset={zOffset} />
                  ))}

                  {data.windows?.map((win, i) => {
                    const dx = win.x2 - win.x1;
                    const dy = win.y2 - win.y1;
                    const angle = Math.atan2(dy, dx);

                    const x = (win.x1 + win.x2) / 2;
                    const y = (win.y1 + win.y2) / 2;
                    const width = distance(win.x1, win.y1, win.x2, win.y2);
                    const height = win.hoogte || 100;
                    const hoogte = (win.hoogte || 0);
                    const afstandTotSchaallijn = (win.afstandTotSchaallijn || 0);
                    const geplaatsteHoogte = (afstandTotSchaallijn - hoogte / 2) * SCALE;
                    const ramenZOffset = -geplaatsteHoogte;

                    return (
                      <WindowOrDoor
                        key={`w-${i}`}
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        zOffset={ramenZOffset}
                        color="skyblue"
                        rotation={angle}
                      />
                    );
                  })}

                  {data.doors?.map((door, i) => {
                    const x = (door.x1 + door.x2) / 2;
                    const y = (door.y1 + door.y2) / 2;
                    const width = distance(door.x1, door.y1, door.x2, door.y2);
                    const height = door.hoogte || 100;
                    const hoogte = (door.hoogte || 0);
                    const afstandTotSchaallijn = (door.afstandTotSchaallijn || 0);
                    const geplaatsteHoogte = (afstandTotSchaallijn - hoogte / 2) * SCALE;
                    const deurZOffset = -geplaatsteHoogte;

                    return (
                      <WindowOrDoor
                        key={`d-${i}`}
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        zOffset={deurZOffset}
                        color="saddlebrown"
                      />
                    );
                  })}
                </group>
              );
            })}
        </group>
      </Canvas>
    </div>
  );
}
