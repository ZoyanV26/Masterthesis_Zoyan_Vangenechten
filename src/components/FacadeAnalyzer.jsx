import React, { useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Text, Circle } from "react-konva";
import * as pc from "polygon-clipping";

const ruimteOpties = ["Berging", "Badkamer", "Bureau", "Garage", "Hal", "Keuken", "Living", "Slaapkamer", "Toilet", "Onbekend"];
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

      if (!response.ok) return;

      const result = await response.json();
      const objects = result.responses?.[0]?.localizedObjectAnnotations || [];
      if (objects.length === 0) return;

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
    } catch (err) {}
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
    <div style={{  fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>Gevelanalyse</h2>

      {gevels.map((g, i) => (
        <div key={i} style={{ marginBottom: 30, border: "1px solid #ccc", padding: 15, borderRadius: "8px" }}>
          <h3 onClick={() => handleToggle(i)} style={{ cursor: "pointer", fontSize: "18px", marginBottom: "10px" }}>
            {g.open ? "▼" : "▶"} {g.gevelType}
          </h3>

          {g.open && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, i)} style={{ marginBottom: 10 }} />
              {g.imageURL && (
                <img
                  src={g.imageURL}
                  alt="preview"
                  onLoad={(e) => handleImageLoad(e, i)}
                  style={{ display: "none" }}
                />
              )}

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                <button onClick={() => toggleSchaalLijn(i)} style={{ padding: "8px 16px" }}>
                  {g.schaalLijnActief ? "Stop schaalmodus" : "Start schaalmodus"}
                </button>
                <button onClick={() => toggleTekenModus(i)} style={{ padding: "8px 16px" }}>
                  {g.tekenActief ? "Stop tekenmodus" : " Start tekenmodus"}
                </button>
              </div>

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
                          text={`${p.id} – ${p.name} – ${p.ruimte}`}
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
                <div style={{ marginTop: 10 }}>
                  <div>
                    <label>Soort opening:</label>
                    <select
                      value={g.polygons[selectedPolygonIndex].name}
                      onChange={(e) => {
                        const nieuwe = [...gevels];
                        nieuwe[i].polygons[selectedPolygonIndex].name = e.target.value;
                        setGevels(nieuwe);
                      }}
                      style={{ marginLeft: 10 }}
                    >
                      <option value="Window">Ruit</option>
                      <option value="Door">Deur</option>
                    </select>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <label>Ruimte achter opening:</label>
                    <select
                      value={g.polygons[selectedPolygonIndex].ruimte}
                      onChange={handleLabelChange}
                      style={{ marginLeft: 10 }}
                    >
                      {ruimteOpties.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <button onClick={handleVerwijderPolygon} style={{ marginLeft: 10, padding: "6px 12px" }}>
                      Verwijder opening
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <button onClick={exportJSON} style={{
        padding: "12px 24px",
        fontSize: "16px",
        backgroundColor: "#155724",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        marginTop: "20px"
      }}>
        Ik ben klaar met het herkennen van de openingen
      </button>
    </div>
  );
};

export default MultiGevelAnalyzer;