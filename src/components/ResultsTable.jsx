import React from "react";

const ResultsTable = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <p>⚠️ Geen gegevens gevonden.</p>;
  }

  const woning = data[0];

  // Controleer of de woning data objecten bevat
  if (!woning || typeof woning !== "object") {
    return <p>⚠️ Ongeldige woningdata.</p>;
  }

  return (
    <table border="1">
      <thead>
        <tr>
          {Object.keys(woning).map((key) => (
            <th key={key}>{key}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {Object.values(woning).map((value, index) => (
            <td key={index}>{JSON.stringify(value)}</td>
          ))}
        </tr>
      </tbody>
    </table>
  );
};

export default ResultsTable;