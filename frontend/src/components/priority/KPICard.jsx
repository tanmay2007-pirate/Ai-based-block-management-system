/**
 * KPICard.jsx — Reusable KPI Card Component
 * Displays key performance indicators with value, label, and icon
 */

export default function KPICard({ icon, label, value, description, percentage, tone = 'default' }) {
  return (
    <div className={`kpi-card ${tone}`}>
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        <div className="kpi-icon">{icon}</div>
      </div>

      <div className="kpi-value">
        <strong>{value}</strong>
      </div>

      <div className="kpi-description">
        <p>{description}</p>
        {percentage !== undefined && (
          <span className="kpi-percentage">{percentage}% of total</span>
        )}
      </div>

      {percentage !== undefined && (
        <div className="kpi-progress">
          <div className="kpi-progress-bar" style={{ width: `${Math.min(percentage, 100)}%` }} />
        </div>
      )}
    </div>
  );
}
