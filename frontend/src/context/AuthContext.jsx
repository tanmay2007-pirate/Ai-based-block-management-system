import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  useEffect(() => { const token = sessionStorage.getItem('railway_token'); if (!token) return; api.defaults.headers.common.Authorization = `Bearer ${token}`; api.get('/auth/me').then(({ data }) => setSession({ user: data.user, token })).catch(() => { sessionStorage.removeItem('railway_token'); delete api.defaults.headers.common.Authorization; }); }, []);
  const login = async (email, password) => { const { data } = await api.post('/auth/login', { email, password }); sessionStorage.setItem('railway_token', data.token); api.defaults.headers.common.Authorization = `Bearer ${data.token}`; setSession(data); };
  const logout = () => { sessionStorage.removeItem('railway_token'); delete api.defaults.headers.common.Authorization; setSession(null); };
  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>;
}
