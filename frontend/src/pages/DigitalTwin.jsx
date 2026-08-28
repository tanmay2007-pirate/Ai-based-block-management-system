import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import CorridorTimeline from '../components/twin/CorridorTimeline';

export default function DigitalTwin() {
  const [corridor, setCorridor] = useState('CSMT-Kalyan');

  const { data, loading } = useFetch(
    `/corridors/${encodeURIComponent(corridor)}/timeline`,
    {
      trains: [],
      blocks: []
    }
  );

  const corridors = [
    corridor,
    ...new Set(
      (data.blocks || [])
        .map(item => item.section)
        .filter(Boolean)
    )
  ].filter(Boolean);

  const trains = data.trains || [];
  const blocks = data.blocks || [];

  const activeBlocks = blocks.filter(
    block => block.status?.toLowerCase() === 'active'
  ).length;

  const plannedBlocks = blocks.filter(
    block => block.status?.toLowerCase() !== 'active'
  ).length;

  return (
    <>
      <div className="page-title digital-twin-heading">
        <div>
          <span className="eyebrow">NETWORK VISUALIZATION</span>
          <h1>Corridor digital twin</h1>
          <p className="muted">
            Live operational view of trains, maintenance blocks and corridor activity.
          </p>
        </div>

        <select
          value={corridor}
          onChange={event => setCorridor(event.target.value)}
        >
          {corridors.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="stats">
        <div className="stat-card enhanced-stat">
          <div className="stat-top">
            <span>Trains tracked</span>
            <div className="stat-icon blue">↔</div>
          </div>
          <strong className="blue">{trains.length}</strong>
          <small>Corridor movements</small>
        </div>

        <div className="stat-card enhanced-stat">
          <div className="stat-top">
            <span>Total blocks</span>
            <div className="stat-icon orange">■</div>
          </div>
          <strong className="orange">{blocks.length}</strong>
          <small>Scheduled windows</small>
        </div>

        <div className="stat-card enhanced-stat">
          <div className="stat-top">
            <span>Active blocks</span>
            <div className="stat-icon red">!</div>
          </div>
          <strong className="red">{activeBlocks}</strong>
          <small>Currently active</small>
        </div>

        <div className="stat-card enhanced-stat">
          <div className="stat-top">
            <span>Planned blocks</span>
            <div className="stat-icon">◷</div>
          </div>
          <strong>{plannedBlocks}</strong>
          <small>Upcoming activity</small>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">LIVE CORRIDOR VIEW</span>
            <h2>{corridor}</h2>
          </div>

          <span className="status-badge">
            ● LIVE DATA
          </span>
        </div>

        {loading ? (
          <div className="empty">
            <p>Loading corridor telemetry…</p>
          </div>
        ) : (
          <CorridorTimeline
            trains={trains}
            blocks={blocks}
          />
        )}
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">TRAIN MOVEMENTS</span>
              <h2>Current corridor traffic</h2>
            </div>
          </div>

          {trains.length ? (
            <div className="health-list">
              {trains.slice(0, 6).map((train, index) => (
                <div key={train.id || train.train_number || index}>
                  <span>
                    {train.train_number || `Train ${index + 1}`}
                  </span>
                  <b>
                    {train.departure_time
                      ? new Date(train.departure_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Scheduled'}
                  </b>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted empty">
              No train movements available.
            </p>
          )}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">BLOCK ACTIVITY</span>
              <h2>Maintenance windows</h2>
            </div>
          </div>

          {blocks.length ? (
            <div className="health-list">
              {blocks.slice(0, 6).map((block, index) => (
                <div key={block.id || index}>
                  <span>
                    {block.section || 'Railway section'}
                  </span>
                  <b>
                    {block.status || 'PLANNED'}
                  </b>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted empty">
              No maintenance blocks available.
            </p>
          )}
        </div>
      </div>
    </>
  );
}