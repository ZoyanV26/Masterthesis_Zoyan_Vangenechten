import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ZoekStap from "./routes/ZoekStap";
import KaartStap from "./routes/KaartStap";
import GevelStap from "./routes/GevelStap";
import CanvasStap from "./routes/CanvasStap";
import ModelStap from "./routes/ModelStap";
import ugentLogo from "./assets/UGent_logo.png";
import "./App.css";

function App() {
  const [woningData, setWoningData] = useState(null);
  const [dakVlakken, setDakVlakken] = useState([]);
  const [gevelData, setGevelData] = useState([]);
  const [verdiepingGegevens, setVerdiepingGegevens] = useState({});
  const [hoogtePerVerdieping, setHoogtePerVerdieping] = useState({ "0": 0 });

  const handleSearch = async (formData) => {
    const url = `http://127.0.0.1:8000/zoek_woning?postcode=${formData.postcode}&gemeente=${formData.gemeente}&straat=${formData.straat}&huisnummer=${formData.huisnummer}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setWoningData(data);
    } catch (error) {
      console.error("Fout bij woningzoekopdracht:", error);
    }
  };

  useEffect(() => {
    const polygon = woningData?.[0]?.geometry?.coordinates?.[0];
    if (!polygon) return;

    fetch("http://localhost:8001/api/dakmodel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ polygon })
    })
      .then((res) => res.json())
      .then((data) => setDakVlakken(data))
      .catch((err) => console.error("❌ Fout bij ophalen dakmodel:", err));
  }, [woningData]);

  const geojson = useMemo(() => woningData?.[0]?.geometry, [woningData]);

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <img src={ugentLogo} alt="UGent Logo" className="ugent-logo" />
          <h1 className="app-title">3D Woningmodellering op Basis van GIS-Data</h1>
        </header>

        <Routes>
          <Route path="/" element={<Navigate to="/zoek" />} />
          <Route path="/zoek" element={<ZoekStap onSearch={handleSearch} />} />
          <Route path="/kaart" element={<KaartStap woningData={woningData} dakVlakken={dakVlakken} />} />
          <Route path="/gevels" element={<GevelStap onExportGevels={setGevelData} />} />
          <Route
            path="/canvas"
            element={
              <CanvasStap
                gevelExportData={gevelData}
                polygonFromSearch={woningData?.[0]?.geometry?.coordinates}
                onExport3D={setVerdiepingGegevens}
              />
            }
          />
          <Route
            path="/model"
            element={
              <ModelStap
                verdiepingGegevens={verdiepingGegevens}
                hoogtePerVerdieping={hoogtePerVerdieping}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
