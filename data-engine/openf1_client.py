import requests

BASE_URL = "https://api.openf1.org/v1"

# 2026 Completed Races
SESSIONS_2026 = {
    "australia_race": 11234,
    "china_race": 11245,
}

def get_laps(session_key, driver_number):
    response = requests.get(f"{BASE_URL}/laps", params={
        "session_key": session_key,
        "driver_number": driver_number
    })
    return response.json()

def get_drivers(session_key):
    response = requests.get(f"{BASE_URL}/drivers", params={
        "session_key": session_key
    })
    return response.json()

if __name__ == "__main__":
    print("🇦🇺 Australian GP 2026 — Drivers:")
    drivers = get_drivers(SESSIONS_2026["australia_race"])
    for d in drivers:
        print(f"  #{d['driver_number']} {d['full_name']} — {d['team_name']}")