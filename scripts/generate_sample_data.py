"""Generate interaction-driven synthetic railway data for the six ETL inputs."""

from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import random
import uuid

from faker import Faker


SEED = 20260828
random.seed(SEED)
fake = Faker("en_IN")
fake.seed_instance(SEED)

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "backend" / "data"
NOW = datetime.now(timezone.utc).replace(microsecond=0)

CORRIDORS = [
    {"zone": "CR", "division": "Mumbai", "section": "CSMT-Kalyan",
     "stations": ["CSMT", "Byculla", "Dadar", "Kurla", "Thane", "Dombivli", "Kalyan"]},
    {"zone": "NR", "division": "Delhi", "section": "NDLS-GZB",
     "stations": ["NDLS", "Shivaji Bridge", "Tilak Bridge", "Anand Vihar", "Sahibabad", "GZB"]},
    {"zone": "ER", "division": "Howrah", "section": "HWH-BDC",
     "stations": ["HWH", "Liluah", "Belur", "Bally", "Serampore", "Chinsurah", "BDC"]},
    {"zone": "SR", "division": "Chennai", "section": "MAS-AJJ",
     "stations": ["MAS", "Basin Bridge", "Perambur", "Villivakkam", "Ambattur", "Avadi", "AJJ"]},
    {"zone": "SWR", "division": "Bengaluru", "section": "SBC-YPR",
     "stations": ["SBC", "KSR Bengaluru", "Malleswaram", "YPR"]},
]

SEVERITIES = ["low", "medium", "high", "critical"]
WEATHER = ["clear", "rainy", "foggy", "stormy", "humid"]
MANUFACTURERS = ["BHEL", "L&T", "Siemens", "Alstom", "Texmaco", "Medha"]
DEFECT_TYPES = {
    "track": ["rail_fracture", "weld_failure", "sleeper_crack", "ballast_deficiency", "track_alignment_fault"],
    "signal": ["point_failure", "aspect_signal_lamp_out", "track_circuit_fault", "interlocking_error", "cabling_damage"],
    "traction": ["overhead_catenary_sag", "pantograph_damage", "substation_tripped", "isolator_fault", "loco_motor_defect"],
}
DELAY_REASONS = ["Material shortage", "Crew delayed", "Heavy train traffic on line",
                 "Unexpected site conditions", "Bad weather", "Equipment failure at site"]


def iso(value):
    return value.isoformat()


def bounded(value, low, high):
    return max(low, min(high, value))


def make_assets():
    assets = []
    for _ in range(200):
        asset_type = random.choice(["track", "signal", "traction"])
        corridor = random.choice(CORRIDORS)
        design_life = random.randint(20, 40)
        age_years = random.uniform(2, design_life + 7)
        installation = NOW - timedelta(days=age_years * 365.25)
        traffic = random.randint(25, 220)
        age_stressed = age_years / design_life > 0.8
        high_traffic = traffic > 135

        # These branches intentionally model interactions rather than a weighted sum.
        if age_stressed and high_traffic:
            defect_count = random.randint(7, 18)
            failure_count = random.randint(2, 6)
            condition = random.uniform(12, 48)
        elif age_stressed:
            defect_count = random.randint(3, 10)
            failure_count = random.randint(0, 3)
            condition = random.uniform(28, 68)
        elif high_traffic:
            defect_count = random.randint(2, 8)
            failure_count = random.randint(0, 2)
            condition = random.uniform(42, 82)
        else:
            defect_count = random.randint(0, 5)
            failure_count = random.randint(0, 1)
            condition = random.uniform(60, 98)

        if asset_type == "track":
            specification = f"60kg/m UIC rail - {random.choice(['LWR', 'SWR'])}"
        elif asset_type == "signal":
            specification = f"Solid State Interlocking - {random.choice(['EI', 'PI'])}"
        else:
            specification = "25kV AC overhead catenary system"

        criticality = "critical" if age_stressed and high_traffic else random.choice(SEVERITIES)
        assets.append({
            "asset_id": str(uuid.uuid4()),
            "department": {"track": "TMS", "signal": "SMMS", "traction": "TDMS"}[asset_type],
            "asset_type": asset_type,
            "asset_specification": specification,
            "zone": corridor["zone"],
            "division": corridor["division"],
            "section": corridor["section"],
            "station_location": random.choice(corridor["stations"]),
            "location_km": round(random.uniform(0, 180), 2),
            "gauge": "Broad Gauge (1676mm)",
            "manufacturer": random.choice(MANUFACTURERS),
            "installation_date": iso(installation),
            "design_life_years": design_life,
            "last_major_maintenance_date": iso(NOW - timedelta(days=random.randint(30, 700))),
            "last_inspection_date": iso(NOW - timedelta(days=random.randint(1, 60))),
            "criticality": criticality,
            "condition_score": round(bounded(condition + random.uniform(-6, 6), 5, 100), 2),
            "traffic_level": traffic,
            "total_past_defects": defect_count,
            "total_past_failures": failure_count,
            "current_status": "decommissioned" if condition < 18 else ("under_maintenance" if condition < 42 else "active"),
            "replacement_cost_estimate": round(random.uniform(75000, 950000), 2),
        })
    return assets


