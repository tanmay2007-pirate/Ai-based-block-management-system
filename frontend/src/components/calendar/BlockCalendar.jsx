import { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import useFetch from '../../hooks/useFetch';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ExplainPanel from '../priority/ExplainPanel';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: {} });
export default function BlockCalendar() {
  const { data, loading } = useFetch('/blocks', { plans: [] }); const [selected, setSelected] = useState(null); const [view, setView] = useState(Views.WEEK); const [actionError, setActionError] = useState(''); const { session } = useAuth();
  const events = (data.plans || []).map(plan => ({ title: plan.section, start: new Date(plan.planned_start), end: new Date(plan.planned_end), resource: { ...plan, department: plan.trains?.find(item => item.task)?.task?.department || 'TMS' } }));
  const eventPropGetter = event => ({ style: { backgroundColor: event.resource.department === 'TDMS' ? '#d18b2e' : event.resource.department === 'SMMS' ? '#3b9b69' : '#287099', border: event.resource.status === 'PROPOSED' ? '2px dashed #fff' : '2px solid transparent' } });
  const taskId = selected?.trains?.find(item => item.task_id)?.task_id;
  const changeStatus = async status => { setActionError(''); try { const response = await api.patch(`/blocks/${selected.id}`, { status }); setSelected(response.data.plan); window.dispatchEvent(new Event('railway-refresh')); } catch (error) { setActionError(error.response?.data?.message || 'Unable to update block status'); } };
  const canReview = ['control_office', 'admin'].includes(session?.user?.role);
  return <><div className="page-title"><div><span className="eyebrow">PLANNING</span><h1>Block calendar</h1></div><button className="secondary" onClick={() => setView(view === Views.WEEK ? Views.MONTH : Views.WEEK)}>{view === Views.WEEK ? 'Week' : 'Month'} ▾</button></div><div className="panel">{loading ? <p>Loading blocks…</p> : <BigCalendar localizer={localizer} events={events} view={view} onView={setView} startAccessor="start" endAccessor="end" eventPropGetter={eventPropGetter} onSelectEvent={event => { setActionError(''); setSelected(event.resource); }} style={{ height: 620 }} />}</div>{selected && <div className="detail-panel"><button className="close" onClick={() => setSelected(null)}>×</button><span className="eyebrow">BLOCK DETAILS</span><h2>{selected.section}</h2><p>{new Date(selected.planned_start).toLocaleString()} — {new Date(selected.planned_end).toLocaleString()}</p><span className={`badge ${selected.status === 'PROPOSED' ? 'orange' : selected.status === 'APPROVED' ? 'green' : 'red'}`}>{selected.status}</span>{canReview && selected.status === 'PROPOSED' && <div className="block-actions"><button className="primary" onClick={() => changeStatus('APPROVED')}>Approve</button><button className="secondary" onClick={() => changeStatus('REJECTED')}>Reject</button></div>}{actionError && <p className="error">{actionError}</p>}<h3>Linked tasks</h3>{(selected.trains || []).map(item => <div className="task-line" key={item.id}>{item.task_id || item.train_number || 'Operational movement'}</div>)}{taskId && <ExplainPanel taskId={taskId} onClose={() => setSelected(null)} />}</div>}</>;
}
