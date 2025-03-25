import React from "react";
import ResultsTable from "../components/ResultsTable";
import MapComponent from "../components/MapComponent";
import BuildingModel from "../components/BuildingModel";

function Results({ woningData }) {
  if (!woningData || woningData.length === 0) {
    return <h2>Geen resultaten gevonden.</h2>;
  }

  return (
    <div>
      <h1>Zoekresultaten</h1>
      <ResultsTable data={woningData} />
      {woningData[0]?.geometry && <MapComponent geojson={woningData[0].geometry} />}
      {woningData[0]?.geometry && <BuildingModel geojson={woningData[0].geometry} />}
    </div>
  );
}

export default Results;
