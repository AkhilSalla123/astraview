# AstraView

**Real-Time Satellite Tracking & Antenna Monitoring System**

A full-stack aerospace application that retrieves real satellite orbital data, calculates satellite positions and visibility, predicts ground-station passes, and visualizes tracking information.

Built with React, CesiumJS, Java Spring Boot, MongoDB and a Python SGP4 orbit service.

## Features

- **Real orbital data:** downloads TLEs by NORAD ID from N2YO (with your API key) or CelesTrak (no key needed) and stores them in MongoDB.
- **Live position:** latitude, longitude, altitude and speed, updated every 2 seconds on a 3D CesiumJS globe, with the path of the next orbit.
- **Ground stations:** create, edit and delete stations with latitude, longitude, altitude and an elevation mask.
- **Look angles:** azimuth, elevation, range, range rate and Doppler shift for a chosen receiver frequency.
- **Pass prediction:** next 24 hours of passes with rise/set time, duration, maximum elevation and rise/set azimuth.
- **Sky plot:** polar plot of the selected pass, with live commanded and actual antenna positions.
- **Antenna monitor (simulated):** a rotator that slews at a limited rate towards the satellite, with tracking state (parked, stowing, slewing, tracking, locked), pointing error, received power, SNR and alerts.
- **Tracking history:** samples saved to MongoDB while a satellite is in view, with CSV export.

## Architecture

```
React + CesiumJS  --REST-->  Spring Boot API  --REST-->  Python orbit service (SGP4)
   (port 5173)                 (port 8080)                  (port 8000)
                                   |
                               MongoDB (27017)
```

| Part | Folder | Role |
|---|---|---|
| Frontend | `astraview-frontend` | UI, globe, sky plot, panels |
| Backend | `astraview-backend` | REST API, TLE download, MongoDB persistence, antenna simulation |
| Orbit service | `orbit-service` | SGP4 propagation, look angles, Doppler, pass prediction |

## Quick start (Docker)

```bash
cp .env.example .env        # optional: add N2YO_API_KEY
docker compose up --build
```

Open http://localhost:3000.

## Run each part locally

You need Java 17+, Maven, Node 20+, Python 3.11+ and MongoDB (local or Atlas).

```bash
# 1. MongoDB (local)
docker run -d -p 27017:27017 --name astraview-mongo mongo:7

# 2. Orbit service
cd orbit-service
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest -q
uvicorn app.main:app --port 8000

# 3. Backend
cd astraview-backend
mvn spring-boot:run

# 4. Frontend
cd astraview-frontend
cp .env.example .env
npm install
npm run dev                  # http://localhost:5173
```

### Configuration

Set these as environment variables (never commit them):

| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/astraview` | Local MongoDB or your Atlas URI |
| `ORBIT_SERVICE_URL` | `http://localhost:8000` | Python orbit service |
| `N2YO_API_KEY` | empty | Use N2YO as the TLE source instead of CelesTrak |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed frontend origins |
| `VITE_API_URL` (frontend) | `http://localhost:8080/api` | Backend base URL |

Antenna simulation settings (slew rate, beamwidth, gain, transmit power, noise floor) are in `astraview-backend/src/main/resources/application.properties`.

## First use

1. Open the app. A demo ground station is created automatically. Click **Edit** and enter your own coordinates.
2. In **Satellites**, add a NORAD ID (for example `25544` for the ISS) or click a quick-add chip.
3. Watch the globe and the antenna monitor. Open **Passes** for upcoming passes and click one to see it on the sky plot.

## REST API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/satellites` | Saved satellites |
| POST | `/api/satellites/fetch/{noradId}` | Download and save the latest TLE |
| POST | `/api/satellites/refresh` | Update all saved TLEs |
| DELETE | `/api/satellites/{noradId}` | Remove a satellite |
| GET/POST/PUT/DELETE | `/api/stations[/{id}]` | Manage ground stations |
| GET | `/api/tracking/position/{noradId}` | Sub-satellite point |
| GET | `/api/tracking/orbit/{noradId}?minutes=100&step=30` | Orbit samples |
| GET | `/api/tracking/look/{noradId}?stationId=&frequencyMhz=` | Az/el/range/Doppler |
| GET | `/api/tracking/passes/{noradId}?stationId=&hours=24&minElevation=5` | Pass predictions |
| GET | `/api/antenna/{stationId}/{noradId}/status` | Simulated antenna status |
| GET | `/api/history`, `/api/history/export.csv` | Tracking history |

The orbit service exposes `/v1/position`, `/v1/look`, `/v1/orbit` and `/v1/passes` (interactive docs at http://localhost:8000/docs).

## Notes and limits

- TLEs go stale. Positions are accurate for a few days from the TLE epoch, so use **Update TLEs** regularly. The backend re-downloads a TLE automatically when it is older than 3 days.
- The antenna and signal values come from a simplified simulation (slew-rate limit and a basic link budget). They are not real hardware telemetry.
- A pass already in progress when you open the app is reported from the current time, so its maximum elevation may be partial.
- Check the current N2YO and CelesTrak usage limits before heavy use.

## Ideas for next steps

Login (JWT), a WebSocket stream instead of polling, real rotator control over Hamlib `rotctld`, satellite visibility with sun/eclipse calculation, and a multi-satellite dashboard.

## Acknowledgements

The overall idea (Spring Boot + MongoDB + React + CesiumJS satellite visualizer) was inspired by [ClaireW004/satellite-visualizer](https://github.com/ClaireW004/satellite-visualizer). AstraView is an independent implementation and shares no code with it.

## License

MIT, see `LICENSE`.
