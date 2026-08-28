import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
  const { session, logout } = useAuth();
  return <header><div><span className="eyebrow">OPERATIONS CONTROL</span><h2>Good morning, {session?.user?.name || 'Planner'}</h2></div><div className="user-chip"><span>{session?.user?.role || 'planner'}</span><button onClick={logout}>Sign out</button></div></header>;
}
