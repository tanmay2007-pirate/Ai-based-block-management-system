import { NavLink } from 'react-router-dom';
import useFetch from '../hooks/useFetch';

function Stat({ label, value, tone = '', icon }) {
  return (
    <div className="stat-card enhanced-stat">
      <div className="stat-top">
        <span>{label}</span>
        <div className={`stat-icon ${tone}`}>{icon}</div>
      </div>
      <strong className={tone}>{value}</strong>
      <small>Updated just now</small>
    </div>
  );
}

export default function Overview() {
  const { data } = useFetch('/reports/summary', {});

  return (
    <>
      <div className="page-title dashboard-heading">
        <div>
          <span className="eyebrow">NETWORK OPERATIONS</span>
          <h1>Control room overview</h1>
          <p className="muted">Real-time view of railway blocks, maintenance and network risk.</p>
        </div>

        <div className="live-pill">
          <i /> SYSTEMS LIVE
        </div>
      </div>

      <div className="stats">
        <Stat
          label="Pending maintenance"
          value={data.pendingTasks ?? '—'}
          tone="orange"
          icon="!"
        />
        <Stat
          label="Approved blocks"
          value={data.approvedPlans ?? '—'}
          tone="blue"
          icon="✓"
        />
        <Stat
          label="Critical defects"
          value={data.criticalTasks ?? '—'}
          tone="red"
          icon="!"
        />
        <Stat
          label="Total tasks"
          value={data.totalTasks ?? '—'}
          icon="Σ"
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel command-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">AI PLANNING ENGINE</span>
              <h2>Plan safer blocks with confidence</h2>
            </div>
            <span className="status-badge">● AI READY</span>
          </div>

          <p>
            Review maintenance priorities, coordinate departments and
            generate conflict-aware block schedules from one operational view.
          </p>

          <div className="command-actions">
            <NavLink className="primary" to="/calendar">
              Open block calendar →
            </NavLink>
            <NavLink className="secondary" to="/priority">
              Review priorities
            </NavLink>
          </div>
        </div>

        <div className="panel health-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">NETWORK STATUS</span>
              <h2>System health</h2>
            </div>
            <span className="system-ok">● Online</span>
          </div>

          <div className="health-list">
            <div>
              <span>Planning engine</span>
              <b>Operational</b>
            </div>
            <div>
              <span>Live data stream</span>
              <b>Connected</b>
            </div>
            <div>
              <span>Conflict detection</span>
              <b>Active</b>
            </div>
          </div>
        </div>
      </div>

      <div className="panel workflow-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">OPERATIONS WORKFLOW</span>
            <h2>From defect to approved block</h2>
          </div>
        </div>

        <div className="workflow">
          <div>
            <span>01</span>
            <b>Detect</b>
            <small>Identify maintenance defects</small>
          </div>
          <div>
            <span>02</span>
            <b>Prioritize</b>
            <small>AI ranks operational urgency</small>
          </div>
          <div>
            <span>03</span>
            <b>Schedule</b>
            <small>Generate conflict-aware blocks</small>
          </div>
          <div>
            <span>04</span>
            <b>Approve</b>
            <small>Review and authorize the plan</small>
          </div>
        </div>
      </div>
    </>
  );
}
