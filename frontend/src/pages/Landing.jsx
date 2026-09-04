import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import RailwayLoader from '../components/RailwayLoader';
import './landing.css';

const capabilities = [
  {
    number: '01',
    title: 'AI Priority Engine',
    text: 'Rank maintenance work using operational risk, urgency and network impact.',
    icon: '◎',
  },
  {
    number: '02',
    title: 'Conflict Detection',
    text: 'Identify conflicts between maintenance blocks and train movements before execution.',
    icon: '◈',
  },
  {
    number: '03',
    title: 'Optimized Block Planning',
    text: 'Generate safer maintenance windows while protecting railway operations.',
    icon: '▣',
  },
  {
    number: '04',
    title: 'Digital Twin',
    text: 'Visualize your railway network and understand operational conditions in real time.',
    icon: '◇',
  },
];

const workflow = [
  {
    number: '01',
    title: 'Collect data',
    text: 'Maintenance requests, train schedules, infrastructure status and operational signals.',
  },
  {
    number: '02',
    title: 'AI prioritization',
    text: 'The intelligence engine evaluates risk, urgency, impact and historical patterns.',
  },
  {
    number: '03',
    title: 'Conflict analysis',
    text: 'Potential conflicts across trains, blocks and maintenance windows are detected.',
  },
  {
    number: '04',
    title: 'Block plan',
    text: 'A safe and efficient block window is generated for railway operations.',
  },
];

