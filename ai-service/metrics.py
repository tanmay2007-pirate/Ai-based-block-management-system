"""Auditable availability and utilization metrics."""

from __future__ import annotations

from collections import defaultdict
from typing import Any


def asset_availability_percentage(
    blocks: list[dict[str, Any]], horizon_hours: float, corridors: list[str] | None = None
) -> dict[str, Any]:
    """Availability = (corridor-hours minus maintenance-hours) / corridor-hours."""
    names = corridors or sorted({str(block.get("corridor")) for block in blocks})
    if not names:
        return {"network_average": 100.0, "by_corridor": {}}
    consumed = defaultdict(float)
    for block in blocks:
        corridor = str(block.get("corridor"))
        consumed[corridor] += max(0.0, float(block.get("duration_hours", 0)))
    by_corridor = {
        corridor: round(max(0.0, 100.0 * (horizon_hours - consumed[corridor]) / horizon_hours), 2)
        for corridor in names
    }
    return {"network_average": round(sum(by_corridor.values()) / len(by_corridor), 2), "by_corridor": by_corridor}


def block_utilization_percentage(block: dict[str, Any]) -> float:
    duration = float(block.get("duration_hours", 0))
    work = float(block.get("actual_work_hours", duration))
    return round(100.0 * work / duration, 2) if duration > 0 else 0.0
