"""Orbit maths: SGP4 propagation, frame conversions and look angles."""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sgp4.api import Satrec, jday
from sgp4.propagation import gstime

WGS84_A = 6378.137  # km
WGS84_F = 1 / 298.257223563
WGS84_E2 = WGS84_F * (2 - WGS84_F)
OMEGA_EARTH = 7.2921150e-5  # rad/s
C_KM_S = 299792.458


class PropagationError(ValueError):
    pass


@dataclass
class State:
    time: datetime
    ecef_km: tuple[float, float, float]
    vel_ecef_km_s: tuple[float, float, float]
    lat_deg: float
    lon_deg: float
    alt_km: float
    speed_km_s: float


@dataclass
class Look:
    azimuth_deg: float
    elevation_deg: float
    range_km: float
    range_rate_km_s: float


def utc(dt: datetime | None = None) -> datetime:
    if dt is None:
        return datetime.now(timezone.utc)
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def make_satrec(line1: str, line2: str) -> Satrec:
    try:
        return Satrec.twoline2rv(line1.strip(), line2.strip())
    except Exception as exc:  # noqa: BLE001 - library raises various errors
        raise PropagationError(f"Invalid TLE: {exc}") from exc


def _jd(t: datetime) -> tuple[float, float]:
    return jday(t.year, t.month, t.day, t.hour, t.minute, t.second + t.microsecond / 1e6)


def geodetic_from_ecef(x: float, y: float, z: float) -> tuple[float, float, float]:
    lon = math.atan2(y, x)
    p = math.hypot(x, y)
    lat = math.atan2(z, p * (1 - WGS84_E2))
    alt = 0.0
    for _ in range(6):
        n = WGS84_A / math.sqrt(1 - WGS84_E2 * math.sin(lat) ** 2)
        alt = p / math.cos(lat) - n if abs(math.cos(lat)) > 1e-9 else abs(z) / math.sin(lat) - n * (1 - WGS84_E2)
        lat = math.atan2(z, p * (1 - WGS84_E2 * n / (n + alt)))
    return math.degrees(lat), math.degrees(lon), alt


def ecef_from_geodetic(lat_deg: float, lon_deg: float, alt_km: float) -> tuple[float, float, float]:
    lat, lon = math.radians(lat_deg), math.radians(lon_deg)
    n = WGS84_A / math.sqrt(1 - WGS84_E2 * math.sin(lat) ** 2)
    return (
        (n + alt_km) * math.cos(lat) * math.cos(lon),
        (n + alt_km) * math.cos(lat) * math.sin(lon),
        (n * (1 - WGS84_E2) + alt_km) * math.sin(lat),
    )


def propagate(sat: Satrec, t: datetime) -> State:
    t = utc(t)
    jd, fr = _jd(t)
    err, r, v = sat.sgp4(jd, fr)
    if err != 0:
        raise PropagationError(f"SGP4 error code {err} (TLE may be too old or invalid)")
    theta = gstime(jd + fr)
    c, s = math.cos(theta), math.sin(theta)
    x = c * r[0] + s * r[1]
    y = -s * r[0] + c * r[1]
    z = r[2]
    vx = c * v[0] + s * v[1]
    vy = -s * v[0] + c * v[1]
    vz = v[2]
    # velocity relative to the rotating Earth
    vx += OMEGA_EARTH * y
    vy -= OMEGA_EARTH * x
    lat, lon, alt = geodetic_from_ecef(x, y, z)
    return State(t, (x, y, z), (vx, vy, vz), lat, lon, alt, math.sqrt(vx * vx + vy * vy + vz * vz))


def look_angles(state: State, lat_deg: float, lon_deg: float, alt_m: float) -> Look:
    ox, oy, oz = ecef_from_geodetic(lat_deg, lon_deg, alt_m / 1000.0)
    dx, dy, dz = (state.ecef_km[0] - ox, state.ecef_km[1] - oy, state.ecef_km[2] - oz)
    lat, lon = math.radians(lat_deg), math.radians(lon_deg)
    sl, cl, so, co = math.sin(lat), math.cos(lat), math.sin(lon), math.cos(lon)
    east = -so * dx + co * dy
    north = -sl * co * dx - sl * so * dy + cl * dz
    up = cl * co * dx + cl * so * dy + sl * dz
    rng = math.sqrt(dx * dx + dy * dy + dz * dz)
    az = math.degrees(math.atan2(east, north)) % 360.0
    el = math.degrees(math.asin(max(-1.0, min(1.0, up / rng))))
    vx, vy, vz = state.vel_ecef_km_s
    rr = (dx * vx + dy * vy + dz * vz) / rng
    return Look(az, el, rng, rr)


def doppler_shift_hz(frequency_mhz: float, range_rate_km_s: float) -> float:
    """Shift of the received frequency (Hz). Positive while approaching."""
    return -frequency_mhz * 1e6 * range_rate_km_s / C_KM_S


def ground_track(sat: Satrec, start: datetime, minutes: int, step_s: int) -> list[State]:
    out: list[State] = []
    n = max(1, int(minutes * 60 / step_s))
    for i in range(n + 1):
        try:
            out.append(propagate(sat, start + timedelta(seconds=i * step_s)))
        except PropagationError:
            break
    return out


def predict_passes(
    sat: Satrec,
    lat_deg: float,
    lon_deg: float,
    alt_m: float,
    start: datetime,
    hours: float,
    min_elevation: float,
    step_s: int = 10,
    path_step_s: int = 30,
) -> list[dict]:
    passes: list[dict] = []
    total = int(hours * 3600 / step_s)
    cur: dict | None = None
    prev_t = start
    for i in range(total + 1):
        t = start + timedelta(seconds=i * step_s)
        try:
            lk = look_angles(propagate(sat, t), lat_deg, lon_deg, alt_m)
        except PropagationError:
            break
        if lk.elevation_deg > 0:
            if cur is None:
                cur = {"aos": prev_t if i > 0 else t, "aos_az": lk.azimuth_deg, "max_el": -90.0, "path": [], "last": t}
            if lk.elevation_deg > cur["max_el"]:
                cur["max_el"] = lk.elevation_deg
                cur["max_t"] = t
                cur["max_az"] = lk.azimuth_deg
            if (t - cur["aos"]).total_seconds() % path_step_s < step_s:
                cur["path"].append({"time": t.isoformat(), "azimuth": round(lk.azimuth_deg, 2), "elevation": round(lk.elevation_deg, 2)})
            cur["last"], cur["los_az"] = t, lk.azimuth_deg
        elif cur is not None:
            passes.append(_finish(cur))
            cur = None
        prev_t = t
    if cur is not None:
        passes.append(_finish(cur))
    return [p for p in passes if p["max_elevation"] >= min_elevation]


def _finish(cur: dict) -> dict:
    return {
        "aos": cur["aos"].isoformat(),
        "los": cur["last"].isoformat(),
        "max_time": cur["max_t"].isoformat(),
        "duration_s": int((cur["last"] - cur["aos"]).total_seconds()),
        "max_elevation": round(cur["max_el"], 2),
        "aos_azimuth": round(cur["aos_az"], 2),
        "los_azimuth": round(cur["los_az"], 2),
        "max_azimuth": round(cur["max_az"], 2),
        "path": cur["path"],
    }
