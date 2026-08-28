import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import AddDefectForm from '../defects/AddDefectForm';
import BulkUploadModal from '../defects/BulkUploadModal';
import DeleteConfirmButton from '../defects/DeleteConfirmButton';

export default function PriorityTable() {
  const { data } = useFetch('/tasks?status=pending&limit=100', { tasks: [] }); const [department, setDepartment] = useState(''); const [showAdd, setShowAdd] = useState(false); const [showBulk, setShowBulk] = useState(false);
  const tasks = (data.tasks || []).filter(task => !department || task.department === department);
  const refresh = () => window.dispatchEvent(new Event('railway-refresh'));
  return <><div className="page-title"><div><span className="eyebrow">MAINTENANCE</span><h1>Priority list</h1></div><div className="priority-actions"><button className="primary" onClick={() => setShowAdd(!showAdd)}>Add defect</button><button className="secondary" onClick={() => setShowBulk(!showBulk)}>Bulk upload</button><select value={department} onChange={event => setDepartment(event.target.value)}><option value="">All departments</option><option value="TMS">Engineering</option><option value="TDMS">Traction</option><option value="SMMS">Signal</option></select></div></div>{showAdd && <div className="panel"><AddDefectForm onComplete={() => { setShowAdd(false); refresh(); }} /></div>}{showBulk && <div className="panel"><BulkUploadModal onComplete={refresh} /></div>}<div className="panel table-wrap"><table><thead><tr><th>Task ID</th><th>Department</th><th>Priority</th><th>Severity</th><th>Status</th><th /></tr></thead><tbody>{tasks.map(task => <tr key={task.id}><td className="mono">{task.id.slice(0, 8)}</td><td>{task.department}</td><td><span className={`badge ${task.priority_score > 80 ? 'red' : task.priority_score >= 50 ? 'orange' : 'green'}`}>{Math.round(task.priority_score)}</span></td><td>{task.severity}</td><td>{task.status}</td><td><NavLink to={`/priority-list/${task.id}/explain`}>Explain</NavLink> <DeleteConfirmButton task={task} onDeleted={refresh} /></td></tr>)}</tbody></table>{!tasks.length && <p className="muted empty">No pending tasks available.</p>}</div></>;
}
