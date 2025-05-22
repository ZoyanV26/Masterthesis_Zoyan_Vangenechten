import React from "react";
import { useNavigate } from "react-router-dom";
import SearchForm from "../components/ZoekComponent";

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
          Deze webtool stelt gebruikers in staat om op basis van open overheidsdata en gevelafbeeldingen een functioneel 3D-model van een woning te genereren. De toepassing is ontworpen voor niet-experten, en biedt een intuïtief stapsgewijs proces waarmee zelfs zonder technische voorkennis een correct geometrisch model kan worden opgebouwd.
          Het eindresultaat is een gestructureerd en visueel 3D-model dat bruikbaar is voor toepassingen zoals energieprestatieanalyse, renovatiescans of stedenbouwkundige visualisaties. Zowel de gebouwcontouren, verdiepingen, gevelopeningen (zoals ramen en deuren) als de ruimtelijke indeling worden op een semi-automatische manier gegenereerd en geëxporteerd.
          Doorloop de verschillende stappen, geef waar nodig minimale input (zoals een adres of gevelbeeld), en ontvang een direct inzetbaar 3D-model. Deze aanpak maakt het mogelijk om sneller en efficiënter gebouwen te modelleren, met een minimum aan handmatige tussenkomst.
        </p>
      </section>
      <div className="search-container">
        <SearchForm onSearch={handleSearchAndNavigate} />
      </div>
    </div>
  );
}
