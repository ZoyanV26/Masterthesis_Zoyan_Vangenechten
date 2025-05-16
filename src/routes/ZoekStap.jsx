// routes/ZoekStap.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import SearchForm from "../components/SearchForm";

export default function ZoekStap({ onSearch }) {
  const navigate = useNavigate();

  const handleSearchAndNavigate = async (formData) => {
    await onSearch(formData);
    navigate("/kaart");
  };

  return (
    <div style={{
      maxWidth: "900px",
      margin: "0 auto",
      padding: "40px 24px",
      fontFamily: "Arial, sans-serif"
    }}>
      {/* Algemene uitleg */}
      <section style={{ marginBottom: "30px" }}>
        <h2 style={{
          fontSize: "26px",
          fontWeight: "600",
          marginBottom: "12px",
          color: "#333"
        }}>
          Semi-automatische 3D-modellering van woningen
        </h2>
        <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#555" }}>
          Deze tool genereert op basis van overheidsdata en gevelafbeeldingen een functioneel 3D-model van een woning.
          Doorloop de verschillende stappen om tot een bruikbaar model te komen voor visualisatie of simulatie.
        </p>
      </section>

      {/* Bestaande formuliercomponent mét mooie layout */}
      <div className="search-container">
        <SearchForm onSearch={handleSearchAndNavigate} />
      </div>
    </div>
  );
}
