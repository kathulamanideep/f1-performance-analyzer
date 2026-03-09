from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="F1 Data Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "https://api.openf1.org/v1"

@app.get("/health")
def health():
    return {"status": "ok", "service": "F1 Data Engine"}

@app.get("/laps")
async def get_laps(session_key: int, driver_number: int):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BASE_URL}/laps?session_key={session_key}&driver_number={driver_number}")
        return r.json()

@app.get("/stints")
async def get_stints(session_key: int, driver_number: int):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BASE_URL}/stints?session_key={session_key}&driver_number={driver_number}")
        return r.json()

@app.get("/telemetry")
async def get_telemetry(session_key: int, driver_number: int):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BASE_URL}/car_data?session_key={session_key}&driver_number={driver_number}")
        return r.json()
