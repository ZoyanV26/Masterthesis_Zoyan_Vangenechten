import requests
import base64
import matplotlib.pyplot as plt
import cv2
import numpy as np
from shapely.geometry import Polygon

# 🔹 API-instellingen
API_KEY = "AIzaSyCykFA-cBRlVs3EKMXSvDxSG4ZdcBOvD8U"
VISION_URL = f"https://vision.googleapis.com/v1/images:annotate?key={API_KEY}"

# 🔹 Pad naar afbeelding
IMAGE_PATH = "C:/Users/Zoyan/Downloads/proeffoto.jpg"

# 🔹 Open afbeelding en codeer deze
with open(IMAGE_PATH, "rb") as image_file:
    encoded_image = base64.b64encode(image_file.read()).decode("utf-8")


# 🔹 JSON-verzoek voor objectdetectie
request_data = {
    "requests": [
        {
            "image": {"content": encoded_image},
            "features": [{"type": "OBJECT_LOCALIZATION"}],  # Objectherkenning
        }
    ]
}

# 🔹 Verstuur verzoek naar Google Vision API
response = requests.post(VISION_URL, json=request_data)
result = response.json()

# 🔹 Laad afbeelding in voor visualisatie
image = cv2.imread(IMAGE_PATH)
image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
height, width, _ = image.shape

# 🔹 Lijst voor polygonen
polygon_data = []

# 🔹 Verwerk de objecten en sla hun polygonen op
if "responses" in result and "localizedObjectAnnotations" in result["responses"][0]:
    for obj in result["responses"][0]["localizedObjectAnnotations"]:
        name = obj["name"]
        vertices = obj["boundingPoly"]["normalizedVertices"]
        
        # 🔹 Converteer genormaliseerde coördinaten naar afbeeldingscoördinaten
        points = [(int(v["x"] * width), int(v["y"] * height)) for v in vertices]
        
        # 🔹 Bewaar de polygoon in een lijst
        polygon_data.append({"name": name, "polygon": Polygon(points), "points": points})

# 🔹 Filter: Verwijder polygonen die volledig binnen een andere polygoon vallen
filtered_polygons = []
for poly1 in polygon_data:
    is_inside = False
    for poly2 in polygon_data:
        if poly1 != poly2 and poly2["polygon"].contains(poly1["polygon"]):
            is_inside = True
            break
    if not is_inside:
        filtered_polygons.append(poly1)

# 🔹 Visualisatie van de overgebleven polygonen
plt.figure(figsize=(10, 10))
plt.imshow(image)

for i, poly in enumerate(filtered_polygons):
    points = np.array(poly["points"])
    plt.plot(*zip(*points, points[0]), marker='o', label=f"{poly['name']}")

plt.legend()
plt.show()
