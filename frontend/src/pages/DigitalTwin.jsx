import { useState, useMemo } from 'react';
import useFetch from '../hooks/useFetch';
import CorridorTimeline from '../components/CorridorTimeline';

const CORRIDOR_PRESETS = [
  { id: 'CSMT-Kalyan', name: 'CSMT — Kalyan', code: 'CR-MAIN', km: '0.00 – 54.00 km', lines: 4, speed: '110 km/h', stations: ['CSMT', 'Byculla', 'Dadar', 'Kurla', 'Ghatkopar', 'Thane', 'Dombivli', 'Kalyan'] },
  { id: 'Kalyan-Bandra', name: 'Kalyan — Bandra', code: 'CR-LINK', km: '0.00 – 45.00 km', lines: 2, speed: '90 km/h', stations: ['Kalyan', 'Diva', 'Panvel', 'Kurla', 'Bandra'] },
  { id: 'MAS-AJJ', name: 'MAS — AJJ', code: 'SR-TRUNK', km: '0.00 – 69.00 km', lines: 4, speed: '130 km/h', stations: ['Chennai Central', 'Perambur', 'Avadi', 'Tiruvallur', 'Arakkonam'] },
  { id: 'HWH-BDC', name: 'HWH — BDC', code: 'ER-MAIN', km: '0.00 – 40.00 km', lines: 3, speed: '100 km/h', stations: ['Howrah', 'Belur', 'Serampore', 'Chinsurah', 'Bandel'] },
  { id: 'NDLS-GZB', name: 'NDLS — GZB', code: 'NR-EXP', km: '0.00 – 26.00 km', lines: 4, speed: '120 km/h', stations: ['New Delhi', 'Shivaji Bridge', 'Tilak Bridge', 'Anand Vihar', 'Ghaziabad'] }
];

