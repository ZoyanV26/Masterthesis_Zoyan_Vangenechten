import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SearchForm from "./components/SearchForm";
import MapComponent from "./components/MapComponent";
import BuildingModel from "./components/BuildingModel";
import MultiGevelAnalyzer from "./components/FacadeAnalyzer";
import Tryout from "./components/Tryout";
import DakModelViewer from "./components/DakModelViewer";
import { useMemo } from "react";
import Gebouw3DViewer from "./components/Gebouw3DViewer";
import "./App.css";
import ugentLogo from "./assets/UGent_logo.png";

function App() {
  const [woningData, setWoningData] = useState(null);
  const [dakVlakken, setDakVlakken] = useState([]);
  const [gevelData, setGevelData] = useState([]);
  const [verdiepingGegevens, setVerdiepingGegevens] = useState({});
  const [hoogtePerVerdieping, setHoogtePerVerdieping] = useState({ "0": 0 });  // eventueel aanpassen

  const handleSearch = async (formData) => {
    const url = `http://127.0.0.1:8000/zoek_woning?postcode=${formData.postcode}&gemeente=${formData.gemeente}&straat=${formData.straat}&huisnummer=${formData.huisnummer}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setWoningData(data);
    } catch (error) {
      console.error("Fout bij API-aanroep:", error);
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
      .then((data) => {
        console.log("✅ Dakvlakjes ontvangen:", data);
        setDakVlakken(data);
      })
      .catch((err) => console.error("❌ Fout bij ophalen dakmodel:", err));
  }, [woningData]);

  const geojson = useMemo(() => woningData?.[0]?.geometry, [woningData]);
  const hnMax = woningData?.[0]?.HN_MAX;

  return (
    <div className="app-container">
      {/* ✅ HEADER */}
      <header className="app-header">
        <img src={ugentLogo} alt="UGent Logo" className="ugent-logo" />
        <h1 className="app-title">3D Woningmodellering op Basis van GIS-Data</h1>
      </header>

      {/* ✅ ZOEKFORMULIER */}
      <div className="search-container">
        <SearchForm onSearch={handleSearch} />
      </div>

      {/* ✅ RESULTATEN EN KAART */}
      <div className="results-container">

        {woningData && woningData[0]?.geometry && <MapComponent geojson={woningData[0].geometry} />}

        {/* ✅ 3D MODEL */}
        <div className="model-row">
          <div className="model-half">
            <h3>🏗️ Woningvolume</h3>
            <Canvas style={{ width: "100%", height: "500px" }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[2, 2, 2]} />
              <OrbitControls />
              {woningData && woningData[0]?.geometry && (
                <BuildingModel geojson={geojson} hnMax={hnMax} />
              )}
            </Canvas>
          </div>
          <div className="model-half">
            <h3>⛰️ Dakanalyse</h3>
            {dakVlakken && dakVlakken.length > 0 && (
              <DakModelViewer dakVlakken={dakVlakken} />
            )}
          </div>
        </div>




          {/* ✅ 1. GEVELANALYSE */}
          <div className="facade-analyzer-container" style={{ marginTop: "40px" }}>
            <h2>🔎 Herken Openingen in een Gevelafbeelding</h2>
            <MultiGevelAnalyzer
              onExport={(data) => {
                console.log("📤 Geveldata doorgegeven aan Tryout:", data);
                setGevelData(data);
              }}
            />
          </div>

          {/* ✅ 2. RUITEN TEKENEN */}
          <div style={{ marginTop: "40px" }}>
            <h2>🪟 Openingen Visualiseren op het Grondplan</h2>
            <Tryout
              gevelExportData={gevelData}
              polygonFromSearch={woningData?.[0]?.geometry?.coordinates}
              onExport3D={setVerdiepingGegevens}
            />
          </div>

          <div style={{ marginTop: "40px" }}>
            <h2>🏠 Volumemodel Preview</h2>
            <Gebouw3DViewer
              verdiepingGegevens={verdiepingGegevens}
              hoogtePerVerdieping={hoogtePerVerdieping}
            />
          </div>

      </div>
    </div>
  );
}

export default App;
