import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SearchForm from "./components/SearchForm";
import MapComponent from "./components/MapComponent";
import BuildingModel from "./components/BuildingModel";
import MultiGevelAnalyzer from "./components/FacadeAnalyzer";
import Tryout from "./components/Tryout";
import "./App.css";
import ugentLogo from "./assets/UGent_logo.png";

function App() {
  const [woningData, setWoningData] = useState(null);
  const [gevelData, setGevelData] = useState([]);
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
        {woningData && woningData[0]?.geometry && (
          <div className="model-container">
            <Canvas style={{ width: "100%", height: "500px" }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[2, 2, 2]} />
              <OrbitControls />
              <BuildingModel geojson={woningData[0].geometry} hnMax={woningData[0].HN_MAX} />
            </Canvas>
          </div>
        )}


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
            <Tryout gevelExportData={gevelData} polygonFromSearch={woningData?.[0]?.geometry?.coordinates} />


          </div>
      </div>
    </div>
  );
}

export default App;
