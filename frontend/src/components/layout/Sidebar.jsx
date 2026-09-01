import { useAuth } from '../../context/AuthContext';

function StatusIcon({ type }) {
  switch (type) {
    case 'brain':
      return (
        <svg className="status-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
          <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
          <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
          <path d="M17.5 8a4.14 4.14 0 0 0-2.5 1" />
          <path d="M6.5 8a4.14 4.14 0 0 1 2.5 1" />
        </svg>
      );
    case 'activity':
      return (
        <svg className="status-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case 'shield':
      return (
        <svg className="status-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const { session } = useAuth();
  const userName = session?.user?.name || 'Rocky';
  const userRole = session?.user?.role || 'Traction';

  return (
    <aside className="app-sidebar details-sidebar">
      <div className="sidebar-details-header">
        <span className="eyebrow">OPERATIONS CONTROL</span>
        <h2>
          Welcome back,<br />
          <span className="planner-name">{userName}</span>
        </h2>
        <p className="sidebar-subtitle">Network dispatch & intelligent block management active.</p>
      </div>

      <div className="sidebar-profile-card">
        <div className="profile-badge-row">
          <div className="avatar-wrapper">
            <div className="avatar-circle">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="avatar-online-dot" />
          </div>
          <div className="profile-info-group">
            <strong className="profile-name">{userName}</strong>
            <span className="role-pill">{userRole}</span>
          </div>
        </div>
        <div className="profile-meta">
          <div className="meta-card">
            <span>DIVISION</span>
            <strong>Central Section</strong>
          </div>
          <div className="meta-card">
            <span>SHIFT</span>
            <strong>Active Duty</strong>
          </div>
        </div>
      </div>

      <div className="sidebar-status-section">
        <span className="section-label">SYSTEM STATUS</span>
        <div className="sidebar-status-card">
          <div className="status-item">
            <span className="status-dot green" />
            <div className="status-icon-wrapper">
              <StatusIcon type="brain" />
            </div>
            <div className="status-content">
              <strong>Planning Engine</strong>
              <small>Optimizing corridor</small>
            </div>
          </div>
          <div className="status-item">
            <span className="status-dot green" />
            <div className="status-icon-wrapper">
              <StatusIcon type="activity" />
            </div>
            <div className="status-content">
              <strong>Live Telemetry</strong>
              <small>Real-time feed active</small>
            </div>
          </div>
          <div className="status-item">
            <span className="status-dot blue" />
            <div className="status-icon-wrapper">
              <StatusIcon type="shield" />
            </div>
            <div className="status-content">
              <strong>Conflict Detection</strong>
              <small>Zero active hazards</small>
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-foot">
        <span className="status-dot green" />
        <span>Systems online & synced</span>
      </div>
    </aside>
  );
}

