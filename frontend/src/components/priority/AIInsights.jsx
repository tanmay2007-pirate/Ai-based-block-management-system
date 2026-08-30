/**
 * AIInsights.jsx — AI-generated insights panel
 * Summarizes maintenance data with key statistics
 */

import { useMemo } from 'react';

export default function AIInsights({ tasks = [], loading = false }) {
  const insights = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return null;
    }

    const critical = tasks.filter(t => Number(t.priority_score) >= 80).length;
    const high = tasks.filter(t => {
      const s = Number(t.priority_score) || 0;
      return s >= 50 && s < 80;
    }).length;
    const pending = tasks.filter(t => t.status === 'pending' || !t.status).length;

    const departments = {};
    tasks.forEach(task => {
      if (task.department) {
        departments[task.department] = (departments[task.department] || 0) + 1;
      }
    });

    const maxDept = Object.entries(departments).sort((a, b) => b[1] - a[1])[0];
    const avgScore = (tasks.reduce((sum, t) => sum + (Number(t.priority_score) || 0), 0) / tasks.length).toFixed(1);

    const maxScore = Math.max(...tasks.map(t => Number(t.priority_score) || 0));

    return {
      total: tasks.length,
      critical,
      high,
      pending,
      topDepartment: maxDept ? maxDept[0] : 'N/A',
      avgScore,
      maxScore: Math.round(maxScore),
    };
  }, [tasks]);

  if (loading) {
    return (
      <div className="ai-insights-panel loading">
        <div className="skeleton skeleton-line" style={{ width: '60%', height: '20px' }} />
        <div className="skeleton skeleton-line" style={{ width: '80%', height: '16px', marginTop: '12px' }} />
        <div className="skeleton skeleton-line" style={{ width: '75%', height: '16px', marginTop: '8px' }} />
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="ai-insights-panel empty">
        <span className="insights-icon">◆</span>
        <h3>No data to analyze</h3>
        <p>Add maintenance tasks to see AI insights</p>
      </div>
    );
  }

  return (
    <div className="ai-insights-panel">
      <div className="insights-header">
        <span className="insights-label">AI INSIGHTS</span>
        <div className="insights-indicator">
          <span className="pulse" />
          ANALYSIS READY
        </div>
      </div>

      <div className="insights-content">
        <div className="insight-item">
          <span className="insight-check">✓</span>
          <div>
            <strong>{insights.total}</strong>
            <small>maintenance tasks analyzed</small>
          </div>
        </div>

        {insights.critical > 0 && (
          <div className="insight-item critical-alert">
            <span className="insight-icon">!</span>
            <div>
              <strong>{insights.critical}</strong>
              <small>critical-priority tasks detected</small>
            </div>
          </div>
        )}

        {insights.high > 0 && (
          <div className="insight-item">
            <span className="insight-check">↗</span>
            <div>
              <strong>{insights.high}</strong>
              <small>high-priority tasks requiring attention</small>
            </div>
          </div>
        )}

        <div className="insight-item">
          <span className="insight-check">◆</span>
          <div>
            <strong>{insights.topDepartment}</strong>
            <small>has the highest task volume</small>
          </div>
        </div>

        <div className="insight-item">
          <span className="insight-check">●</span>
          <div>
            <strong>{insights.pending}</strong>
            <small>tasks in pending status</small>
          </div>
        </div>

        <div className="insight-item">
          <span className="insight-check">★</span>
          <div>
            <strong>{insights.avgScore}</strong>
            <small>average AI priority score</small>
          </div>
        </div>

        <div className="insight-item">
          <span className="insight-check">⚡</span>
          <div>
            <strong>{insights.maxScore}</strong>
            <small>highest AI priority score</small>
          </div>
        </div>
      </div>
    </div>
  );
}
