import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [['/', 'Overview'], ['/calendar', 'Block Calendar'], ['/priority-list', 'Priority List'], ['/reports', 'Reports'], ['/what-if', 'What-If Simulator'], ['/digital-twin', 'Digital Twin']];
export default function Sidebar() {
  const role = useAuth().session?.user?.role;
  const ordered = role === 'engineering' || role === 'traction' || role === 'signal'
    ? [links[2], ...links.filter(link => link !== links[2])] : links;
  return <aside><div className="logo"><span>IR</span><div>Railway<br /><small>Block Control</small></div></div><nav>{ordered.map(([to, text]) => <NavLink key={to} to={to} end={to === '/'}>{text}</NavLink>)}</nav><div className="sidebar-foot"><span className="status-dot" /> Systems online</div></aside>;
}
