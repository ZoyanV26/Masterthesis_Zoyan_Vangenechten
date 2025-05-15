// routes/CanvasStap.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Tryout from "../components/Tryout";

export default function CanvasStap({ gevelExportData, polygonFromSearch, onExport3D }) {
  const navigate = useNavigate();
  const [isExportGereed, setIsExportGereed] = useState(false);

  const handleExport = (data) => {
    onExport3D(data);
    setIsExportGereed(true);
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>🪟 Openingen Visualiseren op het Grondplan</h2>
      <Tryout
        gevelExportData={gevelExportData}
        polygonFromSearch={polygonFromSearch}
        onExport3D={handleExport}
      />

      <div style={{ marginTop: "30px", textAlign: "center" }}>
        <button
          onClick={() => navigate("/model")}
          disabled={!isExportGereed}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: isExportGereed ? "#155724" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isExportGereed ? "pointer" : "not-allowed"
          }}
        >
          Volgende stap: 3D Model →
        </button>
      </div>
    </div>
  );
}
