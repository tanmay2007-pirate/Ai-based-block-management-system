"""FastAPI API for scoring, explainability, and schedule generation."""

import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from scheduler import generate_schedule
from scoring import compute_priority, compute_priority_batch, explain_priority


app = FastAPI(title="Railway AI Service", version="1.0.0")
_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000,http://localhost:5173,http://127.0.0.1:5000,http://127.0.0.1:5173").split(",")
app.add_middleware(CORSMiddleware, allow_origins=_origins,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


class Defect(BaseModel):
    severity: str = "medium"
    days_overdue: float = 0
    asset_criticality: str = "medium"
    criticality: str | None = None
    corridor_traffic: float = 0
    traffic_level: float | None = None
    department: str = "TMS"
    asset_type: str = "track"
    asset_age_years: float = 0
    total_past_defects: float = 0


class ProposedMove(BaseModel):
    taskId: str
    newStartTime: str
    corridorId: str


class ProposedCombine(BaseModel):
    taskIds: list[str] = Field(min_length=2)
    corridorId: str
    startTime: str
    endTime: str


class ProposedChanges(BaseModel):
    moves: list[ProposedMove] = Field(default_factory=list)
    combines: list[ProposedCombine] = Field(default_factory=list)


class ScheduleRequest(BaseModel):
    horizon: str = Field(default="week", pattern="^(week|month)$")
    tasks: list[dict[str, Any]] = []
    proposedChanges: ProposedChanges = Field(default_factory=ProposedChanges)


def _features(defect: Defect) -> dict[str, Any]:
    return {
        "severity": defect.severity, "days_overdue": defect.days_overdue,
        "criticality": defect.criticality or defect.asset_criticality,
        "traffic_level": defect.traffic_level if defect.traffic_level is not None else defect.corridor_traffic,
        "department": defect.department, "asset_type": defect.asset_type,
        "asset_age_years": defect.asset_age_years, "total_past_defects": defect.total_past_defects,
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/score-defect")
def score_defect(defect: Defect) -> dict[str, Any]:
    return compute_priority(_features(defect))


@app.post("/score-batch")
def score_batch(defects: list[Defect]) -> list[dict[str, Any]]:
    features_list = [_features(defect) for defect in defects]
    return compute_priority_batch(features_list)


@app.post("/explain-score")
def explain_score(defect: Defect) -> dict[str, Any]:
    features = _features(defect)
    explanation = explain_priority(features)
    result = explanation["result"]
    reasons = []
    if explanation["shap_values"]:
        reasons = [name.split("__")[-1] for name, value in list(explanation["shap_values"].items())[:3] if value > 0]
    if not reasons:
        if defect.severity in ("high", "critical"):
            reasons.append(f"{defect.severity} severity")
        if defect.days_overdue > 0:
            reasons.append(f"overdue by {defect.days_overdue:g} days")
        if (defect.traffic_level if defect.traffic_level is not None else defect.corridor_traffic) > 135:
            reasons.append("high-traffic corridor")
    return {"score": result, "feature_contributions": reasons,
            "explanation": "High priority because: " + ", ".join(reasons) if reasons else "Priority is based on model outputs and operational context.",
            "explanation_method": explanation["method"], "shap_values": explanation["shap_values"]}


@app.post("/generate-schedule")
def generate_schedule_endpoint(request: ScheduleRequest) -> dict[str, Any]:
    try:
        return generate_schedule(request.model_dump(), request.proposedChanges.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