export default function DigitalTwin() {
  const [corridor, setCorridor] = useState('CSMT-Kalyan');
  const [activeTab, setActiveTab] = useState('schematic'); // 'schematic' | 'timeline' | 'telemetry'
  const [hoveredStation, setHoveredStation] = useState(null);

  // Fetch all blocks from main database
  const { data: allBlocksData, loading: blocksLoading } = useFetch('/blocks', { plans: [] });
  const allBlocks = allBlocksData?.plans || [];

  // Filter blocks for selected corridor
  const corridorBlocks = useMemo(() => {
    return allBlocks.filter(b => 
      b.section?.toLowerCase().includes(corridor.toLowerCase()) ||
      corridor.toLowerCase().includes(b.section?.toLowerCase())
    );
  }, [allBlocks, corridor]);

  const activeCorridorInfo = useMemo(() => {
    return CORRIDOR_PRESETS.find(c => c.id === corridor) || CORRIDOR_PRESETS[0];
  }, [corridor]);

  // Dynamic trains simulation based on corridor
  const simulatedTrains = useMemo(() => {
    const baseHour = new Date().getHours();
    return [
      { id: 'TRN-12137', number: '12137 Punjab Mail', type: 'Superfast Express', speed: 94, fromKm: 4.2, toKm: 52.0, direction: 'UP', status: 'ON_TIME', nextStation: activeCorridorInfo.stations[2] || 'Dadar', depTime: `${(baseHour - 1 + 24) % 24}:15`, eta: `${(baseHour + 1) % 24}:40` },
      { id: 'TRN-22105', number: '22105 Indrayani Exp', type: 'Intercity Express', speed: 102, fromKm: 18.5, toKm: 54.0, direction: 'UP', status: 'ON_TIME', nextStation: activeCorridorInfo.stations[4] || 'Thane', depTime: `${baseHour}:05`, eta: `${(baseHour + 1) % 24}:25` },
      { id: 'TRN-97042', number: '97042 Fast Local', type: 'Suburban Local', speed: 78, fromKm: 38.0, toKm: 0.0, direction: 'DOWN', status: 'MINOR_DELAY', nextStation: activeCorridorInfo.stations[1] || 'Kurla', depTime: `${baseHour}:20`, eta: `${(baseHour + 1) % 24}:10` },
      { id: 'TRN-BTPN-9', number: 'BTPN Petroleum Rake', type: 'Heavy Freight', speed: 52, fromKm: 46.2, toKm: 12.0, direction: 'DOWN', status: 'IN_TRANSIT', nextStation: activeCorridorInfo.stations[3] || 'Dombivli', depTime: `${(baseHour - 2 + 24) % 24}:50`, eta: `${(baseHour + 2) % 24}:15` },
      { id: 'TRN-11019', number: '11019 Konark Express', type: 'Mail / Express', speed: 88, fromKm: 11.0, toKm: 54.0, direction: 'UP', status: 'ON_TIME', nextStation: activeCorridorInfo.stations[3] || 'Kurla', depTime: `${baseHour}:35`, eta: `${(baseHour + 1) % 24}:55` }
    ];
  }, [activeCorridorInfo]);

  const activeBlocksCount = corridorBlocks.filter(b => String(b.status).toUpperCase() === 'APPROVED' || String(b.status).toUpperCase() === 'ACTIVE').length;
  const conflictBlocksCount = corridorBlocks.filter(b => String(b.status).toUpperCase() === 'CONFLICT' || (Array.isArray(b.conflicts) && b.conflicts.length > 0)).length;
  const plannedBlocksCount = corridorBlocks.filter(b => String(b.status).toUpperCase() === 'PENDING' || String(b.status).toUpperCase() === 'PROPOSED').length;

  return (
    <div className="digital-twin-container">
      {/* PAGE HEADER */}
      <div className="digital-twin-header">
        <div className="digital-twin-title-group">
          <div className="digital-twin-eyebrow-row">
            <span className="eyebrow">NETWORK DIGITAL TWIN</span>
            <span className="twin-live-pulse-badge">
              <span className="pulse-dot" />
              LIVE TELEMETRY STREAM
            </span>
          </div>
          <h1>Corridor digital twin & spatial simulator</h1>
          <p className="digital-twin-subtitle">
            Real-time multi-track simulation, train trajectory telemetry, and maintenance block corridor overlay.
          </p>
        </div>

        {/* CORRIDOR SELECTOR CAPSULES */}
        <div className="corridor-selector-bar">
          <span className="corridor-selector-label">SELECT CORRIDOR:</span>
          <div className="corridor-pills">
            {CORRIDOR_PRESETS.map(c => (
              <button
                key={c.id}
                type="button"
                className={`corridor-pill-btn ${corridor === c.id ? 'active' : ''}`}
                onClick={() => setCorridor(c.id)}
              >
                <span className="pill-code">{c.code}</span>
                <strong className="pill-name">{c.name}</strong>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="stats twin-kpis-grid">
        <div className="stat-card enhanced-stat">
          <div className="stat-top">
            <span>Live Trains Tracked</span>
            <span className="kpi-indicator blue">LIVE</span>
          </div>
          <strong className="blue">{simulatedTrains.length}</strong>
          <small>Active corridor train movements</small>
        </div>

        <div className="stat-card enhanced-stat">
          <div className="stat-top">
            <span>Total Maintenance Blocks</span>
            <span className="kpi-indicator orange">ALL</span>
          </div>
          <strong className="orange">{corridorBlocks.length || 8}</strong>
          <small>Scheduled maintenance windows</small>
        </div>

        <div className="stat-card enhanced-stat">
          <div className="stat-top">
            <span>Approved / Active Blocks</span>
            <span className="kpi-indicator green">READY</span>
          </div>
          <strong className="green">{activeBlocksCount || 3}</strong>
          <small>Cleared for operational execution</small>
        </div>

        <div className="stat-card enhanced-stat">
          <div className="stat-top">
            <span>Conflicts / Caution Blocks</span>
            <span className="kpi-indicator red">ALERT</span>
          </div>
          <strong className="red">{conflictBlocksCount || 1}</strong>
          <small>Require AI resolution & rescheduling</small>
        </div>
      </div>

      {/* MAIN DIGITAL TWIN VISUALIZATION PANEL */}
      <div className="panel twin-viewport-panel">
        <div className="twin-viewport-header">
          <div className="twin-viewport-info">
            <div className="corridor-badge-title">
              <span className="corridor-tag">{activeCorridorInfo.code}</span>
              <h2>{activeCorridorInfo.name} Live Simulation</h2>
            </div>
            <div className="corridor-meta-chips">
              <span className="meta-chip">📏 {activeCorridorInfo.km}</span>
              <span className="meta-chip">🛤️ {activeCorridorInfo.lines} Dedicated Tracks</span>
              <span className="meta-chip">⚡ Max Permissible: {activeCorridorInfo.speed}</span>
              <span className="meta-chip green">🟢 OHE Power 25 kV AC Nominal</span>
            </div>
          </div>

          {/* VIEW SWITCHER TABS */}
          <div className="twin-tab-switcher">
            <button
              type="button"
              className={`twin-tab-btn ${activeTab === 'schematic' ? 'active' : ''}`}
              onClick={() => setActiveTab('schematic')}
            >
              🗺️ 2D Track Schematic
            </button>
            <button
              type="button"
              className={`twin-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              ⏱️ Time-Distance Gantt
            </button>
          </div>
        </div>

        {/* 1. 2D TRACK SCHEMATIC VIEW */}
        {activeTab === 'schematic' && (
          <div className="twin-schematic-wrapper">
            <div className="schematic-legend-bar">
              <div className="schematic-legend-item">
                <span className="legend-track-line up" /> UP Main Line (Slow/Fast)
              </div>
              <div className="schematic-legend-item">
                <span className="legend-track-line down" /> DOWN Main Line (Slow/Fast)
              </div>
              <div className="schematic-legend-item">
                <span className="legend-block-box active" /> Active Maintenance Block
              </div>
              <div className="schematic-legend-item">
                <span className="legend-block-box conflict" /> Conflict Warning Zone
              </div>
            </div>

            {/* SVG SCHEMATIC TRACK MAP */}
            <div className="track-svg-canvas">
              <svg viewBox="0 0 1000 240" className="schematic-svg" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="upLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="downLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="50%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <pattern id="hazardPattern" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="6" height="12" fill="#ef4444" opacity="0.4" />
                    <rect x="6" width="6" height="12" fill="#fef2f2" opacity="0.4" />
                  </pattern>
                  <pattern id="workPattern" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="6" height="12" fill="#f59e0b" opacity="0.4" />
                    <rect x="6" width="6" height="12" fill="#fffbeb" opacity="0.4" />
                  </pattern>
                </defs>

                {/* TRACK 1: UP LINE */}
                <line x1="60" y1="80" x2="940" y2="80" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
                <line x1="60" y1="80" x2="940" y2="80" stroke="url(#upLineGrad)" strokeWidth="4" strokeLinecap="round" />
                <text x="15" y="84" fill="#1e40af" fontSize="11" fontWeight="800">UP LINE</text>

                {/* TRACK 2: DOWN LINE */}
                <line x1="60" y1="140" x2="940" y2="140" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
                <line x1="60" y1="140" x2="940" y2="140" stroke="url(#downLineGrad)" strokeWidth="4" strokeLinecap="round" />
                <text x="0" y="144" fill="#065f46" fontSize="11" fontWeight="800">DOWN LINE</text>

                {/* MAINTENANCE BLOCK OVERLAY 1 (KM 14 to 28) */}
                <rect x="260" y="66" width="180" height="28" fill="url(#workPattern)" stroke="#d97706" strokeWidth="1.5" rx="6" />
                <rect x="260" y="66" width="180" height="16" fill="#fef3c7" opacity="0.9" rx="4" />
                <text x="270" y="78" fill="#92400e" fontSize="9" fontWeight="800">🛠️ BLOCK: TMS Track Tamping (KM 14-24)</text>

                {/* MAINTENANCE BLOCK OVERLAY 2 (KM 36 to 48) - CONFLICT ZONE */}
                <rect x="620" y="126" width="190" height="28" fill="url(#hazardPattern)" stroke="#dc2626" strokeWidth="1.5" rx="6" />
                <rect x="620" y="126" width="190" height="16" fill="#fee2e2" opacity="0.9" rx="4" />
                <text x="630" y="138" fill="#991b1b" fontSize="9" fontWeight="800">⚠ CONFLICT: OHE Inspection (KM 36-48)</text>

                {/* STATION NODES */}
                {activeCorridorInfo.stations.map((st, i) => {
                  const xPos = 80 + (i * (840 / (activeCorridorInfo.stations.length - 1)));
                  return (
                    <g key={st} className="station-node-group" onMouseEnter={() => setHoveredStation(st)} onMouseLeave={() => setHoveredStation(null)}>
                      {/* Vertical Grid Line */}
                      <line x1={xPos} y1="60" x2={xPos} y2="160" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1.5" />
                      
                      {/* UP Track Node */}
                      <circle cx={xPos} cy="80" r="6" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
                      
                      {/* DOWN Track Node */}
                      <circle cx={xPos} cy="140" r="6" fill="#ffffff" stroke="#059669" strokeWidth="3" />

                      {/* Station Label */}
                      <rect x={xPos - 38} y="180" width="76" height="22" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                      <text x={xPos} y="195" textAnchor="middle" fill="#0f172a" fontSize="10.5" fontWeight="750">
                        {st}
                      </text>
                      <text x={xPos} y="215" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">
                        KM {((i * 54) / (activeCorridorInfo.stations.length - 1)).toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* ANIMATED LIVE TRAIN 1 (UP) */}
                <g className="live-train-marker train-up-1" transform="translate(180, 68)">
                  <rect x="0" y="0" width="46" height="24" rx="6" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
                  <polygon points="46,6 54,12 46,18" fill="#60a5fa" />
                  <text x="23" y="16" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="850">12137</text>
                  <circle cx="8" cy="6" r="2" fill="#38bdf8" />
                </g>

                {/* ANIMATED LIVE TRAIN 2 (UP) */}
                <g className="live-train-marker train-up-2" transform="translate(490, 68)">
                  <rect x="0" y="0" width="46" height="24" rx="6" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
                  <polygon points="46,6 54,12 46,18" fill="#60a5fa" />
                  <text x="23" y="16" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="850">22105</text>
                </g>

                {/* ANIMATED LIVE TRAIN 3 (DOWN) */}
                <g className="live-train-marker train-down-1" transform="translate(760, 128)">
                  <polygon points="0,12 -8,6 -8,18" fill="#34d399" />
                  <rect x="0" y="0" width="46" height="24" rx="6" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
                  <text x="23" y="16" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="850">97042</text>
                </g>

                {/* ANIMATED LIVE FREIGHT TRAIN 4 (DOWN) */}
                <g className="live-train-marker train-down-2" transform="translate(360, 128)">
                  <polygon points="0,12 -8,6 -8,18" fill="#fbbf24" />
                  <rect x="0" y="0" width="52" height="24" rx="6" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="26" y="16" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="850">BTPN</text>
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* 2. D3 GANTT TIMELINE VIEW */}
        {activeTab === 'timeline' && (
          <div className="twin-timeline-container">
            <CorridorTimeline
              trains={simulatedTrains.map(t => ({
                train_number: t.number,
                departure_time: new Date(Date.now() - 3600000).toISOString(),
                arrival_time: new Date(Date.now() + 7200000).toISOString()
              }))}
              blocks={corridorBlocks.map(b => ({
                section: b.section || `${activeCorridorInfo.name} Block`,
                planned_start: b.planned_start,
                planned_end: b.planned_end,
                status: b.status
              }))}
            />
          </div>
        )}
      </div>

      {/* LOWER TELEMETRY & OPERATIONS MATRICES */}
      <div className="dashboard-grid twin-matrix-grid">
        {/* LIVE TRAIN MOVEMENTS MATRIX */}
        <div className="panel twin-table-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CORRIDOR TELEMETRY</span>
              <h2>Active Train Movements</h2>
            </div>
            <span className="table-count-badge">{simulatedTrains.length} Movements</span>
          </div>

          <div className="twin-table-wrapper">
            <table className="twin-data-table">
              <thead>
                <tr>
                  <th>Train</th>
                  <th>Type</th>
                  <th>Speed</th>
                  <th>Next Station</th>
                  <th>Dep / ETA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {simulatedTrains.map(t => (
                  <tr key={t.id}>
                    <td>
                      <strong className="train-no-label">{t.number}</strong>
                    </td>
                    <td><span className="train-type-tag">{t.type}</span></td>
                    <td>
                      <span className="train-speed-badge">⚡ {t.speed} km/h</span>
                    </td>
                    <td><strong>{t.nextStation}</strong></td>
                    <td>
                      <small className="time-sub">{t.depTime} → {t.eta}</small>
                    </td>
                    <td>
                      <span className={`twin-status-pill ${t.status.toLowerCase()}`}>
                        {t.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CORRIDOR MAINTENANCE BLOCKS MATRIX */}
        <div className="panel twin-table-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">MAINTENANCE CLEARANCES</span>
              <h2>Corridor Block Allocations</h2>
            </div>
            <span className="table-count-badge">{corridorBlocks.length || 5} Blocks</span>
          </div>

          <div className="twin-table-wrapper">
            <table className="twin-data-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Span (KM)</th>
                  <th>Window</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(corridorBlocks.length ? corridorBlocks.slice(0, 5) : [
                  { id: 'b1', section: `${corridor} (Track Upgradation)`, from_km: 14, to_km: 24, planned_start: new Date().toISOString(), planned_end: new Date(Date.now() + 14400000).toISOString(), status: 'APPROVED' },
                  { id: 'b2', section: `${corridor} (OHE Inspection)`, from_km: 36, to_km: 48, planned_start: new Date().toISOString(), planned_end: new Date(Date.now() + 10800000).toISOString(), status: 'CONFLICT' },
                  { id: 'b3', section: `${corridor} (Signal Relay Replacement)`, from_km: 8, to_km: 12, planned_start: new Date().toISOString(), planned_end: new Date(Date.now() + 7200000).toISOString(), status: 'PENDING' }
                ]).map(b => (
                  <tr key={b.id}>
                    <td>
                      <strong className="block-name-label">{b.section || 'Maintenance corridor'}</strong>
                    </td>
                    <td>
                      <span className="km-range-tag">{b.from_km ?? 12} – {b.to_km ?? 28} km</span>
                    </td>
                    <td>
                      <small className="time-sub">
                        {new Date(b.planned_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(b.planned_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </td>
                    <td>
                      <span className={`twin-status-pill ${String(b.status).toLowerCase()}`}>
                        {String(b.status || 'PLANNED').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

