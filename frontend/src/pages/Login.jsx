import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth(); const navigate = useNavigate(); const [form, setForm] = useState({ email: '', password: '' }); const [error, setError] = useState('');
  const submit = async event => { event.preventDefault(); try { await login(form.email, form.password); navigate('/'); } catch (err) { setError(err.response?.data?.message || (err.code === 'ERR_NETWORK' ? 'Cannot reach server — is the backend running?' : 'Unable to sign in')); } };
  return <div className="auth-page"><form className="auth-card" onSubmit={submit}><div className="brand-mark">IR</div><h1>Railway Operations</h1><p className="muted">Sign in to the block management control room</p>{error && <div className="error">{error}</div>}<label>Email<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>Password<input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label><button className="primary full">Sign in</button><NavLink to="/register">Create an account</NavLink></form></div>;
}
