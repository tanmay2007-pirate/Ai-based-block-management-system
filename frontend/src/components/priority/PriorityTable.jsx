import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import AddDefectForm from '../defects/AddDefectForm';
import BulkUploadModal from '../defects/BulkUploadModal';

function PriorityBadge({ score, hasBackendScore }) {
  if (!hasBackendScore) {
    return (
      <div className="priority-score missing">
        <strong>--</strong>
        <span>MISSING BACKEND DATA</span>
      </div>
    );
  }

  const value = Number(score) || 0;

  let tone = 'very-low';
  let label = 'VERY LOW';

  if (value >= 90) {
    tone = 'critical';
    label = 'CRITICAL';
  } else if (value >= 75) {
    tone = 'high';
    label = 'HIGH';
  } else if (value >= 50) {
    tone = 'medium';
    label = 'MEDIUM';
  } else if (value >= 25) {
    tone = 'low';
    label = 'LOW';
  }

  return (
    <div className={`priority-score ${tone}`}>
      <strong>{Math.round(value)}</strong>
      <span>{label}</span>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const value = String(severity || 'UNKNOWN').toUpperCase();

  let tone = 'very-low';
  if (value.includes('CRITICAL')) {
    tone = 'critical';
  } else if (value.includes('HIGH')) {
    tone = 'high';
  } else if (value.includes('MEDIUM')) {
    tone = 'medium';
  } else if (value.includes('LOW')) {
    tone = 'low';
  }

  return (
    <span className={`severity-badge ${tone}`}>
      <i aria-hidden="true" />
      {value}
    </span>
  );
}

function StatusBadge({ status }) {
  const value = String(status || 'PENDING').toUpperCase();

  const tone =
    value === 'APPROVED'
      ? 'approved'
      : value === 'REJECTED' || value === 'CONFLICT'
        ? 'conflict'
        : 'pending';

  return (
    <span className={`task-status ${tone}`}>
      {value.replaceAll('_', ' ')}
    </span>
  );
}

export default function PriorityTable() {
  const { session } = useAuth();
  const { data, loading, error } = useFetch(
    '/tasks?status=pending&limit=100',
    { tasks: [] }
  );

  const [department, setDepartment] = useState('');
  const [severity, setSeverity] = useState('');
  const [sortHighFirst, setSortHighFirst] = useState(true);
  const [entryOpen, setEntryOpen] = useState(false);

  const canReportDefect = ['engineering', 'traction', 'signal']
    .includes(session?.user?.role);

  const refreshTasks = () => window.dispatchEvent(new Event('railway-refresh'));

  const allTasks = data?.tasks || [];

  const tasks = useMemo(() => {
    const filtered = allTasks.filter(task => {
      const departmentMatch =
        !department || task.department === department;

      const severityMatch =
        !severity ||
        String(task.severity || '').toUpperCase() === severity;

      return departmentMatch && severityMatch;
    });

    return [...filtered].sort((a, b) => {
      const aScore = Number(a.priority_score) || 0;
      const bScore = Number(b.priority_score) || 0;

      return sortHighFirst
        ? bScore - aScore
        : aScore - bScore;
    });
  }, [allTasks, department, severity, sortHighFirst]);

  const summary = useMemo(() => {
    const scoredTasks = allTasks.filter(
      task => Boolean(task.ai_score_data) || Number(task.priority_score) > 0
    );

    const critical = allTasks.filter(
      task => (Boolean(task.ai_score_data) || Number(task.priority_score) > 0) && Number(task.priority_score) >= 80
    ).length;

    const medium = scoredTasks.filter(task => {
      const score = Number(task.priority_score) || 0;
      return score >= 50 && score < 80;
    }).length;

    const low = scoredTasks.filter(
      task => Number(task.priority_score) < 50
    ).length;

    return {
      critical,
      medium,
      low,
      total: allTasks.length
    };
  }, [allTasks]);

  const departments = [
    ...new Set(
      allTasks
        .map(task => task.department)
        .filter(Boolean)
    )
  ];

  return (
    <>
      <div className="priority-heading">
        <div>
          <span className="eyebrow">MAINTENANCE INTELLIGENCE</span>

          <h1>AI priority center</h1>

          <p className="priority-subtitle">
            Review infrastructure defects ranked by operational
            risk and maintenance urgency.
          </p>
        </div>

        <div className="priority-live">
          <i />
          PRIORITIZATION ENGINE LIVE
        </div>

        {canReportDefect && (
          <button
            type="button"
            className="priority-entry-button"
            onClick={() => setEntryOpen(value => !value)}
          >
            {entryOpen ? 'Close data entry' : 'Report maintenance defect'}
          </button>
        )}
      </div>

      {canReportDefect && entryOpen && (
        <section className="priority-entry-panel" aria-label="Maintenance data entry">
          <div className="priority-entry-heading">
            <div className="priority-entry-title-wrap">
              <span className="eyebrow">{session.user.department} DATA ENTRY</span>
              <h2>Add maintenance data</h2>
              <p>Submit an individual maintenance defect or batch upload via Excel template.</p>
            </div>
            <button type="button" className="priority-entry-close" onClick={() => setEntryOpen(false)}>
              ✕ Close
            </button>
          </div>
          <div className="priority-entry-grid">
            <div className="priority-entry-card single-defect-card">
              <div className="priority-card-top">
                <div className="card-icon-tag">📝</div>
                <div>
                  <h3>Single defect entry</h3>
                  <small>Log an individual infrastructure defect</small>
                </div>
              </div>
              <AddDefectForm onComplete={refreshTasks} />
            </div>
            <div className="priority-entry-card bulk-upload-card">
              <div className="priority-card-top">
                <div className="card-icon-tag">📊</div>
                <div>
                  <h3>Excel bulk upload</h3>
                  <small>Import multiple defects via spreadsheet</small>
                </div>
              </div>
              <BulkUploadModal onComplete={refreshTasks} />
            </div>
          </div>
        </section>
      )}

      <div className="priority-kpis">
        <div className="priority-kpi critical">
          <div className="priority-kpi-top">
            <span>Critical priority</span>
            <div>!</div>
          </div>

          <strong>{summary.critical}</strong>

          <small>Immediate planning attention</small>
        </div>

        <div className="priority-kpi medium">
          <div className="priority-kpi-top">
            <span>Medium priority</span>
            <div>↗</div>
          </div>

          <strong>{summary.medium}</strong>

          <small>Requires scheduled review</small>
        </div>

        <div className="priority-kpi low">
          <div className="priority-kpi-top">
            <span>Low priority</span>
            <div>✓</div>
          </div>

          <strong>{summary.low}</strong>

          <small>Monitor during planning</small>
        </div>

        <div className="priority-kpi total">
          <div className="priority-kpi-top">
            <span>Total tasks</span>
            <div>Σ</div>
          </div>

          <strong>{summary.total}</strong>

          <small>Maintenance workload</small>
        </div>
      </div>

      <div className="priority-panel">
        <div className="priority-panel-header">
          <div>
            <span className="eyebrow">AI RANKING</span>
            <h2>Maintenance priorities</h2>

            <p>
              Higher scores indicate greater operational urgency.
            </p>
          </div>

          <div className="priority-result-count">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>

        <div className="priority-filters">
          <div className="priority-filter">
            <label>Department</label>

            <select
              value={department}
              onChange={event => setDepartment(event.target.value)}
            >
              <option value="">All departments</option>

              {departments.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="priority-filter">
            <label>Severity</label>

            <select
              value={severity}
              onChange={event => setSeverity(event.target.value)}
            >
              <option value="">All severity</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <button
            className="priority-sort"
            onClick={() => setSortHighFirst(value => !value)}
          >
            <span>Sort priority</span>
            <strong>{sortHighFirst ? 'Highest first ↓' : 'Lowest first ↑'}</strong>
          </button>
        </div>

        <div className="priority-table-wrap">
          {loading ? (
            <div className="priority-loading">
              <div className="loading-ring" />
              <strong>Loading maintenance priorities…</strong>
              <span>Reading planning intelligence</span>
            </div>
          ) : tasks.length ? (
            <table className="priority-table">
              <thead>
                <tr>
                  <th>Maintenance task</th>
                  <th>Department</th>
                  <th>AI priority</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>AI rationale</th>
                </tr>
              </thead>

              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td>
                      <div className="task-id">
                        <strong>
                          {task.id
                            ? task.id.slice(0, 10).toUpperCase()
                            : 'TASK'}
                        </strong>

                        <small>
                          Maintenance activity
                        </small>
                      </div>
                    </td>

                    <td>
                      <span className="department-label">
                        {task.department || 'Unassigned'}
                      </span>
                    </td>

                    <td>
                      <PriorityBadge
                        score={task.priority_score}
                        hasBackendScore={Boolean(task.ai_score_data) || Number(task.priority_score) > 0}
                      />
                    </td>

                    <td>
                      <SeverityBadge
                        severity={task.severity}
                      />
                    </td>

                    <td>
                      <StatusBadge status={task.status} />
                    </td>

                    <td>
                      <NavLink
                        className="explain-button"
                        to={`/priority-list/${task.id}/explain`}
                      >
                        <span>Explain priority</span>
                        <strong>→</strong>
                      </NavLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="priority-empty">
              <div className="priority-empty-icon">✓</div>

              <h3>No maintenance tasks found</h3>

              <p>
                There are no tasks matching the current
                filters.
              </p>
            </div>
          )}
          {error && (
            <div className="priority-empty">
              <div className="priority-empty-icon">!</div>
              <h3>Unable to load maintenance priorities</h3>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
