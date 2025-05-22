import React from "react";
import MapComponent from "../components/KaartComponent";
import BuildingModel from "../components/3DComponentBasis";
import DakModelViewer from "../components/DakComponent";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useNavigate } from "react-router-dom";

export default function KaartStap({ woningData, dakVlakken }) {
  const navigate = useNavigate();
  const geojson = woningData?.[0]?.geometry;
  const hnMax = woningData?.[0]?.HN_MAX;

  if (!geojson) return <div style={{ padding: "40px" }}>❗Geen woningdata beschikbaar.</div>;

  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "40px 24px",
      fontFamily: "Arial, sans-serif"
    }}>
      <section style={{ marginBottom: "30px" }}>
        <h2 style={{
          fontSize: "26px",
          fontWeight: "600",
          marginBottom: "12px",
          color: "#333"
        }}>
          Controle van woningvolume en dak
        </h2>
        <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#555" }}>
          In deze stap wordt het gebouw visueel weergegeven op de kaart en als 3D-volume.  
          Controleer of de weergegeven footprint en dakanalyse overeenkomen met de werkelijkheid.
          Indien dit correct is, kan je doorgaan naar de gevelanalyse.
        </p>
      </section>
      <div style={{ marginBottom: "30px" }}>
        <MapComponent geojson={geojson} />
      </div>

      <div className="model-row" style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: "20px",
        marginTop: "20px",
        width: "100%",
        flexWrap: "wrap"
      }}>
        <div className="model-half" style={{
          width: "100%",
          maxWidth: "550px",
          padding: "10px",
          boxSizing: "border-box",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <h3 style={{
            fontSize: "18px",
            marginBottom: "10px",
            color: "#222",
            textAlign: "center"
          }}>Woningvolume</h3>
          <div style={{ width: "100%", height: "400px" }}>
            <Canvas style={{ width: "100%", height: "100%" }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[2, 2, 2]} />
              <OrbitControls />
              <BuildingModel geojson={geojson} hnMax={hnMax} />
            </Canvas>
          </div>
        </div>

        <div className="model-half" style={{
          width: "100%",
          maxWidth: "550px",
          padding: "10px",
          boxSizing: "border-box",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <h3 style={{
            fontSize: "18px",
            marginBottom: "10px",
            color: "#222",
            textAlign: "center"
          }}>Dakanalyse</h3>
          <div style={{ width: "100%", height: "400px" }}>
            {dakVlakken?.length > 0 && (
              <DakModelViewer dakVlakken={dakVlakken} />
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <button
          onClick={() => navigate("/gevels")}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: "#155724",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Volgende stap: Gevelanalyse →
        </button>
      </div>
    </div>
  );
}
