import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';

import useFetch from '../hooks/useFetch';



function AnimatedNumber({ value, duration = 900 }) {
  const target = Number(value);

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setDisplayValue(value);
      return;
    }

    let startTime = null;
    let animationFrame;

    const animate = timestamp => {
      if (!startTime) {startTime = timestamp;}

      const progress = Math.min(
        (timestamp - startTime) / duration,
        1
      );

      // Smooth ease-out animation
      const eased =
        1 - Math.pow(1 - progress, 3);

      setDisplayValue(
        Math.round(target * eased)
      );

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(animate);
      }
    };

    animationFrame =
      requestAnimationFrame(animate);

    return () =>
      cancelAnimationFrame(animationFrame);
  }, [target, duration, value]);

  return <>{displayValue}</>;
}

function Stat({ label, value, tone = '', icon }) {
  return (
    <div className="stat-card enhanced-stat">
      <div className="stat-top">
        <span>{label}</span>

        <div className={`stat-icon ${tone}`}>
          {icon}
        </div>
      </div>

      <strong className={tone}>
        <AnimatedNumber value={value} />
      </strong>

      <small>Updated just now</small>
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
  const { data, error: summaryError } = useFetch('/reports/summary', {});
  const { data: health, error: healthError } = useFetch('/health', {});
  const networkAvailability = data.availability?.network_average;
  const apiStatus = health?.status === 'ok' ? 'Operational' : healthError ? 'Unavailable' : 'Checking';
  const databaseStatus = health?.database || (healthError ? 'Unavailable' : 'Checking');

  return (
    <>
      {/* HEADER */}
      <section className="overview-hero">
        <div className="overview-hero-copy">
          <span className="eyebrow">RAILWAY OPERATIONS CONTROL</span>
          <h1 className="overview-hero-title">Network operations overview</h1>
          <p>
            Monitor maintenance activity, railway blocks and operational risk
            from one intelligent planning workspace.
          </p>
        </div>

        <div className="overview-hero-actions">
          <div className="overview-live">
            <div className="live-halo">
              <i />
            </div>
            <div>
              <strong>Systems operational</strong>
              <span>{health?.timestamp ? `Backend checked ${new Date(health.timestamp).toLocaleTimeString()}` : apiStatus}</span>
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
          description="Field-reported physical defects"
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
              {healthError ? 'API UNAVAILABLE' : 'API DATA'}
            </span>
          </div>

          <p className="overview-ai-description">
            Combine maintenance priorities, train movements and operational
            constraints to identify safer and more efficient block windows.
          </p>

          <div className="ai-process">
            <div className="ai-process-step">
              <span>01</span>
              <div>
                <strong>Maintenance</strong>
                <small>Tasks identified</small>
              </div>
            </div>

            <div className="ai-process-step">
              <span>02</span>
              <div>
                <strong>AI analysis</strong>
                <small>Priority calculated</small>
              </div>
            </div>

            <div className="ai-process-step">
              <span>03</span>
              <div>
                <strong>Conflict check</strong>
                <small>Movements evaluated</small>
              </div>
            </div>

            <div className="ai-process-step">
              <span>04</span>
              <div>
                <strong>Block plan</strong>
                <small>Window generated</small>
              </div>
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
              detail="Backend planning API"
              status={apiStatus}
            />

            <StatusRow
              label="Live data stream"
              detail="No live-feed health endpoint exposed"
              status="Not verified"
            />

            <StatusRow
              label="Conflict detection"
              detail="Stored conflict records"
              status={summaryError ? 'Unavailable' : 'Data-backed'}
            />

            <StatusRow
              label="Database"
              detail="Planning data services"
              status={databaseStatus}
            />
          </div>
        </div>
      </section>

      {/* OPERATIONS SNAPSHOT */}
      <section className="overview-section">
        <div className="overview-section-heading">
          <div>
            <span className="eyebrow">OPERATIONS SNAPSHOT</span>
            <h2>Today&apos;s planning activity</h2>
          </div>

          <NavLink to="/calendar">View all blocks →</NavLink>
        </div>

        <div className="operations-snapshot">
          <div className="operation-metric">
            <div className="operation-icon green">✓</div>
            <div className="operation-info">
              <strong>{data.approvedPlans ?? '—'}</strong>
              <span>Approved blocks</span>
            </div>
          </div>

          <div className="operation-metric">
            <div className="operation-icon orange">◷</div>
            <div className="operation-info">
              <strong>{data.pendingTasks ?? '—'}</strong>
              <span>Pending tasks</span>
            </div>
          </div>

          <div className="operation-metric">
            <div className="operation-icon red">!</div>
            <div className="operation-info">
              <strong>{data.criticalTasks ?? '—'}</strong>
              <span>Critical issues</span>
            </div>
          </div>

          <div className="operation-metric">
            <div className="operation-icon blue">↗</div>
            <div className="operation-info">
              <strong>{networkAvailability === undefined ? '—' : `${Number(networkAvailability).toFixed(1)}%`}</strong>
              <span>Network availability</span>
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
