import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function NavIcon({ type }) {
  switch (type) {
    case 'overview':
      return (
        <svg className="nav-item-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className="nav-item-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
        </svg>
      );
    case 'priority':
      return (
        <svg className="nav-item-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 17 2 2 4-4" />
          <path d="m3 7 2 2 4-4" />
          <path d="M13 6h8" />
          <path d="M13 12h8" />
          <path d="M13 18h8" />
        </svg>
      );
    case 'reports':
      return (
        <svg className="nav-item-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M8 18v-2" />
          <path d="M12 18v-4" />
          <path d="M16 18v-6" />
        </svg>
      );
    case 'what-if':
      return (
        <svg className="nav-item-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" x2="6" y1="3" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      );
    case 'digital-twin':
      return (
        <svg className="nav-item-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="16" y="16" width="6" height="6" rx="1" />
          <rect x="2" y="16" width="6" height="6" rx="1" />
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
          <path d="M12 12V8" />
        </svg>
      );
    default:
      return null;
  }
}

const links = [
  ['/', 'Overview', 'overview'],
  ['/calendar', 'Block Calendar', 'calendar'],
  ['/priority-list', 'Priority List', 'priority'],
  ['/reports', 'Reports', 'reports'],
  ['/what-if', 'What-If Simulator', 'what-if'],
  ['/digital-twin', 'Digital Twin', 'digital-twin']
];

export default function Topbar() {
  const { session, logout } = useAuth();
  const role = session?.user?.role;
  const userName = session?.user?.name || 'Rocky';
  const userRole = session?.user?.role || 'Traction';

  const ordered = role === 'engineering' || role === 'traction' || role === 'signal'
    ? [links[2], ...links.filter(link => link !== links[2])] : links;

  return (
    <header className="glass-navbar">
      <div className="navbar-brand">
        <NavLink to="/" className="navbar-logo">
          <span className="logo-box">IR</span>
          <div className="logo-text-group">
            <span className="logo-title">Railway</span>
            <span className="logo-subtitle">BLOCK CONTROL</span>
          </div>
        </NavLink>
      </div>

      <nav className="navbar-nav">
        {ordered.map(([to, text, iconKey]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <NavIcon type={iconKey} />
            <span>{text}</span>
          </NavLink>
        ))}
      </nav>

      <div className="navbar-user">
        <div className="user-profile-capsule">
          <div className="user-avatar-badge">
            <span className="user-avatar-letter">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="user-online-ping" />
          </div>

          <div className="user-info-group">
            <span className="user-name-label">{userName}</span>
            <div className="user-role-tag">
              <span>{userRole}</span>
            </div>
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

