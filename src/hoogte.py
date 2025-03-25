import numpy as np
import matplotlib.pyplot as plt
from scipy.ndimage import sobel
import rasterio
import rasterio.mask
import geopandas as gpd
from shapely.geometry import Polygon
import json
from matplotlib.patches import Polygon as MplPolygon

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
    masked_transform = transform  # nodig voor pixel-coördinaten

# 3. Elevatie & schoonmaken
elevation = masked[0]
elevation = np.where(elevation == nodata, np.nan, elevation)

# 4. Gradiënten bepalen
dy, dx = np.gradient(elevation)
magnitude = np.sqrt(dx**2 + dy**2)
epsilon = 1e-6
dx_unit = dx / (magnitude + epsilon)
dy_unit = dy / (magnitude + epsilon)

# 5. Rasterpixel-coördinaten
rows, cols = elevation.shape
x, y = np.meshgrid(np.arange(cols), np.arange(rows))

# 6. Masker voor relevante pijlen
mask = magnitude > 0.2

# 7. Polygon naar pixel-coördinaten converteren
def world_to_pixel(xy, transform):
    x, y = xy
    col = int((x - transform.c) / transform.a)
    row = int((transform.f - y) / abs(transform.e))
    return (col, row)

poly_pixels = [world_to_pixel(coord, masked_transform) for coord in poly_coords]

# 8. Visualiseren
plt.figure(figsize=(8, 6))
plt.imshow(elevation, cmap='gray', origin='upper')
plt.quiver(x[mask], y[mask], dx_unit[mask], -dy_unit[mask],
           color='red', scale=20, width=0.004)

# Footprint als polygon patch toevoegen
mpl_poly = MplPolygon(poly_pixels, closed=True, edgecolor='cyan', facecolor='none', linewidth=2)
plt.gca().add_patch(mpl_poly)

plt.title("Dakhelling met gebouwfootprint")
plt.axis('off')
plt.tight_layout()
plt.show()
