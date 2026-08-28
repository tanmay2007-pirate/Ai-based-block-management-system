import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'control_office' }); const [done, setDone] = useState(false); const [error, setError] = useState('');
  const submit = async event => { event.preventDefault(); try { await api.post('/auth/register', form); setDone(true); } catch (err) { setError(err.response?.data?.message || 'Unable to register'); } };
  return <div className="auth-page"><form className="auth-card" onSubmit={submit}><div className="brand-mark">IR</div><h1>Create account</h1>{error && <div className="error">{error}</div>}{done ? <><p className="system-ok">Registration complete.</p><NavLink to="/login">Return to sign in</NavLink></> : <><label>Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Email<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>Password<input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label><label>Role<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="control_office">Control office</option><option value="engineering">Engineering</option><option value="traction">Traction</option><option value="signal">Signal</option></select></label><button className="primary full">Register</button></>}</form></div>;
}
