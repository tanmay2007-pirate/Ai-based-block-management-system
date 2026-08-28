# Reproducible baseline

The baseline schedules each department independently. It sorts only by
`days_overdue` (descending), does not use risk prediction, does not bundle
departments, and assigns each task to the earliest feasible window on its
corridor. Comparisons must use the same tasks and horizon as the coordinated
planner and report downtime, separate windows, completed tasks, and asset
availability together.
