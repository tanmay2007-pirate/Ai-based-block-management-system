import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { session } = useAuth();
  const userName = session?.user?.name || 'Planner';
  const userRole = session?.user?.role || 'Traffic Controller';

  return (
    <aside className="app-sidebar details-sidebar">
      <div className="sidebar-details-header">
        <span className="eyebrow">OPERATIONS CONTROL</span>
        <h2>Welcome,<br /><span className="planner-name">{userName}</span></h2>
        <p className="sidebar-subtitle">Network dispatch & intelligent block management active.</p>
      </div>

      <div className="sidebar-profile-card">
        <div className="profile-badge-row">
          <div className="avatar-circle">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{userName}</strong>
            <span className="role-pill">{userRole}</span>
          </div>
        </div>
        <div className="profile-meta">
          <div><span>Division</span><strong>Central Section</strong></div>
          <div><span>Shift</span><strong>Active Duty</strong></div>
        </div>
      </div>

      <div className="sidebar-status-section">
        <span className="section-label">SYSTEM STATUS</span>
        <div className="sidebar-status-card">
          <div className="status-item">
            <span className="status-dot green" />
            <div>
              <strong>Planning Engine</strong>
              <small>Optimizing corridor</small>
            </div>
          </div>
          <div className="status-item">
            <span className="status-dot green" />
            <div>
              <strong>Live Telemetry</strong>
              <small>Real-time feed active</small>
            </div>
          </div>
          <div className="status-item">
            <span className="status-dot blue" />
            <div>
              <strong>Conflict Detection</strong>
              <small>Zero active hazards</small>
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-foot">
        <span className="status-dot green pulse" /> Systems online & synced
      </div>
    </aside>
  );
}

