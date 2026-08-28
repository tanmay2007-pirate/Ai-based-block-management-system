"""Model loading and transparent, cold-start-safe task scoring."""

from __future__ import annotations

from pathlib import Path
from typing import Any
import json

import joblib
import pandas as pd
import shap


SERVICE_DIR = Path(__file__).resolve().parent
MODEL_DIR = SERVICE_DIR / "models"
FEATURES = [
    "asset_age_years",
    "criticality",
    "total_past_defects",
    "traffic_level",
    "severity",
    "days_overdue",
    "department",
    "asset_type",
]
NUMERIC_FEATURES = ["asset_age_years", "total_past_defects", "traffic_level", "days_overdue"]
CRITICALITY_SCORE = {"low": 25.0, "medium": 50.0, "high": 75.0, "critical": 100.0}
SEVERITY_SCORE = CRITICALITY_SCORE


def _load_artifact(name: str) -> Any:
    path = MODEL_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"Model artifact is missing: {path}. Run train_model.py first.")
    return joblib.load(path)


def load_artifacts() -> dict[str, Any]:
    metadata_path = MODEL_DIR / "metadata.json"
    if not metadata_path.exists():
        raise FileNotFoundError(f"Training metadata is missing: {metadata_path}. Run train_model.py first.")
    return {
        "classifier": _load_artifact("risk_classifier.joblib"),
        "duration_regressor": _load_artifact("duration_regressor.joblib"),
        "metadata": json.loads(metadata_path.read_text(encoding="utf-8")),
    }


def _frame(features: dict[str, Any]) -> pd.DataFrame:
    values = {key: features.get(key, 0 if key in NUMERIC_FEATURES else "medium") for key in FEATURES}
    return pd.DataFrame([values], columns=FEATURES)


def _baseline(features: dict[str, Any]) -> tuple[float, dict[str, float]]:
    risk = SEVERITY_SCORE.get(str(features.get("severity", "medium")).lower(), 50.0)
    urgency = min(float(features.get("days_overdue", 0)) / 30.0 * 100.0, 100.0)
    overdue = urgency
    criticality = CRITICALITY_SCORE.get(str(features.get("criticality", "medium")).lower(), 50.0)
    traffic = min(float(features.get("traffic_level", 0)) / 220.0 * 100.0, 100.0)
    score = risk * 0.30 + urgency * 0.25 + overdue * 0.20 + criticality * 0.15 + traffic * 0.10
    return round(min(score, 100.0), 2), {
        "risk": round(risk, 2), "urgency": round(urgency, 2),
        "overdue": round(overdue, 2), "criticality": round(criticality, 2),
        "operational_impact": round(traffic, 2),
    }


def _confidence(features: dict[str, Any], metadata: dict[str, Any]) -> tuple[str, str | None]:
    known_types = metadata.get("asset_types", [])
    if features.get("asset_type") not in known_types:
        return "LOW_CONFIDENCE", "Limited history for this asset type; using transparent baseline scoring."
    for key in NUMERIC_FEATURES:
        value = float(features.get(key, 0))
        bounds = metadata["numeric_ranges"].get(key)
        if bounds and (value < bounds["min"] or value > bounds["max"]):
            return "LOW_CONFIDENCE", f"{key} is outside the training range; using transparent baseline scoring."
    return "HIGH_CONFIDENCE", None


def compute_priority(features: dict[str, Any], artifacts: dict[str, Any] | None = None) -> dict[str, Any]:
    artifacts = artifacts or load_artifacts()
    confidence, reason = _confidence(features, artifacts["metadata"])
    baseline_score, baseline_components = _baseline(features)
    row = _frame(features)

    if confidence == "LOW_CONFIDENCE":
        return {
            "priority_score": baseline_score,
            "risk_probability": None,
            "predicted_repair_duration_hours": None,
            "confidence": confidence,
            "confidence_reason": reason,
            "scoring_method": "transparent_baseline",
            "baseline_components": baseline_components,
        }

    risk_probability = float(artifacts["classifier"].predict_proba(row)[0, 1])
    duration_hours = max(0.25, float(artifacts["duration_regressor"].predict(row)[0]))
    risk_score = risk_probability * 100.0
    overdue_score = min(float(features.get("days_overdue", 0)) / 30.0 * 100.0, 100.0)
    criticality_score = CRITICALITY_SCORE.get(str(features.get("criticality", "medium")).lower(), 50.0)
    priority = risk_score * 0.50 + overdue_score * 0.25 + criticality_score * 0.25
    return {
        "priority_score": round(min(priority, 100.0), 2),
        "risk_probability": round(risk_probability, 4),
        "predicted_repair_duration_hours": round(duration_hours, 3),
        "confidence": confidence,
        "confidence_reason": reason,
        "scoring_method": "trained_model",
    }


def explain_priority(features: dict[str, Any], artifacts: dict[str, Any] | None = None) -> dict[str, Any]:
    """Return real tree-model contributions, with transparent fallback for cold starts."""
    artifacts = artifacts or load_artifacts()
    result = compute_priority(features, artifacts)
    if result["confidence"] == "LOW_CONFIDENCE":
        return {"result": result, "method": "transparent_fallback", "shap_values": None}
    try:
        pipeline = artifacts["classifier"]
        transformed = pipeline.named_steps["preprocessor"].transform(_frame(features))
        model = pipeline.named_steps["model"]
        values = shap.TreeExplainer(model)(transformed).values
        if values.ndim == 3:
            values = values[0, :, 1]
        elif values.ndim == 2:
            values = values[0]
        names = pipeline.named_steps["preprocessor"].get_feature_names_out()
        contributions = {name: round(float(value), 6) for name, value in zip(names, values)}
        ranked = sorted(contributions.items(), key=lambda item: abs(item[1]), reverse=True)
        return {"result": result, "method": "shap_tree_explainer", "shap_values": dict(ranked)}
    except (ValueError, TypeError, RuntimeError, AttributeError, IndexError) as exc:
        return {"result": result, "method": "transparent_fallback", "shap_values": None, "fallback_reason": str(exc)}
