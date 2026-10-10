"""AstraView orbit service: SGP4 propagation, look angles and pass prediction."""
from __future__ import annotations

from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import geo

app = FastAPI(title="AstraView Orbit Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class Tle(BaseModel):
    name: str = "SATELLITE"
    line1: str
    line2: str


class Station(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    alt_m: float = 0.0


class PositionReq(BaseModel):
    tle: Tle
    time: datetime | None = None


class LookReq(PositionReq):
    station: Station
    frequency_mhz: float = 437.0


class OrbitReq(PositionReq):
    minutes: int = Field(default=100, ge=1, le=1440)
    step_s: int = Field(default=30, ge=1, le=600)


class PassReq(PositionReq):
    station: Station
    hours: float = Field(default=24, gt=0, le=72)
    min_elevation: float = Field(default=5.0, ge=0, le=90)


def _sat(tle: Tle):
    try:
        return geo.make_satrec(tle.line1, tle.line2)
    except geo.PropagationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def _state(sat, when):
    try:
        return geo.propagate(sat, geo.utc(when))
    except geo.PropagationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def _state_dict(st: geo.State) -> dict:
    return {
        "time": st.time.isoformat(),
        "latitude": round(st.lat_deg, 5),
        "longitude": round(st.lon_deg, 5),
        "altitude_km": round(st.alt_km, 3),
        "speed_km_s": round(st.speed_km_s, 4),
        "ecef_km": [round(c, 3) for c in st.ecef_km],
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/v1/position")
def position(req: PositionReq) -> dict:
    return _state_dict(_state(_sat(req.tle), req.time))


@app.post("/v1/look")
def look(req: LookReq) -> dict:
    st = _state(_sat(req.tle), req.time)
    lk = geo.look_angles(st, req.station.lat, req.station.lon, req.station.alt_m)
    return {
        **_state_dict(st),
        "azimuth": round(lk.azimuth_deg, 3),
        "elevation": round(lk.elevation_deg, 3),
        "range_km": round(lk.range_km, 3),
        "range_rate_km_s": round(lk.range_rate_km_s, 4),
        "doppler_hz": round(geo.doppler_shift_hz(req.frequency_mhz, lk.range_rate_km_s), 1),
        "frequency_mhz": req.frequency_mhz,
        "visible": lk.elevation_deg > 0,
    }


@app.post("/v1/orbit")
def orbit(req: OrbitReq) -> dict:
    sat = _sat(req.tle)
    start = geo.utc(req.time)
    track = geo.ground_track(sat, start, req.minutes, req.step_s)
    if not track:
        raise HTTPException(status_code=422, detail="Could not propagate orbit (TLE too old?)")
    return {"points": [_state_dict(s) for s in track]}


@app.post("/v1/passes")
def passes(req: PassReq) -> dict:
    sat = _sat(req.tle)
    start = geo.utc(req.time)
    result = geo.predict_passes(
        sat, req.station.lat, req.station.lon, req.station.alt_m, start, req.hours, req.min_elevation
    )
    return {"passes": result}
