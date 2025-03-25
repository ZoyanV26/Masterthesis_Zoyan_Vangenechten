import rasterio
import rasterio.mask
import geopandas as gpd
from shapely.geometry import Polygon
import matplotlib.pyplot as plt
import numpy as np
import json

# 1. Polygon definiëren
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

# 2. Omzetten naar GeoJSON-achtige dict
geojson_geom = [json.loads(gpd.GeoSeries([polygon]).to_json())['features'][0]['geometry']]

# 3. TIFF inlezen en mask toepassen
tiff_path = "C:/Users/Zoyan/Downloads/DHMVIIDSMRAS1m_k12.tif"
with rasterio.open(tiff_path) as src:
    out_image, out_transform = rasterio.mask.mask(src, geojson_geom, crop=True)
    out_meta = src.meta

# 4. Masked data plotten
masked_data = np.ma.masked_equal(out_image[0], src.nodata)

plt.figure(figsize=(8, 6))
plt.imshow(masked_data, cmap='viridis')
plt.colorbar(label='Hoogte (m)')
plt.title("Hoogtes binnen gebouwcontour")
plt.axis('off')
plt.tight_layout()
plt.show()
