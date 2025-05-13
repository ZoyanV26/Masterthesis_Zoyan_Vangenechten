import React, { useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Subcomponent die het model tekent en camera correct positioneert
const DakModelScene = ({ dakVlakken }) => {
  const groupRef = useRef();
  const controlsRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    if (!groupRef.current) return;

    // Bereken bounding box rond alle meshes
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Bereken afstand tot camera op basis van grootte
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2);

    // Stel camera positie in (iets verder voor marge)
    camera.position.set(center.x, center.y, center.z + distance * 1.2);
    camera.lookAt(center);

    // Update OrbitControls target
    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  }, [dakVlakken, camera]);

  if (!dakVlakken || dakVlakken.length === 0) return null;

  // Bereken zwaartepunt voor centrering
  const allPoints = dakVlakken.flatMap(v => v.vertices);
  const modelCenter = allPoints.reduce(
    (acc, [x, y, z]) => {
      acc.x += x;
      acc.y += y;
      acc.z += z;
      return acc;
    },
    { x: 0, y: 0, z: 0 }
  );
  modelCenter.x /= allPoints.length;
  modelCenter.y /= allPoints.length;
  modelCenter.z /= allPoints.length;

  return (
    <>
      <group ref={groupRef}>
        {dakVlakken.map((vlak, i) => {
          const gecentreerdeVertices = vlak.vertices.map(([x, y, z]) => [
            x - modelCenter.x,
            y - modelCenter.y,
            z - modelCenter.z
          ]);
          const vertices = new Float32Array(gecentreerdeVertices.flat());
          const indices = new Uint16Array([0, 1, 2, 0, 2, 3]); // quad naar 2 driehoeken

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
          geometry.setIndex(new THREE.BufferAttribute(indices, 1));
          geometry.computeVertexNormals();

          return (
            <mesh key={i} geometry={geometry}>
              <meshStandardMaterial color="#ADD8E6" side={THREE.DoubleSide} />

            </mesh>
          );
        })}
      </group>
      <OrbitControls ref={controlsRef} />
    </>
  );
};

const DakModelViewer = ({ dakVlakken }) => {
  return (
    <div style={{ width: "100%", height: "500px", marginTop: "20px" }}>
      <Canvas camera={{ position: [0, 0, 200], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 5]} />
        <DakModelScene dakVlakken={dakVlakken} />
      </Canvas>
    </div>
  );
};

export default DakModelViewer;
