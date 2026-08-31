import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

function scoreValue(data) {
  return Number(
    data?.priority_score ??
    data?.priorityScore ??
    data?.score ??
    data?.explanation?.score?.result?.priority_score ??
    data?.explanation?.score?.priority_score ??
    data?.explanation?.result?.priority_score ??
    data?.task?.priority_score ??
    0
  );
}

function getPriority(score) {
  if (score >= 60) {return 'CRITICAL';}
  if (score >= 40) {return 'MEDIUM';}
  return 'LOW';
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

export default function ExplainPanel({ taskId: providedTaskId, onClose }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const taskId = providedTaskId || id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(taskId));

  useEffect(() => {
    if (!taskId) {return;}

    setLoading(true);
    api
      .get(`/tasks/${taskId}/explain`)
      .then((response) => setData(response.data))
      .catch(() => setData({ error: 'Explanation unavailable' }))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
      return;
    }
    navigate('/priority-list', { replace: true });
  };

  const task = data?.task || data || {};
  const score = useMemo(() => scoreValue(data), [data]);
  const priority = getPriority(score);
  const taskName = task.description || task.location || data?.description || 'Maintenance task';
  const department = task.department || data?.department || data?.features?.department || 'MISSING BACKEND DATA';
  const explanation = data?.explanation || {};
  const scoreResult = explanation?.score?.result || explanation?.score || explanation?.result || {};
  const backendFactors = Object.entries(scoreResult.baseline_components || {})
    .map(([name, value]) => ({
      title: name.replaceAll('_', ' '),
      value: String(value),
      text: 'Backend scoring component returned by the AI service.'
    }));
  const contributionFactors = (explanation.feature_contributions || [])
    .map(item => ({
      title: String(item).replaceAll('_', ' '),
      value: 'AI contribution',
      text: 'Feature identified by the AI explanation endpoint.'
    }));
  const factors = backendFactors.length ? backendFactors : contributionFactors;

  if (!taskId) {return null;}

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
          <button type="button" className="explain-back" onClick={handleClose}>← Back to priority queue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="explain-page">
      <div className="explain-header">
        <div>
          <span className="eyebrow">AI DECISION SUPPORT</span>
          <h1>Priority rationale</h1>
          <p>Operational reasoning behind the maintenance priority assigned to this task.</p>
        </div>
        <button type="button" className="explain-back" onClick={handleClose}>← Priority queue</button>
      </div>

      <div className="explain-grid">
        <div className="explain-main">
          <div className="panel explain-task-card">
            <div className="explain-task-top">
              <div className="explain-task-icon">AI</div>
              <div>
                <span className="eyebrow">MAINTENANCE TASK</span>
                <h2>{taskName}</h2>
                <div className="explain-task-meta">
                  <span>{department}</span>
                  <span>Task {String(taskId).slice(0, 10)}</span>
                </div>
              </div>
              <span className={`explain-priority ${priority.toLowerCase()}`}><i />{priority}</span>
            </div>

            <div className="explain-score">
              <div>
                <span>AI PRIORITY SCORE</span>
                <strong>{Math.round(score)}%</strong>
              </div>
              <div className="explain-score-bar"><span style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }} /></div>
              <small>Confidence based on available maintenance and operational data</small>
            </div>
          </div>

          <div className="panel explain-section">
            <div className="explain-section-heading">
              <div>
                <span className="eyebrow">AI ANALYSIS</span>
                <h2>Why this task is prioritized</h2>
              </div>
              <span className="explain-ready">● ANALYSIS READY</span>
            </div>

            <div className="explain-factors">
              {factors.length ? factors.slice(0, 5).map((factor, index) => (
                <Factor
                  key={`${factor.title}-${index}`}
                  number={String(index + 1).padStart(2, '0')}
                  title={factor.title}
                  value={factor.value}
                  text={factor.text}
                />
              )) : (
                <Factor
                  number="01"
                  title="MISSING BACKEND DATA"
                  value={explanation.explanation_method || scoreResult.scoring_method || ''}
                  text="The backend returned an explanation without feature contributions or scoring components."
                />
              )}
            </div>
          </div>
        </div>

        <div className="explain-side">
          <div className="panel explain-summary">
            <span className="eyebrow">AI SUMMARY</span>
            <h2>Priority insight</h2>
            <p>{explanation.explanation || scoreResult.confidence_reason || 'MISSING BACKEND DATA'}</p>
          </div>

          <div className="panel explain-metrics">
            <span className="eyebrow">EVALUATION METRICS</span>
            <Metric label="Severity" value={task.severity || data?.features?.severity || 'MISSING BACKEND DATA'} description="Defect criticality" />
            <Metric label="Department" value={department} description="Responsible maintenance team" />
            <Metric label="Priority score" value={`${Math.round(score)} / 100`} description="AI ranking" />
            <Metric label="Method" value={scoreResult.scoring_method || explanation.explanation_method || 'MISSING BACKEND DATA'} description="Backend scoring source" />
          </div>
        </div>
      </div>
    </div>
  );
}
