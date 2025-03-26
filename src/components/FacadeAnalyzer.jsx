import React, { useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Text, Circle } from "react-konva";
import * as pc from "polygon-clipping";

const ruimteOpties = ["Onbekend", "Slaapkamer", "Keuken", "Living", "Badkamer", "Bureau"];
const gevelTypes = ["Voorgevel", "Achtergevel", "Zijgevel Links", "Zijgevel Rechts"];

const gevelSegmenten = [
  { naam: "Voorgevel", lengte: 8.4 },
  { naam: "Achtergevel", lengte: 8.4 },
  { naam: "Zijgevel Links", lengte: 6.2 },
  { naam: "Zijgevel Rechts", lengte: 6.2 },
];

const MultiGevelAnalyzer = () => {
  const [gevels, setGevels] = useState(
    gevelTypes.map((naam) => ({
      naam,
      open: false,
      imageURL: null,
      imageElement: null,
      polygons: [],
      scale: 1,
      displaySize: { width: 0, height: 0 },
      scaleLine: [],
      geselecteerdSegment: "",
      schaalLijnActief: false
    }))
  );
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState(null);
  const [actieveGevelIndex, setActieveGevelIndex] = useState(null);

  const handleToggle = (index) => {
    const nieuweGevels = gevels.map((gevel, i) =>
      i === index ? { ...gevel, open: !gevel.open } : gevel
    );
    setGevels(nieuweGevels);
    setSelectedPolygonIndex(null);
    setActieveGevelIndex(index);
  };

  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      updateGevelField(index, "imageURL", reader.result);
      detectObjects(base64, index);
    };
    reader.readAsDataURL(file);
  };

  const updateGevelField = (index, key, value) => {
    const nieuweGevels = [...gevels];
    nieuweGevels[index][key] = value;
    setGevels(nieuweGevels);
  };

  const detectObjects = async (base64, index) => {
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
      const objects = result.responses?.[0]?.localizedObjectAnnotations || [];

      const relevanteObjecten = objects.filter((obj) =>
        ["Window", "Door"].includes(obj.name)
      );

      const rawPolygons = relevanteObjecten.map((obj, i) => ({
        id: i + 1,
        name: obj.name,
        points: obj.boundingPoly.normalizedVertices.map((v) => ({ x: v.x, y: v.y })),
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

      updateGevelField(index, "polygons", filteredPolygons);
    } catch (err) {
      alert("Fout bij het ophalen van gegevens van de Vision API");
      console.error(err);
    }
  };

  const handleImageLoad = (e, index) => {
    const img = e.target;
    const maxDisplayWidth = 500;
    const scaleFactor = Math.min(maxDisplayWidth / img.width, 1);
    const nieuweGevels = [...gevels];
    nieuweGevels[index].imageElement = img;
    nieuweGevels[index].scale = scaleFactor;
    nieuweGevels[index].displaySize = {
      width: img.width * scaleFactor,
      height: img.height * scaleFactor,
    };
    setGevels(nieuweGevels);
  };

  const handleCanvasClick = (e, index) => {
    const gevel = gevels[index];
    if (!gevel.schaalLijnActief) return;

    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const nieuweGevels = [...gevels];
    const punten = nieuweGevels[index].scaleLine;

    if (punten.length >= 2) {
      nieuweGevels[index].scaleLine = [pointer];
    } else {
      nieuweGevels[index].scaleLine = [...punten, pointer];
    }

    setGevels(nieuweGevels);
  };

  const toggleSchaalLijn = (index) => {
    const nieuweGevels = [...gevels];
    nieuweGevels[index].schaalLijnActief = !nieuweGevels[index].schaalLijnActief;
    setGevels(nieuweGevels);
  };

  const berekenPixelAfstand = (punten) => {
    if (punten.length !== 2) return null;
    const dx = punten[1].x - punten[0].x;
    const dy = punten[1].y - punten[0].y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const berekenSchaal = (index) => {
    const gevel = gevels[index];
    const pixelAfstand = berekenPixelAfstand(gevel.scaleLine);
    const segment = gevelSegmenten.find((s) => s.naam === gevel.geselecteerdSegment);
    if (!pixelAfstand || !segment) return null;
    return segment.lengte / pixelAfstand;
  };

  const handleSegmentSelect = (e, index) => {
    const nieuweGevels = [...gevels];
    nieuweGevels[index].geselecteerdSegment = e.target.value;
    setGevels(nieuweGevels);
  };

  const handlePolygonClick = (index) => {
    setSelectedPolygonIndex(index);
  };

  const handleLabelChange = (e) => {
    const nieuweGevels = [...gevels];
    nieuweGevels[actieveGevelIndex].polygons[selectedPolygonIndex].ruimte = e.target.value;
    setGevels(nieuweGevels);
    setSelectedPolygonIndex(null);
  };

  const exportJSON = () => {
    const exportData = gevels.map((gevel) => ({
      naam: gevel.naam,
      polygons: gevel.polygons.map((poly) => ({
        id: poly.id,
        type: poly.name,
        ruimte: poly.ruimte,
        points: poly.points,
      })),
      scaleLine: gevel.scaleLine,
      gevelSegment: gevel.geselecteerdSegment,
    }));
    console.log("📤 Geveldata JSON:", exportData);
    alert("Data geëxporteerd. Zie console.");
  };

  return (
    <div>
      <h2>🏠 Multi-gevelanalyse</h2>

      {gevels.map((gevel, index) => {
        const pixelAfstand = berekenPixelAfstand(gevel.scaleLine);
        const schaal = berekenSchaal(index);

        return (
          <div key={index} style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
            <h3 onClick={() => handleToggle(index)} style={{ cursor: "pointer" }}>
              {gevel.open ? "▼" : "▶"} {gevel.naam}
            </h3>

            {gevel.open && (
              <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", marginTop: "10px" }}>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, index)}
                  />
                  <button onClick={() => toggleSchaalLijn(index)}>
                    {gevel.schaalLijnActief ? "❌ Stop Schaallijn" : "📏 Start Schaallijn"}
                  </button>

                  <div style={{ marginTop: 10 }}>
                    <label>Kies bijhorende gevellijn: </label>
                    <select value={gevel.geselecteerdSegment} onChange={(e) => handleSegmentSelect(e, index)}>
                      <option value="">-- Selecteer gevel --</option>
                      {gevelSegmenten.map((s) => (
                        <option key={s.naam} value={s.naam}>
                          {s.naam} ({s.lengte} m)
                        </option>
                      ))}
                    </select>
                  </div>

                  {gevel.imageURL && (
                    <>
                      <img
                        src={gevel.imageURL}
                        alt="Geüploade gevel"
                        onLoad={(e) => handleImageLoad(e, index)}
                        style={{ display: "none" }}
                      />
                      {gevel.imageElement && (
                        <Stage
                          width={gevel.displaySize.width}
                          height={gevel.displaySize.height}
                          onClick={(e) => handleCanvasClick(e, index)}
                        >
                          <Layer>
                            <KonvaImage image={gevel.imageElement} scale={{ x: gevel.scale, y: gevel.scale }} />
                            {gevel.polygons.map((poly, i) => (
                              <React.Fragment key={poly.id}>
                                <Line
                                  points={poly.points
                                    .map((p) => [
                                      p.x * gevel.imageElement.width * gevel.scale,
                                      p.y * gevel.imageElement.height * gevel.scale,
                                    ])
                                    .flat()}
                                  closed
                                  stroke={i === selectedPolygonIndex ? "blue" : "red"}
                                  strokeWidth={2}
                                  onClick={() => {
                                    setActieveGevelIndex(index);
                                    handlePolygonClick(i);
                                  }}
                                />
                                <Text
                                  x={poly.points[0].x * gevel.imageElement.width * gevel.scale}
                                  y={poly.points[0].y * gevel.imageElement.height * gevel.scale - 15}
                                  text={`${poly.id} – ${poly.ruimte}`}
                                  fontSize={14}
                                  fill="black"
                                />
                              </React.Fragment>
                            ))}
                            {gevel.scaleLine.length === 2 && (
                              <Line
                                points={gevel.scaleLine.flatMap((p) => [p.x, p.y])}
                                stroke="green"
                                strokeWidth={3}
                                dash={[10, 5]}
                              />
                            )}
                            {gevel.scaleLine.map((p, i) => (
                              <Circle key={i} x={p.x} y={p.y} radius={4} fill="green" />
                            ))}
                          </Layer>
                        </Stage>
                      )}
                    </>
                  )}

                  {gevel.scaleLine.length === 2 && (
                    <div style={{ marginTop: 10 }}>
                      <p>📏 Pixelafstand: {pixelAfstand?.toFixed(2)} px</p>
                      {schaal && <p>🧮 Schaal: {schaal.toFixed(4)} m/pixel</p>}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {selectedPolygonIndex !== null && actieveGevelIndex === index && (
                    <div>
                      <label>Welke ruimte zit achter deze opening?</label>
                      <select
                        value={gevel.polygons[selectedPolygonIndex].ruimte}
                        onChange={handleLabelChange}
                      >
                        {ruimteOpties.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button onClick={exportJSON}>📤 Exporteer alle gevelgegevens als JSON</button>
    </div>
  );
};

export default MultiGevelAnalyzer;