function NetworkGraphic() {
  return (
    <div className="landing-network" aria-hidden="true">
      <div className="network-grid" />

      <div className="network-heading">
        <span className="network-live-dot" />
        LIVE NETWORK
      </div>

      <div className="network-coordinate">
        19°07' N &nbsp; 72°52' E
      </div>

      <svg
        viewBox="0 0 760 500"
        className="railway-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="trackGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" />
            <stop offset="50%" />
            <stop offset="100%" />
          </linearGradient>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* MAIN RAILWAY CORRIDOR */}
        <path
          className="track track-main"
          d="M40 360 C130 320 175 250 245 260 S350 340 430 290 S555 150 720 120"
        />

        <path
          className="track-rail"
          d="M40 352 C130 312 175 242 245 252 S350 332 430 282 S555 142 720 112"
        />

        <path
          className="track-rail"
          d="M40 368 C130 328 175 258 245 268 S350 348 430 298 S555 158 720 128"
        />

        {/* SECOND TRACK */}
        <path
          className="track"
          d="M20 135 C125 180 185 120 270 150 S400 235 485 190 S610 125 735 205"
        />

        <path
          className="track-rail"
          d="M20 127 C125 172 185 112 270 142 S400 227 485 182 S610 117 735 197"
        />

        <path
          className="track-rail"
          d="M20 143 C125 188 185 128 270 158 S400 243 485 198 S610 133 735 213"
        />

        {/* MAINTENANCE SIDING */}
        <path
          className="track track-maintenance"
          d="M190 410 C275 365 315 365 390 395 S500 445 610 405"
        />

        <path
          className="track-rail maintenance-rail"
          d="M190 402 C275 357 315 357 390 387 S500 437 610 397"
        />

        <path
          className="track-rail maintenance-rail"
          d="M190 418 C275 373 315 373 390 403 S500 453 610 413"
        />

        {/* BLOCK DIVIDERS */}
        <line
          className="block-divider"
          x1="175"
          y1="305"
          x2="175"
          y2="330"
        />

        <line
          className="block-divider"
          x1="315"
          y1="303"
          x2="315"
          y2="328"
        />

        <line
          className="block-divider"
          x1="450"
          y1="270"
          x2="450"
          y2="295"
        />

        <line
          className="block-divider"
          x1="580"
          y1="165"
          x2="580"
          y2="190"
        />

        {/* SIGNALS */}
        <g className="rail-signal signal-green">
          <line x1="245" y1="252" x2="245" y2="220" />
          <circle cx="245" cy="214" r="7" />
        </g>

        <g className="rail-signal signal-orange">
          <line x1="430" y1="282" x2="430" y2="250" />
          <circle cx="430" cy="244" r="7" />
        </g>

        <g className="rail-signal signal-red">
          <line x1="580" y1="150" x2="580" y2="120" />
          <circle cx="580" cy="114" r="7" />
        </g>

        {/* NETWORK NODES */}
        <circle className="rail-node" cx="175" cy="320" r="8" />
        <circle className="rail-node node-green" cx="315" cy="315" r="8" />
        <circle className="rail-node node-orange" cx="450" cy="282" r="8" />
        <circle className="rail-node node-green" cx="580" cy="177" r="8" />

        {/* PULSING CONTROL POINT */}
        <circle
          className="control-pulse"
          cx="450"
          cy="282"
          r="22"
        />

        {/* TRAIN 1 — FOLLOWS MAIN RAILWAY */}
        <g className="rail-train train-one">
          <animateMotion
            dur="11s"
            repeatCount="indefinite"
            rotate="auto"
            path="M40 360 C130 320 175 250 245 260 S350 340 430 290 S555 150 720 120"
          />

          <g transform="translate(-46 -15)">
            <rect x="0" y="0" width="92" height="30" rx="7" />
            <rect x="12" y="7" width="18" height="9" rx="2" />
            <rect x="38" y="7" width="18" height="9" rx="2" />
            <rect x="64" y="7" width="15" height="9" rx="2" />

            <circle cx="20" cy="31" r="5" />
            <circle cx="73" cy="31" r="5" />
          </g>
        </g>

        {/* TRAIN 2 — FOLLOWS SECOND RAILWAY */}
        <g className="rail-train train-two">
          <animateMotion
            dur="15s"
            repeatCount="indefinite"
            rotate="auto"
            path="M20 135 C125 180 185 120 270 150 S400 235 485 190 S610 125 735 205"
          />

          <g transform="translate(-39 -13)">
            <rect x="0" y="0" width="78" height="26" rx="6" />
            <rect x="11" y="6" width="15" height="8" rx="2" />
            <rect x="33" y="6" width="15" height="8" rx="2" />
            <rect x="55" y="6" width="12" height="8" rx="2" />

            <circle cx="18" cy="27" r="4" />
            <circle cx="62" cy="27" r="4" />
          </g>
        </g>
      </svg>

      {/* BLOCK STATUS */}
      <div className="rail-status status-central">
        <span className="status-indicator green" />
        <div>
          <strong>CENTRAL</strong>
          <small>CONTROL NODE</small>
        </div>
      </div>

      <div className="rail-status status-block">
        <span className="status-indicator orange" />
        <div>
          <strong>BLOCK 217-A</strong>
          <small>MAINTENANCE WINDOW</small>
        </div>
      </div>

      <div className="rail-status status-clear">
        <span className="status-indicator green" />
        <div>
          <strong>TRACK CLEAR</strong>
          <small>OPERATIONAL</small>
        </div>
      </div>

      {/* MAINTENANCE TEAM */}
      <div className="maintenance-card">
        <div className="maintenance-icon">⚒</div>
        <div>
          <strong>MAINTENANCE</strong>
          <span>BLOCK ACTIVE</span>
        </div>
      </div>

      {/* MOVING DATA LINE */}
      <div className="network-scan-line" />
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  const enterControlCenter = () => {
    if (loading) return;

    setLoading(true);

    setTimeout(() => {
      navigate(session ? '/overview' : '/login');
    }, 3200);
  };

  return (
    <div className="landing-page">
      {/* RAILWAY LOADING SCREEN */}
      {loading && <RailwayLoader />}

      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="brand-mark">IR</span>

          <span className="brand-copy">
            <strong>RAILWAY</strong>
            <small>BLOCK CONTROL</small>
          </span>
        </Link>

        <nav className="landing-nav-links">
          <a href="#platform">Platform</a>
          <a href="#technology">Technology</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#workflow">How it works</a>
        </nav>

        <div className="landing-nav-actions">
          {!session && (
            <button
              type="button"
              className="landing-signin"
              onClick={enterControlCenter}
            >
              Sign in
            </button>
          )}

          <button
            type="button"
            className="landing-nav-cta"
            onClick={enterControlCenter}
          >
            {session ? 'Enter Control Room' : 'Enter Control Center'} <span>→</span>
          </button>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="landing-hero" id="platform">
          <div className="hero-grid" />

          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="status-dot" />
              INTELLIGENT RAILWAY OPERATIONS
            </div>

            <h1>
              Plan every block.
              <br />
              <span>Move every train.</span>
              <br />
              Protect every window.
            </h1>

            <p className="hero-description">
              AI-powered railway block management for safer maintenance
              planning, intelligent prioritization and conflict-free
              operations.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="hero-primary"
                onClick={enterControlCenter}
              >
                {session ? 'Enter Control Room' : 'Enter Control Center'}
                <span>→</span>
              </button>

              <a href="#workflow" className="hero-secondary">
                <span className="play-icon">▶</span>
                See how it works
              </a>
            </div>

            <div className="hero-status">
              <span className="status-dot" />
              <strong>Systems operational</strong>
              <i />
              <span>AI planning engine ready</span>
            </div>
          </div>

          <NetworkGraphic />

          <div className="hero-bottom-strip">
            {capabilities.map((item) => (
              <div className="hero-feature" key={item.number}>
                <div className="hero-feature-icon">{item.icon}</div>

                <div>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* INTRO */}
        <section className="landing-intro" id="technology">
          <div className="section-kicker">
            <span />
            BUILT FOR RAILWAY OPERATIONS
            <span />
          </div>

          <h2>
            From reactive maintenance
            <br />
            to <em>intelligent operations.</em>
          </h2>

          <p>
            Railway infrastructure demands precise coordination. Our platform
            brings maintenance, train movement and operational intelligence
            together in one planning environment.
          </p>
        </section>

        {/* WORKFLOW */}
        <section className="landing-workflow" id="workflow">
          <div className="workflow-heading">
            <div>
              <span className="section-label">AI PLANNING ENGINE</span>
              <h2>How the system works</h2>
            </div>

            <span className="workflow-live">
              <i />
              LIVE INTELLIGENCE
            </span>
          </div>

          <div className="workflow-track">
            {workflow.map((item, index) => (
              <div className="workflow-item" key={item.number}>
                <div className="workflow-number">{item.number}</div>

                <div className="workflow-content">
                  <span>STEP {item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>

                {index < workflow.length - 1 && (
                  <div className="workflow-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CAPABILITIES */}
        <section className="landing-capabilities" id="capabilities">
          <div className="capabilities-heading">
            <span className="section-label">ONE CONTROL CENTER</span>

            <h2>
              Intelligence behind
              <br />
              every <em>railway decision.</em>
            </h2>
          </div>

          <div className="capability-grid">
            {capabilities.map((item) => (
              <article className="capability-card" key={item.number}>
                <div className="capability-top">
                  <span>{item.number}</span>
                  <b>{item.icon}</b>
                </div>

                <h3>{item.title}</h3>

                <p>{item.text}</p>

                <div className="card-line" />
              </article>
            ))}
          </div>

          <div className="operations-band">
            <div>
              <span className="section-label">OPERATIONAL VISIBILITY</span>

              <h3>
                See the network.
                <br />
                Understand the risk.
              </h3>
            </div>

            <div className="operations-stats">
              <div>
                <strong>AI</strong>
                <span>Priority scoring</span>
              </div>

              <div>
                <strong>24/7</strong>
                <span>Network monitoring</span>
              </div>

              <div>
                <strong>LIVE</strong>
                <span>Operational data</span>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="landing-final">
          <div className="final-grid" />

          <div className="final-content">
            <span className="section-label">RAILWAY BLOCK CONTROL</span>

            <h2>
              Smarter planning.
              <br />
              <em>Safer railways.</em>
            </h2>

            <p>
              Give railway teams the intelligence they need to plan
              maintenance blocks with confidence.
            </p>

            <button
              type="button"
              className="final-cta"
              onClick={enterControlCenter}
            >
              {session ? 'Enter Control Room' : 'Enter Control Center'}
              <span>→</span>
            </button>
          </div>

          <div className="final-metrics">
            <div>
              <strong>01</strong>
              <span>AI-driven planning</span>
            </div>

            <div>
              <strong>02</strong>
              <span>Conflict-aware scheduling</span>
            </div>

            <div>
              <strong>03</strong>
              <span>Real-time visibility</span>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-brand">
          <span className="brand-mark">IR</span>

          <span className="brand-copy">
            <strong>RAILWAY</strong>
            <small>BLOCK CONTROL</small>
          </span>
        </div>

        <span className="footer-copy">
          Intelligent railway block management system
        </span>

        <span className="footer-status">
          <i />
          Systems online
        </span>
      </footer>
    </div>
  );
}