import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute() { return useAuth().session ? <Outlet /> : <Navigate to="/login" replace />; }
