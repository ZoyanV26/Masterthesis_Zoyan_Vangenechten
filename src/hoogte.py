import rasterio
from shapely.geometry import Polygon, LineString
from pyproj import Transformer
import numpy as np
import matplotlib.pyplot as plt

# === INPUT ===

# GeoJSON-coördinaten in EPSG:4326
geojson_coords = [
    [3.016867456865903, 51.090895294955686],
    [3.0169580145264896, 51.09094790987709],
    [3.017055689295272, 51.09087972300538],
    [3.0170567709218123, 51.0908803286171],
    [3.0170586797596437, 51.09087899317062],
    [3.01696913978773, 51.09082394865127],
    [3.016867456865903, 51.090895294955686]
]

# Pad naar GeoTIFF in EPSG:31370
tiff_path = "C:/Users/Zoyan/Downloads/DHMVIIDSMRAS1m_k12.tif"  # <-- pas dit aan

# === FUNCTIES ===

def transform_coords(coords, from_epsg="EPSG:4326", to_epsg="EPSG:31370"):
    transformer = Transformer.from_crs(from_epsg, to_epsg, always_xy=True)
    return [transformer.transform(x, y) for x, y in coords]

def sample_polygon_boundary(polygon_coords, n_points=100):
    polygon = Polygon(polygon_coords)
    boundary = polygon.boundary
    sampled_points = []
    length = boundary.length
    for i in range(n_points):
        distance = (i / n_points) * length
        point = boundary.interpolate(distance)
        sampled_points.append((point.x, point.y))
    return sampled_points

def get_heights_from_tiff(tiff_path, coords):
    heights = []
    with rasterio.open(tiff_path) as dataset:
        band = dataset.read(1)
        nodata = dataset.nodata  # ← haal no-data waarde op
        width, height = dataset.width, dataset.height

        for lon, lat in coords:
            col, row = dataset.index(lon, lat)
            if 0 <= row < height and 0 <= col < width:
                value = band[row, col]
                if nodata is not None and value == nodata:
                    print(f"Punt ({lon:.2f}, {lat:.2f}) bevat no-data.")
                    heights.append(np.nan)
                else:
                    heights.append(value)
            else:
                print(f"Waarschuwing: punt ({lon:.2f}, {lat:.2f}) buiten raster.")
                heights.append(np.nan)
    return heights


def plot_height_profile(heights):
    plt.figure(figsize=(10, 4))
    plt.plot(heights, label="Hoogte langs contour")
    plt.title("Hoogteprofiel van gebouw (EPSG:31370)")
    plt.xlabel("Punt op contour")
    plt.ylabel("Hoogte (m)")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.show()
#mamapapa
# === UITVOERING ===

polygon_coords = transform_coords(geojson_coords)
sampled_points = sample_polygon_boundary(polygon_coords, n_points=100)
heights = get_heights_from_tiff(tiff_path, sampled_points)

print(f"Aantal geldige hoogtes: {np.count_nonzero(~np.isnan(heights))} / {len(heights)}")
plot_height_profile(heights)

with rasterio.open(tiff_path) as dataset:
    print("CRS van raster:", dataset.crs)
    print("Rastergrootte (pixels):", dataset.width, "x", dataset.height)
    print("Bounds (minX, minY, maxX, maxY):", dataset.bounds)
print("Eerste getransformeerde coördinaat:", sampled_points[0])
