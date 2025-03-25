import matplotlib.pyplot as plt
import numpy as np
from shapely.geometry import Polygon
from shapely.affinity import translate, rotate
from pyproj import Transformer

# 🔹 Coördinaten van het gebouw (in graden)
geojson = {
    "type": "Polygon",
    "coordinates": [[
        [3.016867456865903, 51.090895294955686],
        [3.0169580145264896, 51.09094790987709],
        [3.017055689295272, 51.09087972300538],
        [3.0170567709218123, 51.0908803286171],
        [3.0170586797596437, 51.09087899317062],
        [3.01696913978773, 51.09082394865127],
        [3.016867456865903, 51.090895294955686]
    ]]
}

# 🔹 Zet WGS84 naar Belgische Lambert 72 (EPSG:31370)
transformer = Transformer.from_crs("EPSG:4326", "EPSG:31370", always_xy=True)

# 🔹 Zet de coördinaten om van graden naar meters
converted_coords = np.array([
    transformer.transform(lon, lat)
    for lon, lat in geojson["coordinates"][0]
])

# 🔹 Creëer een shapely polygon voor het gebouw
gebouw_poly = Polygon(converted_coords)

# 🔹 Bereken de rotatiehoek (op basis van eerste twee punten)
p1, p2 = gebouw_poly.exterior.coords[:2]
dx, dy = p2[0] - p1[0], p2[1] - p1[1]
hoek = np.arctan2(dy, dx) * 180 / np.pi  # Graden

# 🔹 Roteer het gebouw om het loodrecht te zetten
gebouw_poly = rotate(gebouw_poly, -hoek, origin='centroid')

# 🔹 **Verplaats één hoekpunt naar (0,0)**
minx, miny, _, _ = gebouw_poly.bounds
gebouw_poly = translate(gebouw_poly, xoff=-minx, yoff=-miny)

# 🔹 Voeg een **muurdikte van 30 cm** toe
muurdikte = 0.3
buitenmuren = gebouw_poly  # Buitencontour blijft hetzelfde
binnenruimte = gebouw_poly.buffer(-muurdikte)  # Verminder grootte voor binnenruimte

# 🔹 **Visualisatie met Matplotlib**
fig, ax = plt.subplots(figsize=(6, 6))
ax.set_title("2D-Grondplan met Correcte Muren")
ax.set_xlabel("X (meters)")
ax.set_ylabel("Y (meters)")

# ✅ **Plot de buitenste muren in zwart**
x, y = buitenmuren.exterior.xy
ax.fill(x, y, facecolor="black", edgecolor="black", linewidth=2, alpha=1, label="Muren")

# ✅ **Plot de binnenruimte in lichtgrijs**
if binnenruimte.is_valid:
    x, y = binnenruimte.exterior.xy
    ax.fill(x, y, facecolor="lightgray", edgecolor="black", linewidth=2, alpha=1, label="Binnenruimte")

# ✅ Assen & weergave
ax.legend()
ax.grid(True)
ax.axis("equal")

# ✅ **Toon het grondplan**
plt.show()

