import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from scipy.ndimage import sobel
import rasterio
import rasterio.mask
import geopandas as gpd
from shapely.geometry import Polygon
import json

# 1. Polygon in EPSG:31370
poly_coords = [
    (55291.96, 198726.33),
    (55298.41, 198732.07),
    (55305.12, 198724.36),
    (55305.19, 198724.43),
    (55305.32, 198724.28),
    (55298.94, 198718.27),
    (55291.96, 198726.33)
]
polygon = Polygon(poly_coords)
gdf = gpd.GeoDataFrame({'geometry': [polygon]}, crs='EPSG:31370')
geojson_geom = [json.loads(gdf.to_json())['features'][0]['geometry']]

# 2. TIFF inlezen en maskeren
tiff_path = "C:/Users/Zoyan/Downloads/DHMVIIDSMRAS1m_k12.tif"
with rasterio.open(tiff_path) as src:
    masked, transform = rasterio.mask.mask(src, geojson_geom, crop=True)
    nodata = src.nodata
    elevation = masked[0]
    elevation = np.where(elevation == nodata, np.nan, elevation)

# 3. Rastergrid opstellen
rows, cols = elevation.shape
x_coords = np.arange(cols) * transform[0] + transform[2]
y_coords = np.arange(rows) * transform[4] + transform[5]
x_grid, y_grid = np.meshgrid(x_coords, y_coords)

# 4. Richting van helling (gradiënt)
dx = sobel(elevation, axis=1, mode='nearest')
dy = sobel(elevation, axis=0, mode='nearest')
magnitude = np.sqrt(dx**2 + dy**2)

# 5. Tolerantie om vlakke vs hellende cellen te onderscheiden
tol = 0.25

# 6. Bouw vereenvoudigde cell-vlakken
faces = []
colors = []

for i in range(rows - 1):
    for j in range(cols - 1):
        patch = elevation[i:i+2, j:j+2]
        if np.isnan(patch).any():
            continue

        x_patch = x_grid[i:i+2, j:j+2]
        y_patch = y_grid[i:i+2, j:j+2]

        face = [
            [x_patch[0, 0], y_patch[0, 0], patch[0, 0]],
            [x_patch[0, 1], y_patch[0, 1], patch[0, 1]],
            [x_patch[1, 1], y_patch[1, 1], patch[1, 1]],
            [x_patch[1, 0], y_patch[1, 0], patch[1, 0]]
        ]

        local_grad = magnitude[i, j]
        color = 'gold' if local_grad > tol else 'lightskyblue'
        faces.append(face)
        colors.append(color)

# 7. 3D plot
fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection='3d')

mesh = Poly3DCollection(faces, facecolors=colors, edgecolor='k', linewidths=0.2, alpha=1.0)
ax.add_collection3d(mesh)

ax.set_title("3D dakmodel met hellende richtingen")
ax.set_xlabel("X (m)")
ax.set_ylabel("Y (m)")
ax.set_zlabel("Hoogte (m)")
ax.set_xlim(x_coords[0], x_coords[-1])
ax.set_ylim(y_coords[-1], y_coords[0])
ax.set_zlim(np.nanmin(elevation), np.nanmax(elevation))

plt.tight_layout()
plt.show()