def make_maintenance(assets):
    records = {"track": [], "traction": [], "signal": []}
    for asset in assets:
        count = random.choices([0, 1, 2], weights=[0.52, 0.36, 0.12])[0]
        for _ in range(count):
            reported = NOW - timedelta(days=random.randint(1, 45), hours=random.randint(0, 23))
            severity = random.choices(SEVERITIES, weights=[30, 40, 23, 7])[0]
            overdue = random.choices([0, random.randint(1, 7), random.randint(8, 25)], weights=[65, 25, 10])[0]
            start = reported + timedelta(days=random.randint(1, 6))
            common = {
                "id": str(uuid.uuid4()), "asset_id": asset["asset_id"], "asset_type": asset["asset_type"],
                "defect_type": random.choice(DEFECT_TYPES[asset["asset_type"]]), "severity": severity,
                "description": f"{severity.title()} {asset['asset_type']} defect detected during inspection.",
                "reported_by": fake.name(), "reported_at": iso(reported), "is_deleted": False,
                "deleted_at": None, "deleted_by": None, "created_by": "sample-data-generator",
                "created_at": iso(reported), "updated_at": iso(NOW), "criticality": asset["criticality"],
                "overdue_days": overdue, "preferred_start_time": iso(start),
                "preferred_end_time": iso(start + timedelta(hours=random.randint(2, 8))),
                "crew_size": random.randint(2, 10),
            }
            if asset["asset_type"] == "track":
                common["location_km"] = asset["location_km"]
                records["track"].append(common)
            elif asset["asset_type"] == "traction":
                common.update(loco_number=f"WAP-{random.randint(30000, 39999)}",
                              loco_type=random.choice(["electric", "diesel"]),
                              depot=f"{asset['division']} Loco Shed")
                common.pop("asset_type")
                records["traction"].append(common)
            else:
                common.update(location_km=asset["location_km"],
                              signal_id=f"SIG-{asset['station_location']}-{random.randint(1, 99)}",
                              signal_type=random.choice(["colour_light", "electric", "LED"]))
                records["signal"].append(common)
    return records


def make_trains():
    trains = []
    for _ in range(300):
        corridor = random.choice(CORRIDORS)
        departure = NOW + timedelta(days=random.randint(-5, 10), minutes=random.randint(0, 1439))
        status = random.choices(["on_time", "delayed", "cancelled"], weights=[82, 15, 3])[0]
        delay = random.randint(10, 180) if status == "delayed" else 0
        trains.append({
            "id": str(uuid.uuid4()), "train_number": str(random.randint(12000, 22999)),
            "from_station": corridor["stations"][0], "to_station": corridor["stations"][-1],
            "departure_time": iso(departure), "arrival_time": iso(departure + timedelta(minutes=random.randint(45, 210))),
            "status": status, "delay_minutes": delay, "section": corridor["section"],
            "created_at": iso(NOW), "updated_at": iso(NOW),
        })
    return trains


def make_history(assets):
    history = []
    for _ in range(300):
        asset = random.choice(assets)
        completed = NOW - timedelta(days=random.randint(1, 365))
        age_ratio = ((completed - datetime.fromisoformat(asset["installation_date"])).days / 365.25) / asset["design_life_years"]
        repeated_defects = asset["total_past_defects"] >= 7
        high_impact = asset["traffic_level"] > 135 and age_ratio > 0.8
        severity = random.choices(SEVERITIES, weights=[28, 40, 24, 8])[0]
        overdue = random.randint(0, 25)
        severe_overdue = severity in ("high", "critical") and overdue > 7

        # Conditional interactions make recurrence risk compound instead of adding independent weights.
        if high_impact and repeated_defects:
            failure_probability = 0.68
        elif age_ratio > 0.8 and repeated_defects:
            failure_probability = 0.48
        elif high_impact:
            failure_probability = 0.24
        elif age_ratio > 0.8 or repeated_defects:
            failure_probability = 0.12
        else:
            failure_probability = 0.025
        failed = random.random() < failure_probability

        if asset["asset_type"] == "track":
            estimated = random.choice([150, 180, 240])
            actual = max(30, int(random.lognormvariate(5.15, 0.35)))
        elif asset["asset_type"] == "signal":
            estimated = random.choice([45, 60, 90])
            actual = max(20, int(random.normalvariate(58, 14)))
        else:
            estimated = random.choice([90, 120, 180])
            actual = max(30, int(random.normalvariate(122, 24)))

        # High severity plus overdue work causes a non-linear operational delay.
        if severe_overdue:
            actual += random.randint(40, 180)
            delayed = random.random() < 0.88
        else:
            delayed = random.random() < (0.15 if overdue == 0 else 0.35)
        variance = actual - estimated
        crew = random.randint(2, 10)
        history.append({
            "asset_id": asset["asset_id"], "task_id": None, "division": asset["division"],
            "completed_date": iso(completed), "estimated_duration_min": estimated,
            "actual_repair_duration_min": actual, "duration_variance_min": variance,
            "was_delayed": delayed, "delay_reason": random.choice(DELAY_REASONS) if delayed else None,
            "did_fail_within_30_days": failed, "days_to_failure": random.randint(1, 30) if failed else None,
            "crew_size_used": crew, "cost_incurred": round(actual * random.uniform(65, 145) + crew * 250, 2),
            "weather_condition": random.choice(WEATHER),
            "remarks": "Recurrence noted within 30 days." if failed else "Repair completed successfully.",
        })
    return history


def write(name, rows):
    (DATA_DIR / name).write_text(json.dumps(rows, indent=2), encoding="utf-8")


if __name__ == "__main__":
    assets = make_assets()
    maintenance = make_maintenance(assets)
    write("core_assets.json", assets)
    write("tms_track_maintenance.json", maintenance["track"])
    write("tdms_traction_maintenance.json", maintenance["traction"])
    write("smms_signalling_maintenance.json", maintenance["signal"])
    write("coa_train_operations.json", make_trains())
    write("planning_maintenance_history.json", make_history(assets))
    print(f"Generated sample data in {DATA_DIR}")
