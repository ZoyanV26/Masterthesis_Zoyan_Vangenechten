import React, { useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line } from "react-konva";
import * as pc from "polygon-clipping"; // ✅ Voor geometrische vergelijking

const FacadeAnalyzer = () => {
  const [imageURL, setImageURL] = useState(null);
  const [imageElement, setImageElement] = useState(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [polygons, setPolygons] = useState([]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      setImageURL(reader.result); // voor visuele weergave
      detectObjects(base64);
    };
    reader.readAsDataURL(file);
  };

  const detectObjects = async (base64) => {
    apiKey = ´${process.env.REACT_APP_GOOGLE_API_KEY}´, // 👉 Tijdelijk rechtstreeks
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
        console.warn("❌ Lege of ongeldige Vision API response");
        alert("Er is iets misgelopen met de herkenning. Geen geldige respons.");
        return;
      }

      const objects = responses[0].localizedObjectAnnotations;

      if (!objects || objects.length === 0) {
        console.log("ℹ️ Geen objecten gevonden.");
        alert("Er zijn geen ramen of deuren herkend op deze afbeelding.");
        return;
      }

      const rawPolygons = objects.map((obj) => ({
        name: obj.name,
        points: obj.boundingPoly.normalizedVertices.map((v) => ({
          x: v.x,
          y: v.y,
        })),
      }));

      console.log("📦 Alle herkende polygonen:", rawPolygons);

      // 🔍 Verwijder polygonen die volledig in een andere liggen
      const toPCPolygon = (points) => [points.map((p) => [p.x, p.y])];

      const filteredPolygons = rawPolygons.filter((poly1, i) => {
        const p1 = toPCPolygon(poly1.points);
        return !rawPolygons.some((poly2, j) => {
          if (i === j) return false;
          const p2 = toPCPolygon(poly2.points);
          const diff = pc.difference(p1, p2);
          return diff.length === 0; // betekent: poly1 zit volledig in poly2
        });
      });

      console.log("🧹 Gefilterde polygonen (zonder nested):", filteredPolygons);
      setPolygons(filteredPolygons);

    } catch (error) {
      console.error("🚨 Fout bij communicatie met Vision API:", error);
      alert("Er is een fout opgetreden bij het ophalen van gegevens van de Vision API.");
    }
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    setImageElement(img);

    const screenWidth = window.innerWidth;
    const maxWidth = screenWidth * 0.5; // 50% van scherm
    const originalWidth = img.width;
    const originalHeight = img.height;
    const scaleFactor = maxWidth / originalWidth;

    setScale(scaleFactor);
    setDisplaySize({
      width: originalWidth * scaleFactor,
      height: originalHeight * scaleFactor,
    });
  };

  return (
    <div>
      <h2>🏠 Gevelanalyse</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {imageURL && (
        <>
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
                  <Line
                    key={index}
                    points={poly.points
                      .map((p) => [
                        p.x * imageElement.width * scale,
                        p.y * imageElement.height * scale,
                      ])
                      .flat()}
                    closed
                    stroke="red"
                    strokeWidth={2}
                    name={poly.name}
                  />
                ))}
              </Layer>
            </Stage>
          )}
        </>
      )}
    </div>
  );
};

export default FacadeAnalyzer;
