import React from "react";
import MultiGevelAnalyzer from "../components/GevelComponent";
import { useNavigate } from "react-router-dom";

export default function GevelStap({ onExportGevels }) {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px", fontFamily: "Arial, sans-serif" }}>
      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: "600", color: "#333" }}>Openingen detecteren in gevelbeelden</h2>
        <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#555" }}>
          In deze stap analyseer je de gevelbeelden van de woning. Upload een duidelijke gevelafbeelding (bij voorkeur zonder obstakels of aanpalende gevel). Het systeem probeert automatisch de ramen en deuren te herkennen.
          Indien sommige openingen fout of niet herkend zijn, kan je deze manueel aanduiden met behulp van de tekentools. Voor elke opening kan je bovendien het type (deur of ruit) aanpassen, en aanduiden welke ruimte zich achter de opening bevindt.
          Daarna teken je een schaallijn, idealiter van de linkeronderhoek tot de rechteronderhoek van de gevel, zodat de afmetingen correct geschaald worden.
          Wanneer alle openingen gecontroleerd en aangeduid zijn, klik je op "Ik ben klaar met het herkennen van de openingen" om door te gaan naar de volgende stap: het grondplan.
        </p>
      </section>

      {/* Gevelanalysetool */}
      <div style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "10px",
        border: "1px solid #ccc",
        marginBottom: "40px"
      }}>
        <MultiGevelAnalyzer onExport={onExportGevels} />
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={() => navigate("/canvas")}
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
          Volgende stap: Grondplan tekenen →
        </button>
      </div>
    </div>
  );
}
