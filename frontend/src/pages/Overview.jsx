import { NavLink } from 'react-router-dom';
import useFetch from '../hooks/useFetch';

function Stat({ label, value, tone = '', icon, description }) {
  return (
    <div className={`overview-stat ${tone}`}>
      <div className="overview-stat-header">
        <span>{label}</span>
        <div className="overview-stat-icon">{icon}</div>
      </div>

      <strong>{value}</strong>

      <div className="overview-stat-footer">
        <span>{description}</span>
        <span className="stat-live-dot">LIVE</span>
      </div>
    </div>
  );
}

function StatusRow({ label, status, detail }) {
  return (
    <div className="network-status-row">
      <div className="network-status-label">
        <i />
        <div>
          <strong>{label}</strong>
          <small>{detail}</small>
        </div>
      </div>

      <span className="network-status-value">{status}</span>
    </div>
  );
}

export default function Overview() {
  const { data } = useFetch('/reports/summary', {});

  return (
    <>
      {/* HEADER */}
      <section className="overview-hero">
        <div className="overview-hero-copy">
          <span className="eyebrow">RAILWAY OPERATIONS CONTROL</span>

          <h1>Network operations overview</h1>

          <p>
            Monitor maintenance activity, railway blocks and operational risk
            from one intelligent planning workspace.
          </p>
        </div>

        <div className="overview-hero-actions">
          <div className="overview-live">
            <i />
            <div>
              <strong>Systems operational</strong>
              <span>Live planning environment</span>
            </div>
          </div>

          <NavLink className="overview-primary-action" to="/calendar">
            Open planning calendar →
          </NavLink>
        </div>
      </section>

      {/* KPI CARDS */}
      <section className="overview-stats">
        <Stat
          label="Pending maintenance"
          value={data.pendingTasks ?? '—'}
          tone="orange"
          icon="!"
          description="Tasks awaiting planning"
        />

        <Stat
          label="Approved blocks"
          value={data.approvedPlans ?? '—'}
          tone="green"
          icon="✓"
          description="Ready for execution"
        />

        <Stat
          label="Critical defects"
          value={data.criticalTasks ?? '—'}
          tone="red"
          icon="!"
          description="Require immediate attention"
        />

        <Stat
          label="Total tasks"
          value={data.totalTasks ?? '—'}
          tone="blue"
          icon="Σ"
          description="Maintenance workload"
        />
      </section>

      {/* MAIN COMMAND AREA */}
      <section className="overview-main-grid">

        {/* AI COMMAND CENTER */}
        <div className="overview-ai-card">
          <div className="overview-ai-top">
            <div>
              <span className="eyebrow">AI PLANNING ENGINE</span>
              <h2>Intelligent block planning</h2>
            </div>

            <span className="ai-ready">
              <i />
              AI READY
            </span>
          </div>

          <p className="overview-ai-description">
            Combine maintenance priorities, train movements and operational
            constraints to identify safer and more efficient block windows.
          </p>

          <div className="ai-process">
            <div className="ai-process-step">
              <span>01</span>
              <strong>Maintenance</strong>
              <small>Tasks identified</small>
            </div>

            <div className="ai-process-line" />

            <div className="ai-process-step">
              <span>02</span>
              <strong>AI analysis</strong>
              <small>Priority calculated</small>
            </div>

            <div className="ai-process-line" />

            <div className="ai-process-step">
              <span>03</span>
              <strong>Conflict check</strong>
              <small>Movements evaluated</small>
            </div>

            <div className="ai-process-line" />

            <div className="ai-process-step">
              <span>04</span>
              <strong>Block plan</strong>
              <small>Window generated</small>
            </div>
          </div>

          <div className="overview-ai-actions">
            <NavLink className="ai-primary-button" to="/priority">
              Review AI priorities
            </NavLink>

            <NavLink className="ai-secondary-button" to="/calendar">
              View block calendar
            </NavLink>
          </div>
        </div>

        {/* NETWORK HEALTH */}
        <div className="overview-health-card">
          <div className="overview-card-heading">
            <div>
              <span className="eyebrow">SYSTEM MONITOR</span>
              <h2>Network health</h2>
            </div>

            <span className="health-online">
              <i />
              ONLINE
            </span>
          </div>

          <div className="network-status-list">
            <StatusRow
              label="Planning engine"
              detail="AI scheduling services"
              status="Operational"
            />

            <StatusRow
              label="Live data stream"
              detail="Operational network feed"
              status="Connected"
            />

            <StatusRow
              label="Conflict detection"
              detail="Train / block analysis"
              status="Active"
            />

            <StatusRow
              label="Database"
              detail="Planning data services"
              status="Healthy"
            />
          </div>
        </div>
      </section>

      {/* OPERATIONS SNAPSHOT */}
      <section className="overview-section">
        <div className="overview-section-heading">
          <div>
            <span className="eyebrow">OPERATIONS SNAPSHOT</span>
            <h2>Today's planning activity</h2>
          </div>

          <NavLink to="/calendar">View all blocks →</NavLink>
        </div>

        <div className="operations-snapshot">
          <div className="operation-metric">
            <span className="operation-icon">▣</span>
            <div>
              <strong>{data.approvedPlans ?? '—'}</strong>
              <span>Approved blocks</span>
            </div>
          </div>

          <div className="operation-metric">
            <span className="operation-icon orange">◷</span>
            <div>
              <strong>{data.pendingTasks ?? '—'}</strong>
              <span>Pending tasks</span>
            </div>
          </div>

          <div className="operation-metric">
            <span className="operation-icon red">!</span>
            <div>
              <strong>{data.criticalTasks ?? '—'}</strong>
              <span>Critical issues</span>
            </div>
          </div>

          <div className="operation-metric">
            <span className="operation-icon blue">↗</span>
            <div>
              <strong>24/7</strong>
              <span>Monitoring status</span>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="overview-workflow-card">
        <div className="overview-card-heading">
          <div>
            <span className="eyebrow">PLANNING WORKFLOW</span>
            <h2>From defect to approved block</h2>
          </div>

          <span className="workflow-label">AI-ASSISTED</span>
        </div>

        <div className="overview-workflow">
          <div className="workflow-step active">
            <span>01</span>
            <div>
              <strong>Detect</strong>
              <small>Identify maintenance defects</small>
            </div>
          </div>

          <div className="workflow-connector" />

          <div className="workflow-step active">
            <span>02</span>
            <div>
              <strong>Prioritize</strong>
              <small>AI ranks operational urgency</small>
            </div>
          </div>

          <div className="workflow-connector" />

          <div className="workflow-step active">
            <span>03</span>
            <div>
              <strong>Schedule</strong>
              <small>Generate conflict-aware blocks</small>
            </div>
          </div>

          <div className="workflow-connector" />

          <div className="workflow-step">
            <span>04</span>
            <div>
              <strong>Approve</strong>
              <small>Review and authorize plan</small>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
