from datetime import date, timedelta

from app.routers import weather


def test_trip_weather_uses_forecast_within_horizon(client, monkeypatch):
    today = date.today()
    start = today + timedelta(days=2)

    async def fake_geocode(http_client, city):
        return {"name": "林芝", "latitude": 29.65, "longitude": 94.36, "admin1": "西藏", "country": "中国"}

    async def fake_fetch(http_client, *, url, lat, lng, start, end):
        assert "forecast" in url
        days = []
        codes = []
        tmax = []
        tmin = []
        pop = []
        precip = []
        d = start
        while d <= end:
            days.append(d.isoformat())
            codes.append(1)
            tmax.append(18.5)
            tmin.append(7.2)
            pop.append(20)
            precip.append(0.0)
            d += timedelta(days=1)
        return {
            day: {
                "weather_code": codes[i],
                "temp_max": tmax[i],
                "temp_min": tmin[i],
                "precipitation_probability": pop[i],
                "precipitation_sum": precip[i],
            }
            for i, day in enumerate(days)
        }

    monkeypatch.setattr(weather, "_geocode_city", fake_geocode)
    monkeypatch.setattr(weather, "_fetch_daily", fake_fetch)

    resp = client.get("/api/weather/trip", params={"city": "林芝", "start_date": start.isoformat(), "days": 7})
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "forecast"
    assert len(data["days"]) == 7
    assert all(item["source"] == "forecast" for item in data["days"])
    assert "非正式" not in data["note"] or "最新预报" in data["note"]


def test_trip_weather_uses_historical_beyond_horizon(client, monkeypatch):
    today = date.today()
    start = today + timedelta(days=40)

    async def fake_geocode(http_client, city):
        return {"name": "大理", "latitude": 25.69, "longitude": 100.16, "admin1": "云南", "country": "中国"}

    async def fake_fetch(http_client, *, url, lat, lng, start, end):
        assert "archive" in url
        out = {}
        d = start
        while d <= end:
            out[d.isoformat()] = {
                "weather_code": 61,
                "temp_max": 22.0,
                "temp_min": 12.0,
                "precipitation_probability": None,
                "precipitation_sum": 3.5,
            }
            d += timedelta(days=1)
        return out

    monkeypatch.setattr(weather, "_geocode_city", fake_geocode)
    monkeypatch.setattr(weather, "_fetch_daily", fake_fetch)

    resp = client.get("/api/weather/trip", params={"city": "大理", "start_date": start.isoformat(), "days": 7})
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "historical"
    assert len(data["days"]) == 7
    assert all(item["source"] == "historical" for item in data["days"])
    assert all(item["reference_date"] for item in data["days"])
    assert "往年同期" in data["note"]
