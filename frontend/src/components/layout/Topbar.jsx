import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [
  ['/overview', 'Overview'],
  ['/calendar', 'Block Calendar'],
  ['/priority-list', 'Priority List'],
  ['/reports', 'Reports'],
  ['/what-if', 'What-If Simulator'],
  ['/digital-twin', 'Digital Twin']
];

export default function Topbar() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = session?.user?.role;
  const ordered = role === 'engineering' || role === 'traction' || role === 'signal'
    ? [links[2], ...links.filter(link => link !== links[2])] : links;

  // Automatically close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="glass-navbar">
        <div className="navbar-brand">
          <NavLink to="/overview" className="navbar-logo" onClick={() => setMobileOpen(false)}>
            <span className="navbar-logo-badge">
              <img src="/indian-railways-seal.png" alt="Indian Railways" className="navbar-logo-img" />
            </span>
            <div>
              Railway
              <small>Block Control</small>
            </div>
          </NavLink>
        </div>

        <nav className="navbar-nav desktop-nav">
          {ordered.map(([to, text]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {text}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-right-cluster">
          <div className="navbar-user">
            <div className="user-profile-capsule">
              <div className="user-avatar-badge">
                <span className="user-avatar-letter">
                  {(session?.user?.name || session?.user?.role || 'E').charAt(0).toUpperCase()}
                </span>
                <span className="user-online-ping" />
              </div>

              <div className="user-info-group">
                <div className="user-role-tag">
                  <span className="role-dot" />
                  <span>{session?.user?.role || 'engineering'}</span>
                </div>
                {session?.user?.name && (
                  <span className="user-name-label">{session?.user?.name}</span>
                )}
              </div>

              <div className="user-divider" />

              <button onClick={logout} className="signout-button" title="Sign out of system">
                <svg
                  className="signout-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Sign out</span>
              </button>
            </div>
          </div>

          {/* MOBILE MENU TOGGLE BUTTON */}
          <button
            type="button"
            className={`navbar-mobile-toggle ${mobileOpen ? 'is-active' : ''}`}
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <span className="hamburger-bar bar-1" />
            <span className="hamburger-bar bar-2" />
            <span className="hamburger-bar bar-3" />
          </button>
        </div>
      </header>

      {/* MOBILE NAV BACKDROP */}
      <div
        className={`mobile-nav-backdrop ${mobileOpen ? 'is-open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* MOBILE NAV DRAWER */}
      <aside className={`mobile-nav-drawer ${mobileOpen ? 'is-open' : ''}`} aria-label="Mobile Navigation">
        <div className="mobile-drawer-header">
          <div className="navbar-logo">
            <span className="navbar-logo-badge">
              <img src="/indian-railways-seal.png" alt="Indian Railways" className="navbar-logo-img" />
            </span>
            <div>
              Railway
              <small>Operations Menu</small>
            </div>
          </div>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* User Card in Mobile Drawer */}
        <div className="mobile-drawer-user-card">
          <div className="mobile-drawer-user-row">
            <div className="avatar-circle">
              {(session?.user?.name || session?.user?.role || 'E').charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{session?.user?.name || 'Operations Planner'}</strong>
              <span className="role-pill">{session?.user?.role || 'Traffic Controller'}</span>
            </div>
          </div>
          <div className="mobile-user-submeta">
            <span>Division: <strong>Central Section</strong></span>
            <span>Shift: <strong>Active Duty</strong></span>
          </div>
        </div>

        {/* Links Navigation */}
        <nav className="mobile-drawer-links">
          <span className="mobile-drawer-label">OPERATIONS MODULES</span>
          {ordered.map(([to, text]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `mobile-drawer-link ${isActive ? 'active' : ''}`}
            >
              <span>{text}</span>
              <span className="mobile-drawer-arrow">→</span>
            </NavLink>
          ))}
        </nav>

        {/* Live Telemetry In Drawer */}
        <div className="mobile-drawer-telemetry">
          <span className="mobile-drawer-label">SYSTEM TELEMETRY</span>
          <div className="status-item">
            <span className="status-dot green" />
            <div>
              <strong>Planning Engine</strong>
              <small>Corridor optimized</small>
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
              <small>Monitoring active</small>
            </div>
          </div>
        </div>

        {/* Drawer Footer Sign Out */}
        <div className="mobile-drawer-footer">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              logout();
            }}
            className="mobile-drawer-signout"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Sign out of Control System</span>
          </button>
        </div>
      </aside>
    </>
  );
}

