import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [
  ['/', 'Overview'],
  ['/calendar', 'Block Calendar'],
  ['/priority-list', 'Priority List'],
  ['/reports', 'Reports'],
  ['/what-if', 'What-If Simulator'],
  ['/digital-twin', 'Digital Twin']
];

export default function Topbar() {
  const { session, logout } = useAuth();
  const role = session?.user?.role;
  const ordered = role === 'engineering' || role === 'traction' || role === 'signal'
    ? [links[2], ...links.filter(link => link !== links[2])] : links;

  return (
    <header className="glass-navbar">
      <div className="navbar-brand">
        <NavLink to="/" className="navbar-logo">
          <span>IR</span>
          <div>
            Railway
            <small>Block Control</small>
          </div>
        </NavLink>
      </div>

      <nav className="navbar-nav">
        {ordered.map(([to, text]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {text}
          </NavLink>
        ))}
      </nav>

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
    </header>
  );
}

