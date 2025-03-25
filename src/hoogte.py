import rasterio
from rasterio.sample import sample_gen

# Pad naar de GeoTIFF (controleer of dit pad klopt op jouw computer)
tiff_path = "C:/Users/Zoyan/Downloads/DHMVIIDSMRAS1m_k12.tif"

# Coördinaten in EPSG:31370 (X, Y)
coordinates = [
    (55291.96, 198726.33),
    (55298.41, 198732.07),
    (55305.12, 198724.36),
    (55305.19, 198724.43),
    (55305.32, 198724.28),
    (55298.94, 198718.27),
    (55291.96, 198726.33)
]

# Open het raster en sample de hoogtes
with rasterio.open(tiff_path) as dataset:
    heights = [val[0] for val in dataset.sample(coordinates)]

# Resultaten printen
for i, (coord, height) in enumerate(zip(coordinates, heights)):
    print(f"Punt {i+1} - X: {coord[0]:.2f}, Y: {coord[1]:.2f} → Hoogte: {height:.2f} m")
