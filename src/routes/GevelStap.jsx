
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MultiGevelAnalyzer from "../components/FacadeAnalyzer";

export default function GevelStap({ onExportGevels }) {
  const navigate = useNavigate();
  const [gevelsZijnGexporteerd, setGevelsZijnGexporteerd] = useState(false);

  const handleExport = (data) => {
    onExportGevels(data);
    setGevelsZijnGexporteerd(true);
  };

  return (
    <div className="facade-analyzer-container" style={{ marginTop: "40px" }}>
      <h2>🔎 Herken Openingen in een Gevelafbeelding</h2>
      <MultiGevelAnalyzer onExport={handleExport} />

      <div style={{ marginTop: "30px", textAlign: "center" }}>
        <button
          onClick={() => navigate("/canvas")}
          disabled={!gevelsZijnGexporteerd}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: gevelsZijnGexporteerd ? "#155724" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: gevelsZijnGexporteerd ? "pointer" : "not-allowed"
          }}
        >
          Volgende stap: Grondplan tekenen →
        </button>
      </div>
    </div>
  );
}
