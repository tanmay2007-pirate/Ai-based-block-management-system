import { useState } from 'react';
import api from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: {} });
const DnDCalendar = withDragAndDrop(BigCalendar);
export default function WhatIfBoard() {
  const { data } = useFetch('/blocks', { plans: [] }); const [plans, setPlans] = useState([]); const [result, setResult] = useState(null); const [loading, setLoading] = useState(false);
  const [proposedChanges, setProposedChanges] = useState({ moves: [], combines: [] });
  const toggle = plan => { setResult(null); setPlans(current => current.some(item => item.id === plan.id) ? current.filter(item => item.id !== plan.id) : [...current, plan]); };
  const onDrop = ({ event, start }) => { const plan = event.resource; setPlans(current => current.some(item => item.id === plan.id) ? current : [...current, plan]); setResult(null); setProposedChanges(current => ({ ...current, moves: [...current.moves.filter(item => item.taskId !== plan.trains?.[0]?.task_id), { taskId: plan.trains?.[0]?.task_id || plan.id, newStartTime: start.toISOString(), corridorId: plan.section }] })); };
  const buildChanges = () => ({ moves: proposedChanges.moves, combines: plans.length > 1 ? [{ taskIds: plans.flatMap(plan => plan.trains?.map(item => item.task_id).filter(Boolean) || []), corridorId: plans[0].section, startTime: plans[0].planned_start, endTime: plans[0].planned_end }] : proposedChanges.combines });
  const simulate = async () => { setLoading(true); try { const response = await api.post('/schedule/simulate', { horizon: 'week', proposedChanges: buildChanges() }); setResult(response.data); } catch (error) { setResult({ error: error.response?.data?.message || 'Simulation unavailable' }); } finally { setLoading(false); } };
  const confirm = async () => { await api.post('/schedule/commit-proposed', { horizon: 'week', proposedChanges: buildChanges() }); setPlans([]); setProposedChanges({ moves: [], combines: [] }); setResult(null); };
  const events = (data.plans || []).map(plan => ({ title: `${plan.section}${plans.some(item => item.id === plan.id) ? ' • selected' : ''}`, start: new Date(plan.planned_start), end: new Date(plan.planned_end), resource: plan }));
  return <><div className="page-title"><div><span className="eyebrow">DECISION SUPPORT</span><h1>What-if simulator</h1></div><div><button className="primary" onClick={simulate} disabled={loading || !plans.length}>{loading ? 'Simulating…' : 'Simulate'}</button>{result && !result.error && <><button className="secondary" onClick={confirm}>Confirm</button><button className="secondary" onClick={() => { setPlans([]); setProposedChanges({ moves: [], combines: [] }); setResult(null); }}>Discard</button></>}</div></div><div className="panel"><p className="muted">Drag a block to a new time, or click two blocks to propose a bundle.</p><DnDCalendar localizer={localizer} events={events} startAccessor="start" endAccessor="end" onEventDrop={onDrop} onSelectEvent={event => toggle(event.resource)} resizable={false} style={{ height: 560 }} /></div>{result && <div className="panel"><h3>Simulation result</h3>{result.error ? <div className="error">{result.error}</div> : <div className="stats"><div className="stat-card"><span>Tasks completed</span><strong>{result.metrics?.maintenance_tasks_completed ?? 0}</strong></div><div className="stat-card"><span>Block windows</span><strong>{result.metrics?.separate_block_windows ?? 0}</strong></div><div className="stat-card"><span>Downtime hours</span><strong>{result.metrics?.track_downtime_hours ?? 0}</strong></div></div>}</div>}</>;
}
