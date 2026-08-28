import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute() {
  const { session, initializing } = useAuth();
  if (initializing) return <div className="loading">Checking session…</div>;
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}
