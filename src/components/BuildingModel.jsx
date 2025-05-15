import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import proj4 from "proj4";

const BuildingModel = ({ geojson, hnMax }) => {
  const meshRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    if (hnMax) {
      camera.position.set(0, -hnMax * 3, hnMax * 2);
      camera.lookAt(0, 0, 0);
    }
  }, [camera, hnMax]); 

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.005;
    }
  });

  if (!geojson || !geojson.coordinates) {
    return null;
  }

  const coordinates = geojson.coordinates[0];

  if (!coordinates || coordinates.length < 3) {
    return null;
  }

  proj4.defs([
    ["EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs"],
    [
      "EPSG:31370",
      "+proj=lcc +lat_1=49.8333339 +lat_2=51.1666672333333 +lat_0=90 +lon_0=4.36748666666667 +x_0=150000.01256 +y_0=5400088.4378 +datum=WGS84 +units=m +no_defs",
    ],
  ]);

  const convertedCoords = coordinates.map(([lon, lat]) =>
    proj4("EPSG:4326", "EPSG:31370", [lon, lat])
  );

  const minX = Math.min(...convertedCoords.map(([x]) => x));
  const minY = Math.min(...convertedCoords.map(([, y]) => y));
  const centerX = (minX + Math.max(...convertedCoords.map(([x]) => x))) / 2;
  const centerY = (minY + Math.max(...convertedCoords.map(([, y]) => y))) / 2;

  const centeredCoords = convertedCoords.map(([x, y]) => [
    x - centerX,
    y - centerY,
  ]);

  const shape = new THREE.Shape();
  centeredCoords.forEach(([x, y], index) => {
    if (index === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  });

  const buildingHeight = hnMax || 10;

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <extrudeGeometry args={[shape, { depth: buildingHeight, bevelEnabled: false }]} />
      <meshStandardMaterial color="lightblue" />
    </mesh>
  );
};

export default BuildingModel;
