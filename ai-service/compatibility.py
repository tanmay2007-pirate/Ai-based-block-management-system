"""Safety rules for cross-department maintenance bundling."""

from __future__ import annotations

from typing import Any


def _exclusive(task: dict[str, Any]) -> bool:
    return bool(task.get("requires_exclusive_possession") or task.get("exclusive_equipment"))


def is_compatible(task_a: dict[str, Any], task_b: dict[str, Any]) -> tuple[bool, str]:
    """Return whether two tasks may share a block and explain a rejection."""
    if task_a.get("corridor_id") != task_b.get("corridor_id"):
        return False, "Tasks are on different corridors."
    if task_a.get("physical_access_point") and task_a.get("physical_access_point") == task_b.get("physical_access_point"):
        return False, "Tasks require exclusive access to the same physical access point."
    if _exclusive(task_a) or _exclusive(task_b):
        return False, "At least one task requires exclusive possession of equipment or track."

    departments = {task_a.get("department"), task_b.get("department")}
    if departments == {"TDMS", "TMS"}:
        traction = task_a if task_a.get("department") == "TDMS" else task_b
        other = task_b if traction is task_a else task_a
        isolation = float(traction.get("isolation_duration_hours", 0))
        duration = max(float(traction.get("estimated_duration_hours", 0)), float(other.get("estimated_duration_hours", 0)))
        if isolation < duration:
            return False, "Traction isolation does not cover the full combined work duration."
    elif departments == {"TMS", "SMMS"}:
        return True, "Track and signal work share a corridor without a conflicting access point."
    elif len(departments) > 1:
        return False, "No approved compatibility rule exists for these departments."
    return True, "Tasks are compatible for the same block."
