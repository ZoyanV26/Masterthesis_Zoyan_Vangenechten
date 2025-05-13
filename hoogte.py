from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from shapely.geometry import Polygon
import geopandas as gpd
import json
import numpy as np
import rasterio
import rasterio.mask
from scipy.ndimage import sobel
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # of ["*"] tijdens testen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/dakmodel")
async def dakmodel(request: Request):
    data = await request.json()
    coords_wgs84 = data["polygon"]  # lijst van [lon, lat]

    # 1. Polygon omzetten naar EPSG:31370
    polygon = Polygon(coords_wgs84)
    gdf = gpd.GeoDataFrame({"geometry": [polygon]}, crs="EPSG:4326")
    gdf = gdf.to_crs("EPSG:31370")
    geojson_geom = [json.loads(gdf.to_json())['features'][0]['geometry']]

    # 2. Raster inladen en maskeren
    tiff_path = "C:/Users/Zoyan/Downloads/DHMVIIDSMRAS1m_k12.tif"
    with rasterio.open(tiff_path) as src:
        masked, transform = rasterio.mask.mask(src, geojson_geom, crop=True)
        nodata = src.nodata
        elevation = masked[0]
        elevation = np.where(elevation == nodata, np.nan, elevation)

    # 3. Rastercoördinaten opstellen
    rows, cols = elevation.shape
    x_coords = np.arange(cols) * transform[0] + transform[2]
    y_coords = np.arange(rows) * transform[4] + transform[5]
    x_grid, y_grid = np.meshgrid(x_coords, y_coords)

    # 4. Helling berekenen
    dx = sobel(elevation, axis=1, mode='nearest')
    dy = sobel(elevation, axis=0, mode='nearest')
    magnitude = np.sqrt(dx**2 + dy**2)

    # 5. Drempel voor dakhelling
    tol = 0.25
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
                [float(x_patch[0, 0]), float(y_patch[0, 0]), float(patch[0, 0])],
                [float(x_patch[0, 1]), float(y_patch[0, 1]), float(patch[0, 1])],
                [float(x_patch[1, 1]), float(y_patch[1, 1]), float(patch[1, 1])],
                [float(x_patch[1, 0]), float(y_patch[1, 0]), float(patch[1, 0])]
            ]

            color = 'gold' if magnitude[i, j] > tol else 'lightskyblue'
            faces.append({"vertices": face, "color": color})
            colors.append(color)

    # 6. ❗ Lokale 3D-plot voor debug/controle
    #fig = plt.figure(figsize=(10, 8))
    #ax = fig.add_subplot(111, projection='3d')
    #poly_faces = [f["vertices"] for f in faces]
    #mesh = Poly3DCollection(poly_faces, facecolors=colors, edgecolor='k', linewidths=0.2, alpha=1.0)
    #ax.add_collection3d(mesh)
    #ax.set_title("3D dakmodel met hellende richtingen")
    #ax.set_xlabel("X (m)")
    #ax.set_ylabel("Y (m)")
    #ax.set_zlabel("Hoogte (m)")
    #ax.set_xlim(x_coords[0], x_coords[-1])
    #ax.set_ylim(y_coords[-1], y_coords[0])
    #ax.set_zlim(np.nanmin(elevation), np.nanmax(elevation))
    #plt.tight_layout()
    #plt.show()  # Verwijder dit als je alleen headless API wil

    # 7. JSON terugsturen
    return JSONResponse(content=faces)
