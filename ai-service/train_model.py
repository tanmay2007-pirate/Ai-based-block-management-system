"""Train risk classification and repair-duration models from Phase 3 JSON data."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import json

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from scoring import FEATURES, NUMERIC_FEATURES


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "backend" / "data"
MODEL_DIR = Path(__file__).resolve().parent / "models"


def _read(name: str) -> list[dict]:
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


def build_training_frame() -> pd.DataFrame:
    assets = pd.DataFrame(_read("core_assets.json"))
    history = pd.DataFrame(_read("planning_maintenance_history.json"))
    defects = pd.concat([
        pd.DataFrame(_read("tms_track_maintenance.json")),
        pd.DataFrame(_read("tdms_traction_maintenance.json")),
        pd.DataFrame(_read("smms_signalling_maintenance.json")),
    ], ignore_index=True)
    defects = defects.sort_values("reported_at").drop_duplicates("asset_id", keep="last")
    frame = history.merge(assets, on="asset_id", suffixes=("_history", "_asset"), how="left")
    frame = frame.merge(defects[["asset_id", "severity", "overdue_days"]], on="asset_id", how="left")
    completed = pd.to_datetime(frame["completed_date"], utc=True)
    installed = pd.to_datetime(frame["installation_date"], utc=True)
    frame["asset_age_years"] = ((completed - installed).dt.total_seconds() / (365.25 * 86400)).clip(lower=0)
    frame["days_overdue"] = frame["overdue_days"].fillna(0)
    frame["severity"] = frame["severity"].fillna(frame["criticality"])
    frame["department"] = frame["department"].fillna("UNKNOWN")
    frame["actual_repair_duration_hours"] = frame["actual_repair_duration_min"] / 60.0
    return frame


def _pipeline(model):
    preprocessor = ColumnTransformer([
        ("numeric", Pipeline([("scale", StandardScaler())]), NUMERIC_FEATURES),
        ("categorical", OneHotEncoder(handle_unknown="ignore"), ["criticality", "severity", "department", "asset_type"]),
    ])
    return Pipeline([("preprocessor", preprocessor), ("model", model)])


def train() -> dict:
    frame = build_training_frame()
    x = frame[FEATURES].copy()
    y_risk = frame["did_fail_within_30_days"].astype(int)
    y_duration = frame["actual_repair_duration_hours"]
    stratify = y_risk if y_risk.value_counts().min() >= 2 else None
    x_train, x_test, y_train, y_test = train_test_split(x, y_risk, test_size=0.25, random_state=42, stratify=stratify)
    duration_train, duration_test, duration_y_train, duration_y_test = train_test_split(
        x, y_duration, test_size=0.25, random_state=42
    )

    baseline = _pipeline(LogisticRegression(max_iter=1000, class_weight="balanced"))
    classifier = _pipeline(RandomForestClassifier(n_estimators=300, random_state=42, class_weight="balanced"))
    regressor = _pipeline(RandomForestRegressor(n_estimators=300, random_state=42, min_samples_leaf=2))
    baseline.fit(x_train, y_train)
    classifier.fit(x_train, y_train)
    regressor.fit(duration_train, duration_y_train)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(classifier, MODEL_DIR / "risk_classifier.joblib")
    joblib.dump(regressor, MODEL_DIR / "duration_regressor.joblib")
    metrics = {
        "validation_note": "Synthetic-environment validation; not real railway accuracy.",
        "baseline_accuracy": round(float(accuracy_score(y_test, baseline.predict(x_test))), 4),
        "ai_accuracy": round(float(accuracy_score(y_test, classifier.predict(x_test))), 4),
        "duration_rmse_hours": round(float(mean_squared_error(duration_y_test, regressor.predict(duration_test)) ** 0.5), 4),
    }
    metadata = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "features": FEATURES,
        "asset_types": sorted(frame["asset_type"].dropna().unique().tolist()),
        "numeric_ranges": {
            key: {"min": float(frame[key].min()), "max": float(frame[key].max())}
            for key in NUMERIC_FEATURES
        },
        "metrics": metrics,
    }
    (MODEL_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))
    return metrics


if __name__ == "__main__":
    train()
