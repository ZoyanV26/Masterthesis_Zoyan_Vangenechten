import React from "react";
import Gebouw3DViewer from "../components/3DComponentEind";

export default function ModelStap({ verdiepingGegevens, hoogtePerVerdieping }) {
  return (
    <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ fontSize: "28px", marginBottom: "10px", color: "#1a3e2e" }}>
        Volumemodel Preview
      </h2>
      <p style={{ fontSize: "16px", marginBottom: "25px", lineHeight: 1.6 }}>
        Deze stap geeft een visuele voorstelling van het 3D-volumemodel van de woning, opgebouwd op basis van
        de ingevoerde geodata en geanalyseerde gevelinformatie. Je kan hier door de verdiepingen bladeren, het model
        roteren en eventueel het bestand exporteren voor gebruik in energiesimulaties.
      </p>

      <Gebouw3DViewer
        verdiepingGegevens={verdiepingGegevens}
        hoogtePerVerdieping={hoogtePerVerdieping}
      />
    </div>
  );
}
