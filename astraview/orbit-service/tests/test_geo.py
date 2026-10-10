import math
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app import geo
from app.main import app

L1 = "1 25544U 98067A   19343.69339541  .00001764  00000-0  38792-4 0  9991"
L2 = "2 25544  51.6439 211.2001 0007417  17.6667  85.6398 15.50103472202482"
T0 = datetime(2019, 12, 9, 16, 38, 29, tzinfo=timezone.utc)  # close to TLE epoch
client = TestClient(app)
TLE = {"name": "ISS", "line1": L1, "line2": L2}


def test_iss_altitude_and_inclination():
    sat = geo.make_satrec(L1, L2)
    st = geo.propagate(sat, T0)
    assert 400 < st.alt_km < 440
    assert abs(st.lat_deg) <= 51.7
    assert 7.2 < st.speed_km_s < 7.8  # Earth-fixed speed (inertial is ~7.66)


def test_geodetic_roundtrip():
    x, y, z = geo.ecef_from_geodetic(51.4769, -0.0005, 0.5)
    lat, lon, alt = geo.geodetic_from_ecef(x, y, z)
    assert math.isclose(lat, 51.4769, abs_tol=1e-6)
    assert math.isclose(lon, -0.0005, abs_tol=1e-6)
    assert math.isclose(alt, 0.5, abs_tol=1e-6)


def test_look_directly_below_is_zenith():
    sat = geo.make_satrec(L1, L2)
    st = geo.propagate(sat, T0)
    lk = geo.look_angles(st, st.lat_deg, st.lon_deg, 0)
    assert lk.elevation_deg > 89.0
    assert math.isclose(lk.range_km, st.alt_km, rel_tol=0.01)


def test_passes_are_ordered_and_valid():
    sat = geo.make_satrec(L1, L2)
    ps = geo.predict_passes(sat, 51.4769, -0.0005, 50, T0, 24, 5)
    assert len(ps) >= 1
    for p in ps:
        assert p["max_elevation"] >= 5
        assert p["duration_s"] > 0
        assert p["aos"] < p["los"]


def test_doppler_sign():
    assert geo.doppler_shift_hz(437.0, -5.0) > 0  # approaching


def test_api_look():
    r = client.post("/v1/look", json={"tle": TLE, "time": T0.isoformat(), "station": {"lat": 51.4769, "lon": -0.0005, "alt_m": 50}})
    assert r.status_code == 200
    body = r.json()
    assert 0 <= body["azimuth"] < 360 and body["range_km"] > 400


def test_api_orbit_and_bad_tle():
    r = client.post("/v1/orbit", json={"tle": TLE, "time": T0.isoformat(), "minutes": 95, "step_s": 60})
    assert r.status_code == 200 and len(r.json()["points"]) > 90
    bad = client.post("/v1/position", json={"tle": {"line1": "x", "line2": "y"}})
    assert bad.status_code == 422
