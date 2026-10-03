import pytest
from fastapi.testclient import TestClient

from app.main import app

SAMPLE = {"Age": 21, "Avg_Daily_Usage_Hours": 4.0, "Daily_Unlocks": 55, "Study_Hours": 3.0, "Sleep_Hours_Per_Night": 7.0,
          "Physical_Activity_Hours": 1.0, "Stress_Level": "Medium", "Gender": "Male", "Academic_Level": "Undergraduate",
          "Most_Used_Platform": "Instagram", "Purpose_Of_Use": "Entertainment", "Country": "India"}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_predict_matches_notebook_example(client):
    body = client.post("/api/predict", json=SAMPLE).json()
    assert abs(body["score"] - 7.271) < 0.01
    assert body["low"] <= body["score"] <= body["high"]


def test_rejects_impossible_day(client):
    assert client.post("/api/predict", json={**SAMPLE, "Study_Hours": 18, "Avg_Daily_Usage_Hours": 10}).status_code == 422


def test_unknown_country(client):
    assert client.post("/api/predict", json={**SAMPLE, "Country": "Atlantis"}).status_code == 422


def test_overview_filters(client):
    all_rows = client.get("/api/analysis/overview").json()["kpis"]["rows"]
    male = client.get("/api/analysis/overview?gender=Male").json()["kpis"]["rows"]
    assert 0 < male < all_rows


def test_models(client):
    data = client.get("/api/models").json()
    assert set(data["models"]) == {"linear_regression", "random_forest", "extra_trees"}
    assert client.get("/api/models/nope").status_code == 404


@pytest.mark.parametrize("level", ["High School", "Undergraduate", "Graduate"])
@pytest.mark.parametrize("gender", ["Male", "Female", None])
def test_every_filter_combination_is_serialisable(client, level, gender):
    qs = f"academic_level={level}" + (f"&gender={gender}" if gender else "")
    body = client.get(f"/api/analysis/overview?{qs}").json()
    assert len(body["target_corr"]) == 6


def test_constant_column_is_reported_not_crashing(client):
    # every High School student is 18 -> Age has zero variance -> undefined correlation
    body = client.get("/api/analysis/overview?academic_level=High School").json()
    assert "Age" in body["constant_features"]
    assert [c["value"] for c in body["target_corr"] if c["label"] == "Age"] == [None]
