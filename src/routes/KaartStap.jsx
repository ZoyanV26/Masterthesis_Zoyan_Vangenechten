// routes/KaartStap.jsx
import React from "react";
import MapComponent from "../components/MapComponent";
import BuildingModel from "../components/BuildingModel";
import DakModelViewer from "../components/DakModelViewer";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useNavigate } from "react-router-dom";

export default function KaartStap({ woningData, dakVlakken }) {
  const navigate = useNavigate();
  const geojson = woningData?.[0]?.geometry;
  const hnMax = woningData?.[0]?.HN_MAX;

  if (!geojson) return <div>❗Geen woningdata beschikbaar.</div>;

  return (
    <div className="results-container">
      <MapComponent geojson={geojson} />

      <div className="model-row">
        <div className="model-half">
          <h3>Woningvolume</h3>
          <Canvas style={{ width: "100%", height: "500px" }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 2, 2]} />
            <OrbitControls />
            <BuildingModel geojson={geojson} hnMax={hnMax} />
          </Canvas>
        </div>

        <div className="model-half">
          <h3>⛰️ Dakanalyse</h3>
          {dakVlakken?.length > 0 && <DakModelViewer dakVlakken={dakVlakken} />}
        </div>
      </div>

      <div style={{ marginTop: "30px", textAlign: "center" }}>
        <button
          onClick={() => navigate("/gevels")}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#155724",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Volgende stap: Gevelanalyse →
        </button>
      </div>
    </div>
  );
}
