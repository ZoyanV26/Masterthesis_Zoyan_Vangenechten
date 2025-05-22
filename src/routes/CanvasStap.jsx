import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Tryout from "../components/TekenComponent";

export default function CanvasStap({ gevelExportData, polygonFromSearch, onExport3D }) {
  const navigate = useNavigate();
  const [isExportGereed, setIsExportGereed] = useState(false);

  const handleExport = (data) => {
    onExport3D(data);
    setIsExportGereed(true);
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: "600", color: "#333" }}>
          Openingen visualiseren op het grondplan
        </h2>
        <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#555" }}>
          In deze stap teken je het grondplan van de woning. Gebruik de beschikbare tools om muren, kamers, ramen en deuren toe te voegen of te verwijderen.
          Indien je eerder gevelbeelden hebt geanalyseerd, kan je automatisch herkende ramen en deuren importeren. Je kan ook muren aan geveltypes koppelen en tussen verschillende verdiepingen schakelen.
        </p>
        <ul style={{ marginTop: "10px", marginLeft: "20px", color: "#555", fontSize: "16px" }}>
          <li>Muren tekenen of verwijderen</li>
          <li>Gesloten kamers selecteren</li>
          <li>Ramen en deuren toevoegen of verwijderen (ook via gevelanalyse)</li>
          <li>Muren toewijzen aan geveltypes (voor-, achter- of zijgevel)</li>
          <li>Individueel tekenen en beheren per verdieping</li>
        </ul>
        <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#555", marginTop: "10px" }}>
          Wanneer je klaar bent, klik je onderaan op <em>"Volgende stap: 3D Model"</em> om het 3D-model te genereren op basis van je plan.
        </p>
      </section>

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          marginBottom: "40px",
        }}
      >
        <Tryout
          gevelExportData={gevelExportData}
          polygonFromSearch={polygonFromSearch}
          onExport3D={handleExport}
        />
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={() => navigate("/model")}
          disabled={!isExportGereed}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: isExportGereed ? "#155724" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: isExportGereed ? "pointer" : "not-allowed",
          }}
        >
          Volgende stap: 3D Model →
        </button>
      </div>
    </div>
  );
}
