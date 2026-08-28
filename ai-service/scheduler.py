"""Deterministic, compatibility-aware scheduling primitives."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from compatibility import is_compatible
from metrics import asset_availability_percentage, block_utilization_percentage


def _parse(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _windows(tasks: list[dict[str, Any]], start: datetime, end: datetime) -> list[dict[str, Any]]:
    """Greedy earliest-feasible planner with hard critical-task reporting."""
    blocks: list[dict[str, Any]] = []
    unscheduled: list[dict[str, Any]] = []
    for task in sorted(tasks, key=lambda item: (-float(item.get("priority_score", 0)), -int(item.get("days_overdue", 0)))):
        duration = max(0.25, float(task.get("estimated_duration_hours", task.get("estimated_hours", 2))))
        corridor = task.get("corridor_id", task.get("corridor", "unknown"))
        pinned = next((item for item in tasks if item.get("task_id") == task.get("task_id") and item.get("_pinned_start")), None)
        cursor = _parse(pinned["_pinned_start"]) if pinned else start
        if pinned and pinned.get("_pinned_corridor"):
            corridor = pinned["_pinned_corridor"]
        placed = False
        while cursor + timedelta(hours=duration) <= end:
            candidate_end = _parse(pinned["_pinned_end"]) if pinned and pinned.get("_pinned_end") else cursor + timedelta(hours=duration)
            existing = next((block for block in blocks if block["corridor"] == corridor and
                             cursor < _parse(block["end_time"]) and candidate_end > _parse(block["start_time"])), None)
            if existing:
                compatible = all(is_compatible(task, other)[0] for other in existing.get("task_objects", []))
                if compatible:
                    existing["task_ids"].append(task.get("task_id", task.get("id")))
                    existing["departments"].append(task.get("department"))
                    existing["task_objects"].append(task)
                    placed = True
                    break
                cursor = _parse(existing["end_time"])
                continue
            else:
                blocks.append({
                    "start_time": cursor.isoformat(), "end_time": candidate_end.isoformat(),
                    "corridor": corridor, "duration_hours": duration,
                    "actual_work_hours": duration, "task_ids": [task.get("task_id", task.get("id"))],
                    "departments": [task.get("department")], "task_objects": [task],
                })
                placed = True
                break
        if not placed:
            unscheduled.append({
                "task_id": task.get("task_id", task.get("id")),
                "reason": "insufficient corridor availability in this horizon",
            })
    for block in blocks:
        block.pop("task_objects", None)
        block["utilization_percentage"] = block_utilization_percentage(block)
    critical_unscheduled = [item for item in unscheduled if item["task_id"] in {
        task.get("task_id", task.get("id")) for task in tasks if task.get("is_critical")
    }]
    return {"status": "PARTIAL" if critical_unscheduled else "OPTIMAL", "blocks": blocks,
            "unscheduled_tasks": unscheduled, "critical_unscheduled": critical_unscheduled}


def generate_schedule(payload: dict[str, Any], pinned_assignments: dict[str, Any] | None = None) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    horizon = 7 if payload.get("horizon", "week") == "week" else 30
    tasks = [dict(task) for task in payload.get("tasks", [])]
    proposed = pinned_assignments if pinned_assignments is not None else payload.get("proposedChanges", {})
    changes = {item.get("taskId"): item for item in proposed.get("moves", [])}
    task_lookup = {task.get("task_id"): task for task in tasks}
    for combine in proposed.get("combines", []):
        combine_tasks = [task_lookup.get(task_id) for task_id in combine.get("taskIds", [])]
        if any(task is None for task in combine_tasks):
            raise ValueError("combine references a task that is not pending")
        for index, task in enumerate(combine_tasks):
            for other in combine_tasks[index + 1:]:
                compatible, reason = is_compatible(task, other)
                if not compatible:
                    raise ValueError(f"Incompatible combined tasks {task['task_id']} and {other['task_id']}: {reason}")
            changes[task["task_id"]] = {
                "newStartTime": combine["startTime"], "corridorId": combine["corridorId"],
                "endTime": combine["endTime"],
            }
    for task in tasks:
        change = changes.get(task.get("task_id"))
        if change:
            task["_pinned_start"] = change.get("newStartTime")
            task["_pinned_end"] = change.get("endTime")
            task["_pinned_corridor"] = change.get("corridorId")
    result = _windows(tasks, now, now + timedelta(days=horizon))
    corridors = sorted({block["corridor"] for block in result["blocks"]})
    result["metrics"] = {
        "maintenance_tasks_completed": sum(len(block["task_ids"]) for block in result["blocks"]),
        "separate_block_windows": len(result["blocks"]),
        "track_downtime_hours": round(sum(block["duration_hours"] for block in result["blocks"]), 2),
        "asset_availability": asset_availability_percentage(result["blocks"], horizon * 24, corridors),
    }
    return result
