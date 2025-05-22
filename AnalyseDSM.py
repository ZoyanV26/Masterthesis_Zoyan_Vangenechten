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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/dakmodel")
async def dakmodel(request: Request):
    data = await request.json()
    coords_wgs84 = data["polygon"] 

    polygon = Polygon(coords_wgs84)
    gdf = gpd.GeoDataFrame({"geometry": [polygon]}, crs="EPSG:4326")
    gdf = gdf.to_crs("EPSG:31370")
    geojson_geom = [json.loads(gdf.to_json())['features'][0]['geometry']]

    tiff_path = ##zelf in te vullen
    with rasterio.open(tiff_path) as src:
        masked, transform = rasterio.mask.mask(src, geojson_geom, crop=True)
        nodata = src.nodata
        elevation = masked[0]
        elevation = np.where(elevation == nodata, np.nan, elevation)

    rows, cols = elevation.shape
    x_coords = np.arange(cols) * transform[0] + transform[2]
    y_coords = np.arange(rows) * transform[4] + transform[5]
    x_grid, y_grid = np.meshgrid(x_coords, y_coords)

    dx = sobel(elevation, axis=1, mode='nearest')
    dy = sobel(elevation, axis=0, mode='nearest')
    magnitude = np.sqrt(dx**2 + dy**2)

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

    return JSONResponse(content=faces)
