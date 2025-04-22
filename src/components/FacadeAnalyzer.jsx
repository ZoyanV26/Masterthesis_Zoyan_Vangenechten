import React, { useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Text, Circle, Rect } from "react-konva";
import * as pc from "polygon-clipping";

// voeg toe welke ruimten mogelijk zijn, eventueel zelf te kiezen ruimten ook
const ruimteOpties = ["Onbekend", "Slaapkamer", "Keuken", "Living", "Badkamer", "Bureau"];
const gevelTypes = ["Voorgevel", "Achtergevel", "Zijgevel Links", "Zijgevel Rechts"];

const MultiGevelAnalyzer = ({ onExport }) => {
  const [gevels, setGevels] = useState(
    gevelTypes.map((naam) => ({
      gevelType: naam,
      open: false,
      imageURL: null,
      imageElement: null,
      polygons: [],
      scale: 1,
      displaySize: { width: 0, height: 0 },
      scaleLine: [],
      schaalLijnActief: false,
      tekenActief: false,
      nieuwePolygon: null,
    }))
  );

  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState(null);
  const [typeOpening, setTypeOpening] = useState("Window");
  const [actieveGevelIndex, setActieveGevelIndex] = useState(null);

  const updateGevelField = (index, key, value) => {
    const nieuwe = [...gevels];
    nieuwe[index][key] = value;
    setGevels(nieuwe);
  };

  const handleToggle = (index) => {
    setActieveGevelIndex(index);
    setSelectedPolygonIndex(null);
    updateGevelField(index, "open", !gevels[index].open);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.log("Fout bij ophalen van Vision API (status: " + response.status + ")");
        return;
      }

      const result = await response.json();
      const objects = result.responses?.[0]?.localizedObjectAnnotations || [];
      if (objects.length === 0) {
        console.log("Geen ramen of deuren gedetecteerd.");
        return;
      }

      const relevante = objects.filter((obj) => ["Window", "Door"].includes(obj.name));
      const rawPolygons = relevante.map((obj, i) => ({
        id: i + 1,
        name: obj.name,
        points: obj.boundingPoly.normalizedVertices.map((v) => ({ x: v.x, y: v.y })),
        ruimte: "Onbekend",
      }));

      const toPC = (pts) => [pts.map((p) => [p.x, p.y])];
      const filtered = rawPolygons.filter((p1, i) =>
        !rawPolygons.some((p2, j) => i !== j && pc.difference(toPC(p1.points), toPC(p2.points)).length === 0)
      );

      updateGevelField(index, "polygons", filtered);
    } catch (err) {
      console.log("Fout bij ophalen van Vision API");
    }
  };

  const handleImageLoad = (e, index) => {
    const img = e.target;
    const schaal = Math.min(500 / img.width, 1);
    updateGevelField(index, "imageElement", img);
    updateGevelField(index, "scale", schaal);
    updateGevelField(index, "displaySize", { width: img.width * schaal, height: img.height * schaal });
  };

  const handleCanvasClick = (e, index) => {
    const g = gevels[index];
    const pointer = e.target.getStage().getPointerPosition();
    const nieuwe = [...gevels];

    if (g.schaalLijnActief) {
      const p = nieuwe[index].scaleLine;
      nieuwe[index].scaleLine = p.length >= 2 ? [pointer] : [...p, pointer];
    } else if (g.tekenActief) {
      if (!g.nieuwePolygon) {
        nieuwe[index].nieuwePolygon = { start: pointer };
      } else {
        const { start } = g.nieuwePolygon;
        const poly = {
          id: g.polygons.length + 1,
          name: typeOpening,
          ruimte: "Onbekend",
          points: [
            { x: start.x / g.displaySize.width, y: start.y / g.displaySize.height },
            { x: pointer.x / g.displaySize.width, y: start.y / g.displaySize.height },
            { x: pointer.x / g.displaySize.width, y: pointer.y / g.displaySize.height },
            { x: start.x / g.displaySize.width, y: pointer.y / g.displaySize.height },
          ],
        };
        nieuwe[index].polygons.push(poly);
        nieuwe[index].nieuwePolygon = null;
      }
    }
    setGevels(nieuwe);
  };

  const toggleSchaalLijn = (index) => {
    const nieuwe = [...gevels];
    nieuwe[index].schaalLijnActief = !gevels[index].schaalLijnActief;
    nieuwe[index].tekenActief = false;
    setGevels(nieuwe);
  };

  const toggleTekenModus = (index) => {
    const nieuwe = [...gevels];
    nieuwe[index].tekenActief = !gevels[index].tekenActief;
    nieuwe[index].schaalLijnActief = false;
    setGevels(nieuwe);
  };

  const handlePolygonClick = (i) => setSelectedPolygonIndex(i);

  const handleLabelChange = (e) => {
    const nieuwe = [...gevels];
    nieuwe[actieveGevelIndex].polygons[selectedPolygonIndex].ruimte = e.target.value;
    setGevels(nieuwe);
    setSelectedPolygonIndex(null);
  };

  const handleVerwijderPolygon = () => {
    if (selectedPolygonIndex === null || actieveGevelIndex === null) return;
    const nieuwe = [...gevels];
    nieuwe[actieveGevelIndex].polygons.splice(selectedPolygonIndex, 1);
    setGevels(nieuwe);
    setSelectedPolygonIndex(null);
  };

  const exportJSON = () => {
    if (typeof onExport === "function") onExport(gevels);
  };

  return (
    <div>
      <h2> Multi-gevelanalyse</h2>
      {gevels.map((g, i) => (
        <div key={i} style={{ marginBottom: 20, border: "1px solid #ccc", padding: 10 }}>
          <h3 onClick={() => handleToggle(i)} style={{ cursor: "pointer" }}>{g.open ? "▼" : "▶"} {g.gevelType}</h3>
          {g.open && (
            <div style={{ display: "flex", gap: 20 }}>
              <div>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, i)} />
                {g.imageURL && (
                  <img
                    src={g.imageURL}
                    alt="preview"
                    onLoad={(e) => handleImageLoad(e, i)}
                    style={{ display: "none" }}
                  />
                )}
                <label>Type opening: </label>
                <select value={typeOpening} onChange={(e) => setTypeOpening(e.target.value)}>
                  <option value="Window">Venster</option>
                  <option value="Door">Deur</option>
                </select>

                <button onClick={() => toggleSchaalLijn(i)}>{g.schaalLijnActief ? "❌ Stop Schaallijn" : "📏 Start Schaallijn"}</button>
                <button onClick={() => toggleTekenModus(i)}>{g.tekenActief ? "❌ Stop Tekenmodus" : "🟥 Teken venster"}</button>

                {g.imageURL && g.imageElement && (
                  <Stage width={g.displaySize.width} height={g.displaySize.height} onClick={(e) => handleCanvasClick(e, i)}>
                    <Layer>
                      <KonvaImage image={g.imageElement} scale={{ x: g.scale, y: g.scale }} />
                      {g.polygons.map((p, j) => (
                        <React.Fragment key={p.id}>
                          <Line
                            points={p.points.map(pt => [pt.x * g.imageElement.width * g.scale, pt.y * g.imageElement.height * g.scale]).flat()}
                            closed stroke={j === selectedPolygonIndex ? "blue" : "red"} strokeWidth={2}
                            onClick={() => { setActieveGevelIndex(i); handlePolygonClick(j); }}
                          />
                          <Text
                            x={p.points[0].x * g.imageElement.width * g.scale}
                            y={p.points[0].y * g.imageElement.height * g.scale - 15}
                            text={`${p.id} – ${p.ruimte}`}
                            fontSize={14} fill="black"
                          />
                        </React.Fragment>
                      ))}
                      {g.scaleLine.length === 2 && <Line points={g.scaleLine.flatMap(p => [p.x, p.y])} stroke="green" strokeWidth={3} dash={[10, 5]} />}
                      {g.scaleLine.map((p, k) => <Circle key={k} x={p.x} y={p.y} radius={4} fill="green" />)}
                    </Layer>
                  </Stage>
                )}
                {selectedPolygonIndex !== null && actieveGevelIndex === i && (
                  <div>
                    <label>Ruimte achter opening:</label>
                    <select value={g.polygons[selectedPolygonIndex].ruimte} onChange={handleLabelChange}>
                      {ruimteOpties.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <button style={{ marginLeft: 10 }} onClick={handleVerwijderPolygon}>🗑️ Verwijder</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={exportJSON}>📤 Exporteer JSON naar Tryout</button>
    </div>
  );
};

export default MultiGevelAnalyzer;
