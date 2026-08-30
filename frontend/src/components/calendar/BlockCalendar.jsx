import { useMemo, useState } from 'react';
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views
} from 'react-big-calendar';
import {
  format,
  parse,
  startOfWeek,
  getDay
} from 'date-fns';
import useFetch from '../../hooks/useFetch';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ExplainPanel from '../priority/ExplainPanel';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {}
});

function StatusBadge({ status }) {
  const value = String(status || 'PLANNED').toUpperCase();

  return (
    <span className={`calendar-status ${value.toLowerCase()}`}>
      <i />
      {value.replaceAll('_', ' ')}
    </span>
  );
}

export default function BlockCalendar() {
  const { data, loading, error } = useFetch('/blocks', { plans: [] });
  const [selected, setSelected] = useState(null);
  const [showExplainTaskId, setShowExplainTaskId] = useState(null);
  const [view, setView] = useState(Views.WEEK);
  const [filter, setFilter] = useState('ALL');
  const [actionError, setActionError] = useState('');
  const { session } = useAuth();

  const plans = data?.plans || [];

  const events = useMemo(() => {
    return plans
      .filter(plan => {
        const status = String(plan.status || '').toUpperCase();

        if (filter === 'ALL') return true;
        if (filter === 'PENDING') {
          return status === 'PENDING' || status === 'PLANNED';
        }

        return status === filter;
      })
      .map(plan => ({
        title: plan.section || 'Railway Block',
        start: new Date(plan.planned_start),
        end: new Date(plan.planned_end),
        resource: plan
      }));
  }, [plans, filter]);

  const summary = useMemo(() => {
    const approved = plans.filter(
      p => String(p.status || '').toUpperCase() === 'APPROVED'
    ).length;

    const pending = plans.filter(p => {
      const status = String(p.status || '').toUpperCase();
      return status === 'PENDING' || status === 'PLANNED';
    }).length;

    const conflicts = plans.filter(p => {
      const status = String(p.status || '').toUpperCase();
      return status === 'CONFLICT' || status === 'REJECTED';
    }).length;

    const departments = new Set(
      plans.map(p => p.trains?.find(item => item.task)?.task?.department).filter(Boolean)
    );

    return {
      total: plans.length,
      approved,
      pending,
      conflicts,
      departments: departments.size
    };
  }, [plans]);

  const eventPropGetter = event => {
    const status = String(event.resource?.status || '').toUpperCase();
    let background = '#176b87';

    if (status === 'APPROVED') background = '#2d8a61';
    if (status === 'PENDING' || status === 'PLANNED') background = '#d18b2e';
    if (status === 'REJECTED' || status === 'CONFLICT') background = '#c14e4e';

    return {
      style: {
        backgroundColor: background,
        borderRadius: '6px',
        border: 'none',
        color: '#fff',
        fontWeight: 700,
        padding: '4px 7px',
        boxShadow: '0 2px 6px rgba(16,42,67,.12)'
      }
    };
  };

  const changeStatus = async status => {
    setActionError('');
    try {
      const response = await api.patch(`/blocks/${selected.id}`, { status });
      setSelected(response.data.plan);
      window.dispatchEvent(new Event('railway-refresh'));
    } catch (error) {
      setActionError(error.response?.data?.message || 'Unable to update block status');
    }
  };

  const canReview = ['control_office', 'admin'].includes(session?.user?.role);
  const taskId = selected?.trains?.find(item => item.task_id)?.task_id;

  return (
    <>
      <div className="calendar-heading">
        <div className="calendar-heading-copy">
          <span className="eyebrow">OPERATIONS PLANNING</span>
          <h1>Block planning calendar</h1>
          <p className="calendar-subtitle">
            Coordinate railway maintenance blocks, train movements and operational availability from one planning view.
          </p>
        </div>

        <div className="calendar-heading-actions">
          <div className="calendar-live-status"><i />LIVE PLANNING</div>
          <div className="calendar-view-switcher">
            <button className={view === Views.WEEK ? 'active' : ''} onClick={() => setView(Views.WEEK)}>Week</button>
            <button className={view === Views.MONTH ? 'active' : ''} onClick={() => setView(Views.MONTH)}>Month</button>
          </div>
        </div>
      </div>

      <div className="calendar-kpis">
        <div className="calendar-kpi">
          <div className="calendar-kpi-top"><span>Total blocks</span><div className="calendar-kpi-icon">▦</div></div>
          <strong>{summary.total}</strong>
          <small>Scheduled operations</small>
        </div>
        <div className="calendar-kpi approved">
          <div className="calendar-kpi-top"><span>Approved</span><div className="calendar-kpi-icon">✓</div></div>
          <strong>{summary.approved}</strong>
          <small>Ready for execution</small>
        </div>
        <div className="calendar-kpi pending">
          <div className="calendar-kpi-top"><span>Pending review</span><div className="calendar-kpi-icon">!</div></div>
          <strong>{summary.pending}</strong>
          <small>Require planning action</small>
        </div>
        <div className="calendar-kpi conflict">
          <div className="calendar-kpi-top"><span>Conflicts</span><div className="calendar-kpi-icon">⚠</div></div>
          <strong>{summary.conflicts}</strong>
          <small>Require resolution</small>
        </div>
      </div>

      <div className="calendar-control-panel">
        <div className="calendar-filter-group">
          <span className="eyebrow">BLOCK STATUS</span>
          <div className="calendar-filters">
            {['ALL', 'APPROVED', 'PENDING', 'CONFLICT'].map(option => (
              <button key={option} className={filter === option ? 'filter active' : 'filter'} onClick={() => setFilter(option)}>
                <i className="filter-indicator" />
                {option === 'ALL' ? 'All blocks' : option === 'PENDING' ? 'Pending' : option.charAt(0) + option.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="calendar-legend">
          <span><i className="legend-dot approved" />Approved</span>
          <span><i className="legend-dot pending" />Pending</span>
          <span><i className="legend-dot conflict" />Conflict</span>
        </div>
      </div>

      <div className="panel redesigned-calendar-panel">
        <div className="calendar-panel-header">
          <div>
            <span className="eyebrow">RAILWAY OPERATIONS</span>
            <h2>Maintenance block schedule</h2>
          </div>
          <div className="calendar-panel-meta">
            <span className="calendar-count">{events.length} blocks</span>
            <span className="calendar-dot-status"><i />Planning data synced</span>
          </div>
        </div>

        <div className="calendar-divider" />

        <div className="calendar-shell">
          {error ? (
            <div className="calendar-loading">
              <strong>Unable to load operational blocks</strong>
              <span>{error}</span>
            </div>
          ) : loading ? (
            <div className="calendar-loading">
              <div className="loading-ring" />
              <strong>Loading operational blocks…</strong>
              <span>Synchronizing with planning data</span>
            </div>
          ) : (
            <BigCalendar
              localizer={localizer}
              events={events}
              view={view}
              onView={setView}
              startAccessor="start"
              endAccessor="end"
              eventPropGetter={eventPropGetter}
              onSelectEvent={event => {
                setActionError('');
                setSelected(event.resource);
                setShowExplainTaskId(null);
              }}
              popup
              style={{ height: 650 }}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              messages={{
                today: 'Today',
                previous: '‹',
                next: '›',
                month: 'Month',
                week: 'Week',
                day: 'Day',
                agenda: 'Agenda',
                noEventsInRange: 'No railway blocks scheduled for this period.'
              }}
            />
          )}
        </div>
      </div>

      {selected && (
        <div className="calendar-detail-overlay">
          <div className="calendar-detail-panel">
            <button className="close calendar-close" onClick={() => { setSelected(null); setShowExplainTaskId(null); }} aria-label="Close">×</button>

            <div className="detail-panel-header">
              <span className="eyebrow">BLOCK DETAILS</span>
              <div className="detail-title-row">
                <div>
                  <h2>{selected.section || 'Railway block'}</h2>
                  <p className="muted">Operational maintenance window</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="detail-time-card">
              <span>PLANNED WINDOW</span>
              <div className="detail-time-row">
                <div>
                  <small>START</small>
                  <strong>{new Date(selected.planned_start).toLocaleString()}</strong>
                </div>
                <span>→</span>
                <div>
                  <small>END</small>
                  <strong>{new Date(selected.planned_end).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <span className="eyebrow">OPERATIONAL IMPACT</span>
              <div className="detail-metrics">
                <div>
                  <small>Linked movements</small>
                  <strong>{selected.trains?.length || 0}</strong>
                </div>
                <div>
                  <small>Section</small>
                  <strong>{selected.section || '—'}</strong>
                </div>
              </div>
            </div>

            {canReview && selected.status === 'PROPOSED' && (
              <div className="detail-section">
                <span className="eyebrow">APPROVAL</span>
                <div className="block-actions">
                  <button className="primary" onClick={() => changeStatus('APPROVED')}>Approve</button>
                  <button className="secondary" onClick={() => changeStatus('REJECTED')}>Reject</button>
                </div>
                {actionError && <p className="error">{actionError}</p>}
              </div>
            )}

            <div className="detail-section">
              <span className="eyebrow">LINKED TASKS & TRAINS</span>
              {(selected.trains || []).length ? (
                selected.trains.map((item, index) => (
                  <button type="button" className="task-line" key={item.id || index} onClick={() => setShowExplainTaskId(item.task_id || null)} disabled={!item.task_id}>
                    <strong>{item.task_id || item.train_number || 'Operational movement'}</strong>
                    {item.task?.department && <small>{item.task.department}</small>}
                  </button>
                ))
              ) : (
                <p className="muted">No linked movements.</p>
              )}
            </div>

            {showExplainTaskId && <ExplainPanel taskId={showExplainTaskId} onClose={() => setShowExplainTaskId(null)} />}
            {taskId && !showExplainTaskId && (
              <div className="detail-section">
                <span className="eyebrow">AI EXPLANATION</span>
                <p className="muted">This block is linked to a maintenance task. Planning intelligence can be reviewed from the priority workflow.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
