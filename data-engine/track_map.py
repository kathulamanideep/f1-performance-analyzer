import requests
import json

def get_race_telemetry(session_key, driver_number):
    """
    Merge location + car data by closest timestamp
    Returns enriched points with x, y, speed, throttle, brake, rpm
    """
    print(f"Fetching location data for driver {driver_number}...")
    loc = requests.get(f"https://api.openf1.org/v1/location?session_key={session_key}&driver_number={driver_number}").json()
    
    print(f"Fetching car data for driver {driver_number}...")
    car = requests.get(f"https://api.openf1.org/v1/car_data?session_key={session_key}&driver_number={driver_number}").json()

    # Convert timestamps to comparable format
    def parse_time(t):
        return t[:19]  # "2026-03-08T04:30:49"

    # Build car data lookup by timestamp
    car_lookup = {}
    for c in car:
        t = parse_time(c["date"])
        car_lookup[t] = c

    # Merge location with nearest car data
    merged = []
    for l in loc:
        t = parse_time(l["date"])
        car_point = car_lookup.get(t, {})
        
        speed = car_point.get("speed", 0)
        throttle = car_point.get("throttle", 0)
        brake = car_point.get("brake", 0)
        rpm = car_point.get("rpm", 0)

        # Infer boost zone: high throttle + high RPM + speed > 250
        is_boost = throttle >= 98 and rpm > 10000 and speed > 250

        # Infer active aero straight mode: speed > 280, low brake
        is_straight_mode = speed > 280 and brake < 5

        # Infer heavy braking zone
        is_braking = brake > 80

        merged.append({
            "x": l["x"],
            "y": l["y"],
            "speed": speed,
            "throttle": throttle,
            "brake": brake,
            "rpm": rpm,
            "is_boost": is_boost,
            "is_straight_mode": is_straight_mode,
            "is_braking": is_braking,
        })

    return merged

if __name__ == "__main__":
    data = get_race_telemetry(11234, 3)
    
    # Stats
    boost_zones = [d for d in data if d["is_boost"]]
    straight_zones = [d for d in data if d["is_straight_mode"]]
    braking_zones = [d for d in data if d["is_braking"]]
    
    print(f"\nTotal merged points: {len(data)}")
    print(f"Boost zone points:   {len(boost_zones)}")
    print(f"Straight mode points:{len(straight_zones)}")
    print(f"Hard braking points: {len(braking_zones)}")
    
    # Save sample for frontend
    sample = data[::10]  # every 10th point to keep it manageable
    with open("track_data_sample.json", "w") as f:
        json.dump(sample[:500], f)
    print(f"\nSaved 500 sample points to track_data_sample.json")