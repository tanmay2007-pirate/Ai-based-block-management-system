
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Layout from './components/layout/Layout';
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Overview = lazy(() => import('./pages/Overview'));
const Calendar = lazy(() => import('./pages/Calendar'));
const PriorityList = lazy(() => import('./pages/PriorityList'));
const Reports = lazy(() => import('./pages/Reports'));
const WhatIf = lazy(() => import('./pages/WhatIf'));
const DigitalTwin = lazy(() => import('./pages/DigitalTwin'));
const ExplainPanel = lazy(() => import('./components/priority/ExplainPanel'));

export default function App() {
  return <AuthProvider><Suspense fallback={<div className="loading">Loading…</div>}><Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route element={<ProtectedRoute />}><Route element={<Layout />}><Route path="/" element={<Overview />} /><Route path="/overview" element={<Overview />} /><Route path="/calendar" element={<Calendar />} /><Route path="/priority-list" element={<PriorityList />} /><Route path="/priority-list/:id/explain" element={<ExplainPanel />} /><Route path="/priority" element={<Navigate to="/priority-list" replace />} /><Route path="/reports" element={<Reports />} /><Route path="/what-if" element={<WhatIf />} /><Route path="/simulator" element={<Navigate to="/what-if" replace />} /><Route path="/digital-twin" element={<DigitalTwin />} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense></AuthProvider>;
}
