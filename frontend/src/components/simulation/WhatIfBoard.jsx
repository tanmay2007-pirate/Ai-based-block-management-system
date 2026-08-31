import { useState } from 'react';
import api from '../../services/api';
import useFetch from '../../hooks/useFetch';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {}
});

const DnDCalendar = withDragAndDrop(BigCalendar);

function Metric({ label, value, unit = '', tone = '' }) {
  return (
    <div className={`simulation-metric ${tone}`}>
      <span>{label}</span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
    </div>
  );
}

export default function WhatIfBoard() {
  const { data, error: blocksError } = useFetch('/blocks', { plans: [] });

  const [selectedPlans, setSelectedPlans] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [proposedChanges, setProposedChanges] = useState({
    moves: [],
    combines: []
  });

  const togglePlan = plan => {
    setResult(null);

    setSelectedPlans(current =>
      current.some(item => item.id === plan.id)
        ? current.filter(item => item.id !== plan.id)
        : [...current, plan]
    );
  };

  const onDrop = ({ event, start }) => {
    const plan = event.resource;
    const taskIds = (plan.trains || []).map(item => item.task_id).filter(Boolean);
    const idsToMove = taskIds.length > 0 ? taskIds : [plan.id];

    setSelectedPlans(current =>
      current.some(item => item.id === plan.id)
        ? current
        : [...current, plan]
    );

    setResult(null);

    setProposedChanges(current => ({
      ...current,
      moves: [
        ...current.moves.filter(item => !idsToMove.includes(item.taskId)),
        ...idsToMove.map(tid => ({
          taskId: tid,
          newStartTime: start.toISOString(),
          corridorId: plan.section || 'unknown'
        }))
      ]
    }));
  };

  const buildChanges = () => {
    const combines = [];
    const bySection = {};

    for (const plan of selectedPlans) {
      const sec = plan.section || 'General';
      bySection[sec] = bySection[sec] || [];
      bySection[sec].push(plan);
    }

    for (const [sec, plans] of Object.entries(bySection)) {
      if (plans.length > 1) {
        const taskIds = [
          ...new Set(
            plans.flatMap(p => (p.trains || []).map(i => i.task_id).filter(Boolean))
          )
        ];
        if (taskIds.length >= 2) {
          combines.push({
            taskIds,
            corridorId: sec,
            startTime: new Date(plans[0].planned_start).toISOString(),
            endTime: new Date(plans[0].planned_end).toISOString()
          });
        }
      }
    }

    return {
      moves: proposedChanges.moves,
      combines: combines.length > 0 ? combines : proposedChanges.combines
    };
  };

  const simulate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/schedule/simulate', {
        horizon: 'week',
        proposedChanges: buildChanges()
      });

      setResult(response.data);
    } catch (error) {
      setResult({
        error:
          error.response?.data?.message ||
          'Simulation unavailable'
      });
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    try {
      await api.post('/schedule/commit-proposed', {
        horizon: 'week',
        proposedChanges: buildChanges()
      });

      setSelectedPlans([]);
      setProposedChanges({ moves: [], combines: [] });
      setResult(null);
    } catch (error) {
      setResult({
        error:
          error.response?.data?.message ||
          'Unable to commit proposed schedule'
      });
    }
  };

  const discard = () => {
    setSelectedPlans([]);
    setProposedChanges({
      moves: [],
      combines: []
    });
    setResult(null);
  };

  const events = (data.plans || []).map(plan => ({
    title: `${plan.section || 'Railway block'}${
      selectedPlans.some(item => item.id === plan.id)
        ? ' • SELECTED'
        : ''
    }`,
    start: new Date(plan.planned_start),
    end: new Date(plan.planned_end),
    resource: plan
  }));

  const selectedCount = selectedPlans.length;
  const hasChanges =
    selectedCount > 0 || proposedChanges.moves.length > 0;

  return (
    <>
      <div className="simulation-heading">
        <div>
          <span className="eyebrow">DECISION SUPPORT</span>

          <h1>What-if simulator</h1>

          <p>
            Test alternative block schedules before applying them to
            the operational plan.
          </p>
        </div>

        <div className="simulation-actions">
          {result && !result.error && (
            <>
              <button className="secondary" onClick={discard}>
                Discard
              </button>

              <button className="secondary" onClick={confirm}>
                Confirm schedule
              </button>
            </>
          )}

          <button
            className="primary"
            onClick={simulate}
            disabled={loading || !hasChanges || Boolean(blocksError)}
          >
            {loading ? 'Running simulation…' : 'Run simulation'}
          </button>
        </div>
      </div>

      <div className="simulation-status-bar">
        <div>
          <span className="simulation-status-dot" />
          <strong>SIMULATION MODE</strong>
          <span>
            Changes are temporary until confirmed
          </span>
        </div>

        <div className="simulation-selection">
          <strong>{selectedCount}</strong>
          <span>blocks selected</span>
        </div>
      </div>

      <div className="simulation-layout">
        <div className="panel simulation-calendar-panel">
          <div className="simulation-panel-heading">
            <div>
              <span className="eyebrow">PROPOSED TIMELINE</span>
              <h2>Move or combine railway blocks</h2>
            </div>

            <span className="simulation-help">
              Drag blocks to change timing
            </span>
          </div>

          <div className="simulation-instructions">
            <div>
              <span className="instruction-number">01</span>
              <div>
                <strong>Select blocks</strong>
                <small>
                  Click blocks to include them in the scenario.
                </small>
              </div>
            </div>

            <div>
              <span className="instruction-number">02</span>
              <div>
                <strong>Move blocks</strong>
                <small>
                  Drag a block to propose a new time.
                </small>
              </div>
            </div>

            <div>
              <span className="instruction-number">03</span>
              <div>
                <strong>Simulate</strong>
                <small>
                  Check impact before committing changes.
                </small>
              </div>
            </div>
          </div>

          <div className="simulation-calendar">
            {blocksError ? (
              <div className="scenario-empty">
                <strong>Unable to load block plans</strong>
                <p>{blocksError}</p>
              </div>
            ) : (
              <DnDCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                onEventDrop={onDrop}
                onSelectEvent={event =>
                  togglePlan(event.resource)
                }
                resizable={false}
                popup
                style={{ height: 590 }}
              />
            )}
          </div>
        </div>

        <aside className="simulation-side">
          <div className="panel scenario-panel">
            <div className="simulation-panel-heading">
              <div>
                <span className="eyebrow">SCENARIO</span>
                <h2>Current changes</h2>
              </div>
            </div>

            {!hasChanges ? (
              <div className="scenario-empty">
                <div className="scenario-empty-icon">+</div>
                <strong>No proposed changes</strong>
                <p>
                  Select a block or drag one to another time
                  window to build a scenario.
                </p>
              </div>
            ) : (
              <div className="scenario-list">
                {selectedPlans.map(plan => (
                  <div
                    className="scenario-item"
                    key={plan.id}
                  >
                    <div>
                      <strong>
                        {plan.section || 'Railway block'}
                      </strong>
                      <small>
                        {plan.status || 'PLANNED'}
                      </small>
                    </div>

                    <button
                      onClick={() => togglePlan(plan)}
                      aria-label="Remove block"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {proposedChanges.moves.map(
                  (move, index) => (
                    <div
                      className="scenario-item moved"
                      key={`${move.taskId}-${index}`}
                    >
                      <div>
                        <strong>
                          Schedule adjustment
                        </strong>
                        <small>
                          New proposed time
                        </small>
                      </div>

                      <span>↗</span>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="scenario-footer">
              <span>Scenario horizon</span>
              <strong>7 days</strong>
            </div>
          </div>

          {result && (
            <div
              className={`panel simulation-result ${
                result.error ? 'has-error' : ''
              }`}
            >
              <div className="simulation-panel-heading">
                <div>
                  <span className="eyebrow">
                    SIMULATION OUTPUT
                  </span>
                  <h2>
                    {result.error
                      ? 'Simulation failed'
                      : 'Impact assessment'}
                  </h2>
                </div>
              </div>

              {result.error ? (
                <div className="simulation-error">
                  {result.error}
                </div>
              ) : (
                <>
                  <div className="simulation-metrics">
                    <Metric
                      label="Tasks completed"
                      value={
                        result.metrics
                          ?.maintenance_tasks_completed ?? 0
                      }
                      tone="green"
                    />

                    <Metric
                      label="Block windows"
                      value={
                        result.metrics
                          ?.separate_block_windows ?? 0
                      }
                      tone="blue"
                    />

                    <Metric
                      label="Track downtime"
                      value={
                        result.metrics
                          ?.track_downtime_hours ?? 0
                      }
                      unit="hrs"
                      tone="orange"
                    />
                  </div>

                  {result.conflicts && result.conflicts.length > 0 && (
                    <div style={{
                      margin: '12px 0',
                      padding: '10px 12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#b91c1c'
                    }}>
                      <strong style={{ display: 'block', marginBottom: '4px' }}>
                        ⚠️ Safety / Operational Conflicts:
                      </strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.4 }}>
                        {result.conflicts.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="simulation-result-note">
                    <span>AI PLANNING CHECK</span>
                    <p>
                      Review these projected impacts before
                      confirming the proposed schedule.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
