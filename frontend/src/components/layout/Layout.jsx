import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API } from '../../services/api';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [toast, setToast] = useState('');
  useEffect(() => {
    const socket = io(API.replace('/api', ''));
    const refresh = () => window.dispatchEvent(new Event('railway-refresh'));
    socket.on('conflict-detected', data => { setToast(`Conflict detected on ${data.section || 'corridor'}`); setTimeout(() => setToast(''), 4000); });
    ['task-added', 'task-deleted', 'bulk-tasks-added', 'block-created', 'block-approved', 'block-rejected', 'schedule-reoptimized'].forEach(event => socket.on(event, refresh));
    return () => socket.disconnect();
  }, []);
  return <div className="app-shell"><Sidebar /><main><Topbar />{toast && <div className="toast">{toast}</div>}<div className="content"><Outlet /></div></main></div>;
}
