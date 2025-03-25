from fastapi import FastAPI, Query
import geopandas as gpd
from shapely.geometry import mapping
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS-instellingen om frontend en backend correct met elkaar te laten communiceren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Alle domeinen toegestaan (voor ontwikkeling)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Laad de shapefile (vervang dit met het juiste pad naar je .shp bestand)
shapefile_path = "C:/Users/Zoyan/Documents/Thesis/Programmeren/vs2/shapefiles/testing.shp"
gdf = gpd.read_file(shapefile_path)
if gdf.crs != "EPSG:4326":
    gdf = gdf.to_crs(epsg=4326)
print("📌 Nieuwe CRS na conversie:", gdf.crs)
print("📌 Eerste polygoon na conversie:", gdf.geometry.iloc[0])


@app.get("/")
def home():
    return {"message": "API werkt!"}
@app.get("/zoek_woning")
def zoek_woning(
    postcode: str = Query(..., title="Postcode"),
    gemeente: str = Query(..., title="Gemeente"),
    straat: str = Query(..., title="Straatnaam"),
    huisnummer: str = Query(..., title="Huisnummer")
):
    postcode = int(postcode.strip())
    gemeente = gemeente.strip().lower()
    straat = straat.strip().lower()
    huisnummer = huisnummer.strip()

    gdf["POSTCODE"] = gdf["POSTCODE"].astype(int)
    gdf["GEMEENTE"] = gdf["GEMEENTE"].str.strip().str.lower()
    gdf["STRAATNM"] = gdf["STRAATNM"].str.strip().str.lower()
    gdf["HNRLABEL"] = gdf["HNRLABEL"].astype(str).str.strip()

    woning = gdf.loc[
        (gdf["POSTCODE"] == postcode) &
        (gdf["GEMEENTE"] == gemeente) &
        (gdf["STRAATNM"] == straat) &
        (gdf["HNRLABEL"] == huisnummer)
    ].copy()  # Zorgt ervoor dat de geometrie behouden blijft

    if woning.empty:
        return {"error": "Woning niet gevonden"}

    # Forceer Geopandas om de juiste geometrie te behouden
    woning = gpd.GeoDataFrame(woning, geometry="geometry")

    # Zet de geometrie correct om naar GeoJSON
    woning["geometry"] = woning["geometry"].apply(lambda geom: mapping(geom) if geom and not geom.is_empty else None)

    return woning.to_dict(orient="records")





