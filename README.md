# F1 Car Performance Analyzer 🏎️

A real-time Formula 1 telemetry dashboard built to analyze car performance, driver strategy, and race data using live 2026 season data.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Recharts |
| Backend API | C# .NET 10, ASP.NET Core |
| Data Engine | Python, FastAPI, OpenF1 API |
| Containerization | Docker, Docker Compose |
| Orchestration | Kubernetes |

## Features

- **Lap Time Comparison** — Side-by-side driver lap chart with tyre compound shading
- **Tyre Strategy Analyzer** — Visual stint bars with compound colors and pit stop timing
- **Strategy Rating** — Scores each driver's strategy out of 10 across stint timing, compound choice, and pit speed
- **Car Insights** — Head-to-head telemetry: top speed, RPM, throttle %, braking zones, power unit specs
- **Track Map** — Live GPS telemetry overlay with Speed, Boost, Brake, and Active Aero views
- **Live Data** — Auto-refreshes during race hours using the OpenF1 API

## Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React/TS      │────▶│   C# .NET 10    │────▶│   OpenF1 API    │
│   Frontend      │     │   Backend API   │     │   (Live Data)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                        ┌─────────────────┐              │
                        │  Python FastAPI  │◀─────────────┘
                        │  Data Engine    │
                        └─────────────────┘
```

## Running Locally

### With Docker Compose
```bash
docker compose up
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5282
- Data Engine: http://localhost:8000

### With Kubernetes
```bash
kubectl apply -f k8s/
kubectl get pods
```
- Frontend: http://localhost:30000
- Backend API: http://localhost:30001
- Data Engine: http://localhost:30002

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/f1/sessions?year=2026` | All 2026 season sessions |
| `GET /api/f1/laps?session_key=11234&driver_number=3` | Lap times for a driver |
| `GET /api/f1/stints?session_key=11234&driver_number=3` | Tyre stints |
| `GET /api/f1/pit?session_key=11234&driver_number=3` | Pit stop data |
| `GET /api/f1/compare?session_key=11234&driver1=3&driver2=16` | Head-to-head comparison |

## 2026 F1 Rule Changes Implemented

- DRS replaced by **Manual Override / Overtake Mode** (+0.5MJ within 1s of car ahead)
- **Boost button** — deployable battery power anywhere on track
- **Active Aero** — wings switch between Straight Mode and Corner Mode
- **50/50 power split** — equal ICE and ERS power
- All 11 teams with correct 2026 power unit suppliers

## Data Source

[OpenF1 API](https://openf1.org) — Free, open-source F1 telemetry API with live race data
