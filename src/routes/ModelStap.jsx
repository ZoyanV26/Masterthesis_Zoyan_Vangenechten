// routes/ModelStap.jsx
import React from "react";
import Gebouw3DViewer from "../components/Gebouw3DViewer";

export default function ModelStap({ verdiepingGegevens, hoogtePerVerdieping }) {
  return (
    <div style={{ marginTop: "40px" }}>
      <h2>🏠 Volumemodel Preview</h2>
      <Gebouw3DViewer
        verdiepingGegevens={verdiepingGegevens}
        hoogtePerVerdieping={hoogtePerVerdieping}
      />
    </div>
  );
}
