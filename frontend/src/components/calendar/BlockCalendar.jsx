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

function StatusBadge({ status, hasConflict, isRejected }) {
  let value = String(status || 'PLANNED').toUpperCase();
  let tone = value.toLowerCase();

  if (isRejected || value === 'REJECTED') {
    value = 'REJECTED';
    tone = 'rejected';
  } else if (hasConflict) {
    value = 'CONFLICT';
    tone = 'conflict';
  } else if (value === 'APPROVED') {
    tone = 'approved';
  } else {
    tone = 'pending';
  }

  return (
    <span className={`calendar-status ${tone}`}>
      <i />
      {value.replaceAll('_', ' ')}
    </span>
  );
}

export default function BlockCalendar() {
  const { data, loading, error } = useFetch('/blocks', { plans: [] });
  const [selected, setSelected] = useState(null);
  const [showExplainTaskId, setShowExplainTaskId] = useState(null);
  const [selectedMovementIndex, setSelectedMovementIndex] = useState(null);
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date('2026-08-31T00:00:00.000Z'));
  const [filter, setFilter] = useState('ALL');
  const [actionError, setActionError] = useState('');
  const { session } = useAuth();

  const plans = data?.plans || [];

  const isRejected = (plan) => {
    return String(plan?.status || '').toUpperCase() === 'REJECTED';
  };

  const hasConflict = (plan) => {
    const status = String(plan?.status || '').toUpperCase();
    return (
      (status === 'CONFLICT' || (Array.isArray(plan?.conflicts) && plan.conflicts.length > 0)) &&
      !isRejected(plan)
    );
  };

  const getMovementConflictInfo = (item, block) => {
    if (!block) return null;

    if (isRejected(block)) {
      return {
        hasConflict: true,
        type: 'ADMIN REJECTION',
        severity: 'HIGH',
        text: block.conflict_flags?.rejection_reason || `Block window rejected on ${block.section}. Movement ${item.train_number || item.task?.source_id || ''} cannot proceed as scheduled.`,
        isResolved: false,
      };
    }

    // 1. Check if there are specific conflict records in block.conflicts
    if (Array.isArray(block.conflicts) && block.conflicts.length > 0) {
      const match = block.conflicts.find(c =>
        (item.train_number && c.description?.includes(item.train_number)) ||
        (item.task?.source_id && c.description?.includes(item.task.source_id)) ||
        (item.task?.department && c.description?.toLowerCase().includes(item.task.department.toLowerCase()))
      );

      if (match) {
        return {
          hasConflict: true,
          type: String(match.conflict_type || 'CAPACITY').toUpperCase(),
          severity: String(match.severity || 'MEDIUM').toUpperCase(),
          text: match.description || `Corridor overlap on ${block.section} during planned maintenance window.`,
          isResolved: Boolean(match.is_resolved),
        };
      }

      const first = block.conflicts[0];
      return {
        hasConflict: true,
        type: String(first.conflict_type || 'CORRIDOR OVERLAP').toUpperCase(),
        severity: String(first.severity || 'MEDIUM').toUpperCase(),
        text: first.description || `Corridor conflict on ${block.section} affecting planned track occupancy.`,
        isResolved: Boolean(first.is_resolved),
      };
    }

    // 2. Check if block has conflict status or conflict flags
    if (hasConflict(block)) {
      return {
        hasConflict: true,
        type: 'CAPACITY OVERLAP',
        severity: 'HIGH',
        text: `Corridor overlap and headway conflict detected on ${block.section} during planned maintenance window (${new Date(block.planned_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(block.planned_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). Operational movement requires speed restriction or path regulation.`,
        isResolved: false,
      };
    }

    // 3. Clear / No conflict
    return {
      hasConflict: false,
      type: 'HEADWAY CLEAR',
      severity: 'LOW',
      text: `No active headway, crossing, or corridor conflict detected for movement ${item.train_number || item.task?.source_id || 'window'} on ${block.section}. Safe headway maintained between ${block.from_km} km and ${block.to_km} km.`,
      isResolved: true,
    };
  };

  const isApproved = (plan) => {
    return String(plan?.status || '').toUpperCase() === 'APPROVED' && !hasConflict(plan) && !isRejected(plan);
  };

  const isPending = (plan) => {
    const status = String(plan?.status || '').toUpperCase();
    return (status === 'PENDING' || status === 'PROPOSED' || status === 'PLANNED') && !hasConflict(plan) && !isRejected(plan);
  };

  const counts = useMemo(() => {
    const total = plans.length;
    const approved = plans.filter(isApproved).length;
    const conflict = plans.filter(hasConflict).length;
    const pending = plans.filter(isPending).length;
    const rejected = plans.filter(isRejected).length;
    return { total, approved, pending, conflict, rejected };
  }, [plans]);

  const events = useMemo(() => {
    return plans
      .filter(plan => {
        if (filter === 'ALL') return !isRejected(plan); // Keep active view clean by default
        if (filter === 'APPROVED') return isApproved(plan);
        if (filter === 'PENDING') return isPending(plan);
        if (filter === 'CONFLICT') return hasConflict(plan);
        if (filter === 'REJECTED') return isRejected(plan);
        return true;
      })
      .map(plan => {
        const rejected = isRejected(plan);
        const conflict = hasConflict(plan);
        const approved = isApproved(plan);
        const prefix = rejected ? '✕ [REJECTED] ' : conflict ? '⚠ [CONFLICT] ' : approved ? '✓ ' : '⏳ ';
        return {
          title: `${prefix}${plan.section || 'Railway Block'} (${plan.from_km}-${plan.to_km} km)`,
          start: new Date(plan.planned_start),
          end: new Date(plan.planned_end),
          resource: plan,
          hasConflict: conflict,
          isApproved: approved,
          isRejected: rejected,
        };
      });
  }, [plans, filter]);

  const summary = useMemo(() => {
    const departments = new Set(
      plans.flatMap(p => (p.trains || []).map(item => item.task?.department)).filter(Boolean)
    );

    return {
      total: counts.total,
      approved: counts.approved,
      pending: counts.pending,
      conflicts: counts.conflict,
      rejected: counts.rejected,
      departments: departments.size
    };
  }, [plans, counts]);

  const eventPropGetter = event => {
    let background = '#d18b2e'; // amber for pending/proposed
    let border = '1px solid #b4721f';
    let opacity = 1;

    if (event.isRejected) {
      background = '#4a5568'; // slate / muted for rejected
      border = '1px dashed #718096';
      opacity = 0.85;
    } else if (event.hasConflict) {
      background = '#c14e4e'; // red for conflict
      border = '1px solid #9e3636';
    } else if (event.isApproved) {
      background = '#2d8a61'; // green for approved
      border = '1px solid #206d4b';
    }

    return {
      style: {
        backgroundColor: background,
        border,
        opacity,
        borderRadius: '6px',
        color: '#fff',
        fontWeight: 700,
        padding: '4px 8px',
        boxShadow: '0 2px 6px rgba(16,42,67,.12)',
        fontSize: '11px',
        lineHeight: 1.3
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
          <div className="calendar-kpi-top"><span>Total blocks</span></div>
          <strong>{summary.total}</strong>
          <small>Scheduled operations</small>
        </div>
        <div className="calendar-kpi approved">
          <div className="calendar-kpi-top"><span>Approved</span></div>
          <strong>{summary.approved}</strong>
          <small>Ready for execution</small>
        </div>
        <div className="calendar-kpi pending">
          <div className="calendar-kpi-top"><span>Pending review</span></div>
          <strong>{summary.pending}</strong>
          <small>Require planning action</small>
        </div>
        <div className="calendar-kpi conflict">
          <div className="calendar-kpi-top"><span>Conflicts</span></div>
          <strong>{summary.conflicts}</strong>
          <small>Require resolution</small>
        </div>
      </div>

      <div className="calendar-control-panel">
        <div className="calendar-filter-group">
          <span className="eyebrow">BLOCK STATUS</span>
          <div className="calendar-filters">
            {[
              { key: 'ALL', label: 'All blocks', count: counts.total },
              { key: 'APPROVED', label: 'Approved', count: counts.approved },
              { key: 'PENDING', label: 'Pending', count: counts.pending },
              { key: 'CONFLICT', label: 'Conflict', count: counts.conflict },
              { key: 'REJECTED', label: 'Rejected', count: counts.rejected }
            ].map(option => (
              <button
                key={option.key}
                type="button"
                className={filter === option.key ? 'filter active' : 'filter'}
                onClick={() => setFilter(option.key)}
              >
                <i className="filter-indicator" />
                <span>{option.label}</span>
                <span className="filter-count-badge">
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="calendar-legend">
          <span><i className="legend-dot approved" />Approved</span>
          <span><i className="legend-dot pending" />Pending</span>
          <span><i className="legend-dot conflict" />Conflict</span>
          <span><i className="legend-dot rejected" />Rejected</span>
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
              date={date}
              onNavigate={setDate}
              startAccessor="start"
              endAccessor="end"
              eventPropGetter={eventPropGetter}
              onSelectEvent={event => {
                setActionError('');
                setSelected(event.resource);
                setShowExplainTaskId(null);
                setSelectedMovementIndex(null);
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
            <button className="close calendar-close" onClick={() => { setSelected(null); setShowExplainTaskId(null); setSelectedMovementIndex(null); }} aria-label="Close">×</button>

            <div className="detail-panel-header">
              <span className="eyebrow">BLOCK DETAILS</span>
              <div className="detail-title-row">
                <div>
                  <h2>{selected.section || 'Railway block'}</h2>
                  <p className="muted">Operational maintenance window</p>
                </div>
                <StatusBadge status={selected.status} hasConflict={hasConflict(selected)} isRejected={isRejected(selected)} />
              </div>
            </div>

            {isRejected(selected) && (
              <div className="detail-section" style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '14px',
                marginTop: '10px'
              }}>
                <span className="eyebrow" style={{ color: '#b91c1c' }}>✕ ADMINISTRATIVE REJECTION</span>
                <p style={{ margin: '6px 0 0', fontSize: '12px', fontWeight: 600, color: '#7f1d1d' }}>
                  {selected.conflict_flags?.rejection_reason || 'This operational block was rejected by the Control Office.'}
                </p>
                {selected.conflict_flags?.rejected_by && (
                  <small style={{ display: 'block', marginTop: '4px', color: '#991b1b', fontSize: '10px' }}>
                    Actioned by: {selected.conflict_flags.rejected_by}
                  </small>
                )}

                {selected.conflict_flags?.ai_suggestion && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid #fed7aa',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#c2410c' }}>
                        ⚡ AI SUGGESTED ALTERNATIVE SLOT
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                        {selected.conflict_flags.ai_suggestion.confidence_score}% FEASIBILITY
                      </span>
                    </div>

                    <strong style={{ display: 'block', fontSize: '13px', color: '#9a3412', marginTop: '6px' }}>
                      {selected.conflict_flags.ai_suggestion.slot_label}
                    </strong>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', fontSize: '11px' }}>
                      <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <small style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>PROPOSED START</small>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                          {new Date(selected.conflict_flags.ai_suggestion.recommended_start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <small style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>PROPOSED END</small>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                          {new Date(selected.conflict_flags.ai_suggestion.recommended_end).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                      💡 <em>{selected.conflict_flags.ai_suggestion.reasoning}</em>
                    </p>

                    {canReview && (
                      <button
                        type="button"
                        style={{
                          marginTop: '10px',
                          width: '100%',
                          padding: '7px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          borderRadius: '5px',
                          border: 'none',
                          background: '#ea580c',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          alert(`Reschedule request queued for ${selected.conflict_flags.ai_suggestion.slot_label}`);
                        }}
                      >
                        Adopt AI Suggested Window
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

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

            {hasConflict(selected) && (
              <div className="detail-section" style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginTop: '12px'
              }}>
                <span className="eyebrow" style={{ color: '#b91c1c' }}>⚠ ACTIVE CONFLICTS ({selected.conflicts?.length || 1})</span>
                {Array.isArray(selected.conflicts) && selected.conflicts.length > 0 ? (
                  selected.conflicts.map((c, i) => (
                    <div key={c.id || i} style={{ marginTop: '8px', borderBottom: i < selected.conflicts.length - 1 ? '1px dashed #fca5a5' : 'none', paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '12px', color: '#991b1b', textTransform: 'uppercase' }}>{c.conflict_type} conflict</strong>
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontWeight: 700 }}>
                          {String(c.severity || 'MEDIUM').toUpperCase()}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#7f1d1d' }}>{c.description}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#7f1d1d' }}>
                    Corridor overlap detected on {selected.section} during planned maintenance window.
                  </p>
                )}
              </div>
            )}

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="eyebrow" style={{ margin: 0 }}>LINKED TASKS & TRAINS</span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Click to view conflict details</span>
              </div>

              {(selected.trains || []).length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.trains.map((item, index) => {
                    const isSelected = selectedMovementIndex === index;
                    const conflictInfo = getMovementConflictInfo(item, selected);

                    return (
                      <div
                        key={item.id || index}
                        style={{
                          border: isSelected
                            ? conflictInfo?.hasConflict
                              ? '1.5px solid #f87171'
                              : '1.5px solid #60a5fa'
                            : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          background: isSelected ? (conflictInfo?.hasConflict ? 'rgba(254, 242, 242, 0.6)' : 'rgba(239, 246, 255, 0.6)') : '#ffffff',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 2px 8px rgba(16, 42, 67, 0.08)' : '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMovementIndex(isSelected ? null : index);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: 'inherit'
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '12.5px', color: '#102a43', fontWeight: 800 }}>
                                {item.train_number ? `🚆 Train ${item.train_number}` : ''}
                                {item.train_number && item.task?.source_id ? ' • ' : ''}
                                {item.task?.source_id || (item.task_id ? `Task ${String(item.task_id).slice(0, 8)}` : 'Operational Movement')}
                              </strong>
                              {conflictInfo?.hasConflict ? (
                                <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c' }}>
                                  ⚠ CONFLICT
                                </span>
                              ) : (
                                <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#dcfce7', color: '#15803d' }}>
                                  ✓ CLEAR
                                </span>
                              )}
                            </div>
                            <small style={{ display: 'block', color: '#64748b', fontSize: '11px', marginTop: '2px', lineHeight: 1.3 }}>
                              {item.task?.description || item.notes || `${selected.section} corridor passage`}
                            </small>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {item.task?.department && (
                              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb' }}>
                                {item.task.department}
                              </span>
                            )}
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                              {isSelected ? '▲' : '▼'}
                            </span>
                          </div>
                        </button>

                        {/* EXPANDED CONFLICT & MOVEMENT DETAILS */}
                        {isSelected && conflictInfo && (
                          <div style={{
                            padding: '10px 12px 12px',
                            borderTop: '1px solid #e2e8f0',
                            background: '#ffffff'
                          }}>
                            {/* CONFLICT TEXT SECTION */}
                            <div style={{
                              background: conflictInfo.hasConflict ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                              border: conflictInfo.hasConflict ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(34, 197, 94, 0.25)',
                              borderRadius: '6px',
                              padding: '10px 12px',
                              marginBottom: '10px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  color: conflictInfo.hasConflict ? '#991b1b' : '#166534',
                                  letterSpacing: '0.6px',
                                  textTransform: 'uppercase'
                                }}>
                                  {conflictInfo.hasConflict ? '⚠ Active Conflict Text' : '✓ Conflict Status'}
                                </span>
                                <span style={{
                                  fontSize: '9.5px',
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: conflictInfo.hasConflict ? '#fee2e2' : '#dcfce7',
                                  color: conflictInfo.hasConflict ? '#991b1b' : '#166534'
                                }}>
                                  {conflictInfo.type} ({conflictInfo.severity})
                                </span>
                              </div>
                              <p style={{
                                margin: 0,
                                fontSize: '11.5px',
                                color: conflictInfo.hasConflict ? '#7f1d1d' : '#14532d',
                                lineHeight: 1.45,
                                fontWeight: 500
                              }}>
                                {conflictInfo.text}
                              </p>
                            </div>

                            {/* MOVEMENT & DEFECT PARAMETERS */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', marginBottom: '8px' }}>
                              {item.train_number && (
                                <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}>
                                  <small style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: 700 }}>TRAIN / RUNNER</small>
                                  <strong style={{ color: '#102a43' }}>{item.train_number}</strong>
                                </div>
                              )}
                              {item.impact_type && (
                                <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}>
                                  <small style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: 700 }}>IMPACT DISCIPLINE</small>
                                  <strong style={{ color: '#102a43', textTransform: 'capitalize' }}>{item.impact_type}</strong>
                                </div>
                              )}
                              {item.task?.source_id && (
                                <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}>
                                  <small style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: 700 }}>DEFECT SOURCE</small>
                                  <strong style={{ color: '#102a43' }}>{item.task.source_id}</strong>
                                </div>
                              )}
                              {item.task?.severity && (
                                <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}>
                                  <small style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: 700 }}>DEFECT SEVERITY</small>
                                  <strong style={{ color: '#102a43', textTransform: 'capitalize' }}>{item.task.severity}</strong>
                                </div>
                              )}
                              {item.task?.location && (
                                <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}>
                                  <small style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: 700 }}>CORRIDOR LOCATION</small>
                                  <strong style={{ color: '#102a43' }}>{item.task.location}</strong>
                                </div>
                              )}
                              {item.task?.priority_score !== undefined && item.task?.priority_score !== null && (
                                <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}>
                                  <small style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: 700 }}>AI PRIORITY SCORE</small>
                                  <strong style={{ color: '#2563eb' }}>{Math.round(item.task.priority_score)}/100</strong>
                                </div>
                              )}
                            </div>

                            {item.task?.description && (
                              <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '11px', marginBottom: '8px' }}>
                                <small style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: 700 }}>MAINTENANCE WORK</small>
                                <span style={{ color: '#334155' }}>{item.task.description}</span>
                              </div>
                            )}

                            {item.task_id && (
                              <button
                                type="button"
                                onClick={() => setShowExplainTaskId(showExplainTaskId === item.task_id ? null : item.task_id)}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  borderRadius: '5px',
                                  border: '1px solid #cbd5e1',
                                  background: showExplainTaskId === item.task_id ? '#1e293b' : '#f1f5f9',
                                  color: showExplainTaskId === item.task_id ? '#ffffff' : '#334155',
                                  cursor: 'pointer'
                                }}
                              >
                                {showExplainTaskId === item.task_id ? 'Hide AI Rationale' : 'View AI Prioritization Rationale →'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted">No linked movements.</p>
              )}
            </div>

            {showExplainTaskId && (
              <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '14px', overflowX: 'auto' }}>
                <ExplainPanel taskId={showExplainTaskId} onClose={() => setShowExplainTaskId(null)} />
              </div>
            )}
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
