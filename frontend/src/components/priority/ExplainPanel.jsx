import { useEffect, useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import api from '../../services/api';

function scoreValue(data) {
  return Number(
    data?.priority_score ??
    data?.priorityScore ??
    data?.score ??
    data?.task?.priority_score ??
    0
  );
}

function getPriority(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  return 'MEDIUM';
}

function Metric({ label, value, description }) {
  return (
    <div className="explain-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {description && <small>{description}</small>}
    </div>
  );
}

function Factor({ number, title, text, value }) {
  return (
    <div className="explain-factor">
      <div className="explain-factor-number">{number}</div>

      <div className="explain-factor-copy">
        <div>
          <strong>{title}</strong>
          {value && <span>{value}</span>}
        </div>

        <p>{text}</p>
      </div>
    </div>
  );
}

export default function ExplainPanel() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    api
      .get(`/tasks/${id}/explain`)
      .then(response => setData(response.data))
      .catch(() => setData({ error: 'Explanation unavailable' }))
      .finally(() => setLoading(false));
  }, [id]);

  const task = data?.task || data || {};

  const score = useMemo(() => scoreValue(data), [data]);
  const priority = getPriority(score);

  const taskName =
    task.description ||
    task.location ||
    data?.description ||
    'Maintenance task';

  const department =
    task.department ||
    data?.department ||
    'Engineering';

  if (!id) return null;

  if (loading) {
    return (
      <div className="explain-page">
        <div className="explain-loading">
          <div className="loading-ring" />
          <strong>Analysing maintenance priority…</strong>
          <span>AI decision engine is evaluating operational factors</span>
        </div>
      </div>
    );
  }

  if (data?.error) {
    return (
      <div className="explain-page">
        <div className="explain-error">
          <div>!</div>
          <strong>AI explanation unavailable</strong>
          <span>Unable to retrieve the explanation for this task.</span>
          <NavLink to="/priority-list">← Back to priority queue</NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="explain-page">

      {/* HEADER */}
      <div className="explain-header">

        <div>
          <span className="eyebrow">AI DECISION SUPPORT</span>

          <h1>Priority rationale</h1>

          <p>
            Operational reasoning behind the maintenance priority assigned
            to this task.
          </p>
        </div>

        <NavLink className="explain-back" to="/priority-list">
          ← Priority queue
        </NavLink>

      </div>

      {/* MAIN GRID */}
      <div className="explain-grid">

        {/* LEFT COLUMN */}
        <div className="explain-main">

          <div className="panel explain-task-card">

            <div className="explain-task-top">

              <div className="explain-task-icon">
                AI
              </div>

              <div>
                <span className="eyebrow">MAINTENANCE TASK</span>

                <h2>{taskName}</h2>

                <div className="explain-task-meta">
                  <span>{department}</span>
                  <span>Task {String(id).slice(0, 10)}</span>
                </div>
              </div>

              <span className={`explain-priority ${priority.toLowerCase()}`}>
                <i />
                {priority}
              </span>

            </div>

            <div className="explain-score">

              <div>
                <span>AI PRIORITY SCORE</span>
                <strong>{Math.round(score)}%</strong>
              </div>

              <div className="explain-score-bar">
                <span
                  style={{
                    width: `${Math.min(Math.max(score, 0), 100)}%`
                  }}
                />
              </div>

              <small>
                Confidence based on available maintenance and operational data
              </small>

            </div>

          </div>

          {/* WHY */}
          <div className="panel explain-section">

            <div className="explain-section-heading">
              <div>
                <span className="eyebrow">AI ANALYSIS</span>
                <h2>Why this task is prioritized</h2>
              </div>

              <span className="explain-ready">
                ● ANALYSIS READY
              </span>
            </div>

            <div className="explain-factors">

              <Factor
                number="01"
                title="Safety severity"
                value={task.severity || 'High'}
                text="Infrastructure safety and defect severity are weighted heavily because unresolved railway defects can create direct operational risk."
              />

              <Factor
                number="02"
                title="Operational impact"
                value="Network impact"
                text="The planning engine considers how maintenance activity could affect railway sections, train movements and available operating capacity."
              />

              <Factor
                number="03"
                title="Maintenance urgency"
                value="Time sensitive"
                text="Tasks approaching their required maintenance window receive additional priority to reduce the chance of overdue intervention."
              />

            </div>

          </div>

          {/* RECOMMENDATION */}
          <div className="panel explain-recommendation">

            <div className="recommendation-icon">
              ✓
            </div>

            <div className="recommendation-copy">

              <span className="eyebrow">RECOMMENDED ACTION</span>

              <h2>Schedule maintenance block</h2>

              <p>
                Prioritize this task for the next suitable maintenance window
                and validate the resulting block against train movements and
                operational conflicts.
              </p>

              <NavLink className="primary" to="/calendar">
                Open block planner →
              </NavLink>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN */}
        <aside className="explain-sidebar">

          <div className="panel explain-summary">

            <div className="explain-summary-heading">
              <span className="eyebrow">RISK PROFILE</span>

              <span className={`risk-label ${priority.toLowerCase()}`}>
                {priority}
              </span>
            </div>

            <div className="risk-score-circle">
              <strong>{Math.round(score)}</strong>
              <span>RISK</span>
            </div>

            <p>
              This task has been identified as requiring elevated planning
              attention.
            </p>

          </div>

          <div className="panel explain-metrics-panel">

            <span className="eyebrow">OPERATIONAL FACTORS</span>

            <div className="explain-metrics">

              <Metric
                label="Department"
                value={department}
              />

              <Metric
                label="Severity"
                value={task.severity || '—'}
              />

              <Metric
                label="Status"
                value={task.status || 'Pending'}
              />

              <Metric
                label="Priority score"
                value={`${Math.round(score)} / 100`}
              />

            </div>

          </div>

          <div className="panel explain-ai-note">

            <div className="ai-note-icon">
              ✦
            </div>

            <div>
              <strong>AI planning note</strong>

              <p>
                The score is a decision-support signal. Final block approval
                should be validated by the responsible railway coordinator.
              </p>
            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}
