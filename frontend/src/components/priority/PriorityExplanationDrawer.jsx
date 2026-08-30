/**
 * PriorityExplanationDrawer.jsx — Drawer for AI priority explanations
 * Displays detailed reasoning for task prioritization
 */

import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function PriorityExplanationDrawer({ taskId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) return;

    const fetchExplanation = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/tasks/${taskId}/explain`);
        setData(response.data);
      } catch (err) {
        setError('Unable to load explanation');
        console.error('Explanation fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [taskId]);

  if (!taskId) return null;

  return (
    <div className="explanation-drawer-overlay" onClick={onClose}>
      <div className="explanation-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div>
            <span className="drawer-label">AI DECISION SUPPORT</span>
            <h2>Priority Explanation</h2>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className="drawer-content">
          {loading && (
            <div className="drawer-loading">
              <div className="loading-spinner" />
              <strong>Analyzing task priority…</strong>
              <span>AI engine is evaluating operational factors</span>
            </div>
          )}

          {error && (
            <div className="drawer-error">
              <div className="error-icon">!</div>
              <strong>Explanation unavailable</strong>
              <p>{error}</p>
            </div>
          )}

          {data && !loading && !error && (
            <div className="drawer-explanation-content">
              {/* Task Information */}
              <div className="explanation-section">
                <h3 className="section-title">Maintenance Task</h3>
                <div className="task-info-grid">
                  <div className="info-item">
                    <span className="info-label">Task ID</span>
                    <strong className="info-value">{String(taskId).slice(0, 12)}</strong>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Department</span>
                    <strong className="info-value">{data.task?.department || data.department || 'N/A'}</strong>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Severity</span>
                    <strong className="info-value">{data.task?.severity || data.severity || 'N/A'}</strong>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status</span>
                    <strong className="info-value">{data.task?.status || data.status || 'PENDING'}</strong>
                  </div>
                </div>
              </div>

              {/* Priority Score */}
              <div className="explanation-section">
                <h3 className="section-title">AI Priority Score</h3>
                <div className="score-display">
                  <div className="score-value">
                    <strong>{Math.round(Number(data.priority_score || data.task?.priority_score || 0))}</strong>
                    <span>/100</span>
                  </div>
                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${Math.min(Math.max(Number(data.priority_score || data.task?.priority_score || 0), 0), 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="explanation-section">
                <h3 className="section-title">Why This Priority?</h3>
                <div className="reasoning-list">
                  <div className="reasoning-item">
                    <span className="reasoning-check">✓</span>
                    <div>
                      <strong>Safety and Severity</strong>
                      <p>Infrastructure safety is a primary factor. Defect severity level determines urgency.</p>
                    </div>
                  </div>
                  <div className="reasoning-item">
                    <span className="reasoning-check">✓</span>
                    <div>
                      <strong>Operational Impact</strong>
                      <p>The planning engine considers how maintenance affects railway sections and capacity.</p>
                    </div>
                  </div>
                  <div className="reasoning-item">
                    <span className="reasoning-check">✓</span>
                    <div>
                      <strong>Department Priority</strong>
                      <p>The asset type and responsible department influence scheduling urgency.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              {data.recommendation && (
                <div className="explanation-section">
                  <h3 className="section-title">AI Recommendation</h3>
                  <div className="recommendation-box">
                    <p>{data.recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
