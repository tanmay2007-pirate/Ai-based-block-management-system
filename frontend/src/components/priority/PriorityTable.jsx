import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AddDefectForm from '../defects/AddDefectForm';
import BulkUploadModal from '../defects/BulkUploadModal';

function PriorityBadge({ score, hasBackendScore }) {
  if (!hasBackendScore) {
    return (
      <div className="priority-score low">
        <strong>--</strong>
        <span>MISSING BACKEND DATA</span>
      </div>
    );
  }

  const value = Number(score) || 0;

  let tone = 'low';
  let label = 'LOW';

  if (value >= 60) {
    tone = 'critical';
    label = 'CRITICAL';
  } else if (value >= 40) {
    tone = 'medium';
    label = 'MEDIUM';
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

  const tone =
    value.includes('CRITICAL') || value.includes('HIGH')
      ? 'critical'
      : value.includes('MEDIUM')
        ? 'medium'
        : 'low';

  return (
    <span className={`severity-badge ${tone}`}>
      <i />
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
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, loading, error } = useFetch(
    `/tasks?status=pending&page=${page}&limit=${pageSize}`,
    { tasks: [], total: 0 }
  );

  const [department, setDepartment] = useState('');
  const [severity, setSeverity] = useState('');
  const [sortHighFirst, setSortHighFirst] = useState(true);
  const [entryOpen, setEntryOpen] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [scoreMessage, setScoreMessage] = useState('');

  const canReportDefect = ['engineering', 'traction', 'signal']
    .includes(session?.user?.role);
  const canScoreTasks = ['control_office', 'admin']
    .includes(session?.user?.role);

  const refreshTasks = () => window.dispatchEvent(new Event('railway-refresh'));

  const handleScoreAll = async () => {
    try {
      setScoring(true);
      setScoreMessage('');
      const res = await api.post('/tasks/score-all');
      setScoreMessage(`Successfully scored ${res.data?.scored || 0} tasks with AI models.`);
      refreshTasks();
    } catch (err) {
      setScoreMessage(`Scoring failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setScoring(false);
    }
  };

  const allTasks = data?.tasks || [];
  const totalTasksInDb = data?.total ?? allTasks.length;
  const totalPages = Math.ceil(totalTasksInDb / pageSize) || 1;

  const unscoredCount = allTasks.filter(
    task => !task.ai_score_data && Number(task.priority_score) === 0
  ).length;

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
    if (data?.summary) {
      return data.summary;
    }

    const scoredTasks = allTasks.filter(
      task => Boolean(task.ai_score_data) || Number(task.priority_score) > 0
    );

    const critical = allTasks.filter(
      task => (Boolean(task.ai_score_data) || Number(task.priority_score) > 0) && Number(task.priority_score) >= 60
    ).length;

    const medium = scoredTasks.filter(task => {
      const score = Number(task.priority_score) || 0;
      return score >= 40 && score < 60;
    }).length;

    const low = scoredTasks.filter(
      task => Number(task.priority_score) < 40
    ).length;

    return {
      critical,
      medium,
      low,
      total: totalTasksInDb
    };
  }, [allTasks, totalTasksInDb, data?.summary]);

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

        {canScoreTasks && (
          <button
            type="button"
            className="priority-entry-button"
            style={{ background: '#1d4ed8', borderColor: '#2563eb' }}
            disabled={scoring}
            onClick={handleScoreAll}
          >
            {scoring ? 'Scoring with AI…' : '⚡ Run AI Prioritization'}
          </button>
        )}

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

      {scoreMessage && (
        <div style={{
          padding: '12px 18px',
          margin: '12px 0',
          borderRadius: '8px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#1e40af',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {scoreMessage}
        </div>
      )}

      {unscoredCount > 0 && canScoreTasks && (
        <div style={{
          padding: '12px 18px',
          margin: '12px 0',
          borderRadius: '8px',
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          color: '#854d0e',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <span>
            ⚠️ <strong>{unscoredCount} pending tasks</strong> currently lack AI priority scores.
          </span>
          <button
            type="button"
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: '#ca8a04',
              color: '#fff',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer'
            }}
            disabled={scoring}
            onClick={handleScoreAll}
          >
            {scoring ? 'Calculating scores…' : 'Score pending tasks now'}
          </button>
        </div>
      )}

      {canReportDefect && entryOpen && (
        <section className="priority-entry-panel" aria-label="Maintenance data entry">
          <div className="priority-entry-heading">
            <div>
              <span className="eyebrow">{session.user.department} DATA ENTRY</span>
              <h2>Add maintenance data</h2>
              <p>Submit a single defect or upload the department Excel template.</p>
            </div>
            <button type="button" className="priority-entry-close" onClick={() => setEntryOpen(false)}>Close</button>
          </div>
          <div className="priority-entry-grid">
            <div className="priority-entry-form">
              <h3>Single defect</h3>
              <AddDefectForm onComplete={refreshTasks} />
            </div>
            <div className="priority-entry-form">
              <h3>Excel bulk upload</h3>
              <BulkUploadModal onComplete={refreshTasks} />
            </div>
          </div>
        </section>
      )}

      <div className="priority-kpis">
        <div className="priority-kpi critical">
          <div className="priority-kpi-top">
            <span>AI Urgent Priority</span>
          </div>

          <strong>{summary.critical}</strong>

          <small>Score ≥ 60 · Traffic & risk weighted</small>
        </div>

        <div className="priority-kpi medium">
          <div className="priority-kpi-top">
            <span>Scheduled Review</span>
          </div>

          <strong>{summary.medium}</strong>

          <small>Score 40–59 · Standard window</small>
        </div>

        <div className="priority-kpi low">
          <div className="priority-kpi-top">
            <span>Routine Monitoring</span>
          </div>

          <strong>{summary.low}</strong>

          <small>Score &lt; 40 · Low operational impact</small>
        </div>

        <div className="priority-kpi total">
          <div className="priority-kpi-top">
            <span>Total Backlog</span>
          </div>

          <strong>{summary.total}</strong>

          <small>Includes 150 field-reported critical defects</small>
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

                    <td className="priority-score-cell">
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

                    <td className="explain-action-cell">
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

        {totalTasksInDb > pageSize && (
          <div className="priority-pagination-bar">
            <span className="priority-pagination-info">
              Showing {Math.min((page - 1) * pageSize + 1, totalTasksInDb)}–{Math.min(page * pageSize, totalTasksInDb)} of {totalTasksInDb} tasks (Page {page} of {totalPages})
            </span>
            <div className="priority-pagination-controls">
              <button
                type="button"
                className="priority-page-btn prev"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                ← Previous
              </button>
              <span className="priority-page-indicator">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className="priority-page-btn next"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
