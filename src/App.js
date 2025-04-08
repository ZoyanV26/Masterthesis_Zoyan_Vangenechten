import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SearchForm from "./components/SearchForm";
import ResultsTable from "./components/ResultsTable";
import MapComponent from "./components/MapComponent";
import BuildingModel from "./components/BuildingModel";
import FloorPlanCanvas from "./components/FloorPlanCanvas";
import FacadeAnalyzer from "./components/FacadeAnalyzer";
import Tryout from "./components/Tryout"; // ✅ Nieuw toegevoegd
import "./App.css";
import ugentLogo from "./assets/UGent_logo.png";

function App() {
  const [woningData, setWoningData] = useState(null);

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
      {/* ✅ HEADER MET UGENT LOGO EN TITEL */}
      <header className="app-header">
        <img src={ugentLogo} alt="UGent Logo" className="ugent-logo" />
        <h1 className="app-title">3D Woningmodellering op Basis van GIS-Data</h1>
      </header>

      {/* ✅ GECENTREERD ZOEKFORMULIER */}
      <div className="search-container">
        <SearchForm onSearch={handleSearch} />
      </div>

      {/* ✅ RESULTATEN */}
      <div className="results-container">
        {woningData && <ResultsTable data={woningData} />}
        {woningData && woningData[0]?.geometry && <MapComponent geojson={woningData[0].geometry} />}
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

        {/* ✅ DRAG-AND-DROP INTERFACE VOOR BINNENMUREN */}
        <div className="walls-container">
          <h2>🛠️ Voeg Binnenmuren Toe</h2>
          {woningData && woningData[0]?.geometry && (
            <FloorPlanCanvas geojson={woningData[0].geometry} />
          )}
          {/* Nieuw tekencomponent */}
          <Tryout />
        </div>

        {/* ✅ NIEUW: GEVELANALYSE MET GOOGLE VISION */}
        <div className="facade-analyzer-container">
          <h2>🔎 Herken Openingen in een Gevelafbeelding</h2>
          <FacadeAnalyzer />
        </div>
      </div>
    </div>
  );
}

export default App;
