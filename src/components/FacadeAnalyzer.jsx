import React, { useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Text } from "react-konva";
import * as pc from "polygon-clipping";

const ruimteOpties = ["Onbekend", "Slaapkamer", "Keuken", "Living", "Badkamer", "Bureau"];

const FacadeAnalyzer = () => {
  const [imageURL, setImageURL] = useState(null);
  const [imageElement, setImageElement] = useState(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [polygons, setPolygons] = useState([]);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      setImageURL(reader.result);
      detectObjects(base64);
    };
    reader.readAsDataURL(file);
  };

  const detectObjects = async (base64) => {
    const apiKey = "AIzaSyCykFA-cBRlVs3EKMXSvDxSG4ZdcBOvD8U";
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const body = {
      requests: [
        {
          image: { content: base64 },
          features: [{ type: "OBJECT_LOCALIZATION" }],
        },
      ],
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const result = await response.json();
      console.log("🌐 Vision API response:", result);

      const responses = result.responses;

      if (!responses || responses.length === 0) {
        alert("Geen geldige respons van de Vision API.");
        return;
      }

      const objects = responses[0].localizedObjectAnnotations;
      if (!objects || objects.length === 0) {
        alert("Geen objecten gevonden.");
        return;
      }

      const rawPolygons = objects.map((obj, index) => ({
        id: index + 1,
        name: obj.name,
        points: obj.boundingPoly.normalizedVertices.map((v) => ({
          x: v.x,
          y: v.y,
        })),
        ruimte: "Onbekend",
      }));

      const toPCPolygon = (points) => [points.map((p) => [p.x, p.y])];

      const filteredPolygons = rawPolygons.filter((poly1, i) => {
        const p1 = toPCPolygon(poly1.points);
        return !rawPolygons.some((poly2, j) => {
          if (i === j) return false;
          const p2 = toPCPolygon(poly2.points);
          const diff = pc.difference(p1, p2);
          return diff.length === 0;
        });
      });

      setPolygons(filteredPolygons);
    } catch (error) {
      console.error("Fout bij Vision API:", error);
      alert("Fout bij Vision API.");
    }
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    setImageElement(img);

    const screenWidth = window.innerWidth;
    const maxWidth = screenWidth * 0.5;
    const scaleFactor = maxWidth / img.width;

    setScale(scaleFactor);
    setDisplaySize({
      width: img.width * scaleFactor,
      height: img.height * scaleFactor,
    });
  };

  const handlePolygonClick = (index) => {
    setSelectedPolygonIndex(index);
  };

  const handleLabelChange = (e) => {
    const updatedPolygons = [...polygons];
    updatedPolygons[selectedPolygonIndex].ruimte = e.target.value;
    setPolygons(updatedPolygons);
    setSelectedPolygonIndex(null);
  };

  const exportJSON = () => {
    const exportData = polygons.map((poly) => ({
      id: poly.id,
      type: poly.name,
      ruimte: poly.ruimte,
      points: poly.points,
    }));

    console.log("📤 JSON Export:", exportData);
    alert("De data werd geëxporteerd. Bekijk de console voor de JSON.");
  };

  return (
    <div>
      <h2>🏠 Gevelanalyse</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />

      {imageURL && (
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", marginTop: "20px" }}>
          {/* 🔹 Linkerzijde: afbeelding/canvas */}
          <div>
            <img
              src={imageURL}
              alt="Geüploade gevel"
              onLoad={handleImageLoad}
              style={{ display: "none" }}
            />
            {imageElement && (
              <Stage width={displaySize.width} height={displaySize.height}>
                <Layer>
                  <KonvaImage image={imageElement} scale={{ x: scale, y: scale }} />
                  {polygons.map((poly, index) => (
                    <React.Fragment key={poly.id}>
                      <Line
                        points={poly.points
                          .map((p) => [
                            p.x * imageElement.width * scale,
                            p.y * imageElement.height * scale,
                          ])
                          .flat()}
                        closed
                        stroke={index === selectedPolygonIndex ? "blue" : "red"}
                        strokeWidth={2}
                        onClick={() => handlePolygonClick(index)}
                      />
                      <Text
                        x={poly.points[0].x * imageElement.width * scale}
                        y={poly.points[0].y * imageElement.height * scale - 15}
                        text={`${poly.id} – ${poly.ruimte}`}
                        fontSize={14}
                        fill="black"
                      />
                    </React.Fragment>
                  ))}
                </Layer>
              </Stage>
            )}
          </div>

          {/* 🔸 Rechterzijde: interactie */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {selectedPolygonIndex !== null && (
              <div>
                <label>Welke ruimte zit achter deze opening?</label>
                <select
                  value={polygons[selectedPolygonIndex].ruimte}
                  onChange={handleLabelChange}
                >
                  {ruimteOpties.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button onClick={exportJSON}>📤 Exporteer gegevens als JSON</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacadeAnalyzer;
