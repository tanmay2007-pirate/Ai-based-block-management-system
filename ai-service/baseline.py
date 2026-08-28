"""Fair independent-department baseline for before/after comparisons."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from metrics import asset_availability_percentage


def run_baseline(tasks: list[dict[str, Any]], horizon_days: int = 7) -> dict[str, Any]:
    """Schedule departments independently by overdue days, earliest feasible window."""
    start = datetime.now(timezone.utc)
    end = start + timedelta(days=horizon_days)
    blocks: list[dict[str, Any]] = []
    for task in sorted(tasks, key=lambda item: int(item.get("days_overdue", 0)), reverse=True):
        duration = max(0.25, float(task.get("estimated_duration_hours", 2)))
        corridor = task.get("corridor_id", task.get("corridor", "unknown"))
        cursor = start
        while cursor + timedelta(hours=duration) <= end:
            clash = next((block for block in blocks if block["corridor"] == corridor and
                          cursor < datetime.fromisoformat(block["end_time"]) and
                          cursor + timedelta(hours=duration) > datetime.fromisoformat(block["start_time"])), None)
            if not clash:
                blocks.append({
                    "start_time": cursor.isoformat(), "end_time": (cursor + timedelta(hours=duration)).isoformat(),
                    "corridor": corridor, "duration_hours": duration, "actual_work_hours": duration,
                    "task_ids": [task.get("task_id", task.get("id"))],
                    "departments": [task.get("department")],
                })
                break
            cursor = datetime.fromisoformat(clash["end_time"])
        else:
            continue
    corridors = sorted({block["corridor"] for block in blocks})
    return {
        "method": "independent_departments_by_overdue",
        "blocks": blocks,
        "maintenance_tasks_completed": sum(len(b["task_ids"]) for b in blocks),
        "separate_block_windows": len(blocks),
        "track_downtime_hours": round(sum(b["duration_hours"] for b in blocks), 2),
        "asset_availability": asset_availability_percentage(blocks, horizon_days * 24, corridors),
    }


def compare_schedules(tasks: list[dict[str, Any]], horizon_days: int = 7) -> dict[str, Any]:
    from scheduler import generate_schedule
    baseline = run_baseline(tasks, horizon_days)
    ai = generate_schedule({"tasks": tasks, "horizon": "week" if horizon_days == 7 else "month"})
    return {"baseline": baseline, "ai_coordinated": ai}
