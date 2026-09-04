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
            <stop offset="0%" stopColor="#44bde2" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#7ee3ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#44bde2" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="headlightBeam" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#a4edff" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#41c6ee" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#41c6ee" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="headlightBeamOrange" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#fff8e7" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#ffb347" stopOpacity="0.45" />
            <stop offset="75%" stopColor="#ff8c00" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ff8c00" stopOpacity="0" />
          </linearGradient>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ================= RAILWAY TRACK 1 (MAIN CORRIDOR) ================= */}
        {/* Ballast track bed foundation */}
        <path
          className="track-ballast"
          d="M40 360 C130 320 175 250 245 260 S350 340 430 290 S555 150 720 120"
        />

        {/* Railway Sleepers / Ties (crossbars perpendicular to rails) */}
        <path
          className="track-sleepers main-sleepers"
          d="M40 360 C130 320 175 250 245 260 S350 340 430 290 S555 150 720 120"
        />

        {/* Upper Steel Rail */}
        <path
          className="track-steel-rail"
          d="M40 353 C130 313 175 243 245 253 S350 333 430 283 S555 143 720 113"
        />

        {/* Lower Steel Rail */}
        <path
          className="track-steel-rail"
          d="M40 367 C130 327 175 257 245 267 S350 347 430 297 S555 157 720 127"
        />

        {/* ================= RAILWAY TRACK 2 (SECONDARY CORRIDOR) ================= */}
        {/* Ballast track bed foundation */}
        <path
          className="track-ballast"
          d="M20 135 C125 180 185 120 270 150 S400 235 485 190 S610 125 735 205"
        />

        {/* Railway Sleepers / Ties */}
        <path
          className="track-sleepers secondary-sleepers"
          d="M20 135 C125 180 185 120 270 150 S400 235 485 190 S610 125 735 205"
        />

        {/* Upper Steel Rail */}
        <path
          className="track-steel-rail"
          d="M20 128 C125 173 185 113 270 143 S400 228 485 183 S610 118 735 198"
        />

        {/* Lower Steel Rail */}
        <path
          className="track-steel-rail"
          d="M20 142 C125 187 185 127 270 157 S400 242 485 197 S610 132 735 212"
        />

        {/* ================= RAILWAY TRACK 3 (MAINTENANCE SIDING) ================= */}
        {/* Ballast track bed foundation */}
        <path
          className="track-ballast maintenance-ballast"
          d="M190 410 C275 365 315 365 390 395 S500 445 610 405"
        />

        {/* Railway Sleepers / Ties */}
        <path
          className="track-sleepers maintenance-sleepers"
          d="M190 410 C275 365 315 365 390 395 S500 445 610 405"
        />

        {/* Upper Steel Rail */}
        <path
          className="track-steel-rail maintenance-rail"
          d="M190 403 C275 358 315 358 390 388 S500 438 610 398"
        />

        {/* Lower Steel Rail */}
        <path
          className="track-steel-rail maintenance-rail"
          d="M190 417 C275 372 315 372 390 402 S500 452 610 412"
        />

        {/* Track Terminal Buffer Stop */}
        <line className="buffer-stop" x1="608" y1="395" x2="608" y2="423" />
        <rect x="606" y="403" width="5" height="12" rx="1" fill="#ff5252" />

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

        {/* ================= TRAIN 1 (HIGH-SPEED VANDE BHARAT EXPRESS) ================= */}
        <g className="rail-train train-one">
          <animateMotion
            dur="13s"
            repeatCount="indefinite"
            rotate="auto"
            path="M40 360 C130 320 175 250 245 260 S350 340 430 290 S555 150 720 120"
          />

          {/* Forward High-Beam Headlight Projection Cone */}
          <polygon
            points="38,0 115,-15 115,15"
            fill="url(#headlightBeam)"
            className="train-headlight-cone"
          />

          {/* TRAILING PASSENGER COACH */}
          <g className="train-car train-coach">
            <rect x="-38" y="-6.5" width="34" height="13" rx="2" className="train-coach-body" />
            <rect x="-38" y="-1.2" width="34" height="2.4" className="train-stripe-blue" />
            <rect x="-38" y="-6.5" width="34" height="1.8" className="train-stripe-saffron" />
            {/* Passenger Window Band */}
            <rect x="-34" y="-5" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="-26" y="-5" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="-18" y="-5" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="-10" y="-5" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="-34" y="2.8" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="-26" y="2.8" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="-18" y="2.8" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="-10" y="2.8" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            {/* Red LED Tail Lights */}
            <circle cx="-37.5" cy="-3.5" r="1.3" className="train-taillight" />
            <circle cx="-37.5" cy="3.5" r="1.3" className="train-taillight" />
            {/* Steel Wheelsets Riding on Rails */}
            <circle cx="-32" cy="-7" r="1.6" className="train-steel-wheel" />
            <circle cx="-32" cy="7" r="1.6" className="train-steel-wheel" />
            <circle cx="-14" cy="-7" r="1.6" className="train-steel-wheel" />
            <circle cx="-14" cy="7" r="1.6" className="train-steel-wheel" />
            <rect x="-34" y="-8" width="22" height="1.8" rx="0.5" className="train-bogie" />
            <rect x="-34" y="6.2" width="22" height="1.8" rx="0.5" className="train-bogie" />
          </g>

          {/* Gangway Coupler Accordion Bellows */}
          <rect x="-4" y="-5" width="4" height="10" rx="0.8" className="train-gangway" />

          {/* LEADING LOCOMOTIVE ENGINE */}
          <g className="train-car train-locomotive">
            {/* Aerodynamic Bullet Nose Body */}
            <path
              d="M 0 -6.5 L 22 -6.5 Q 35 -6 38 0 Q 35 6 22 6.5 L 0 6.5 Z"
              className="train-loco-body"
            />
            {/* Indian Railways Saffron / White / Green Speed Livery */}
            <path
              d="M 0 -6.5 L 20 -6.5 Q 33 -6 37 0 L 32 0 Q 28 -3 18 -3 L 0 -3 Z"
              className="train-stripe-saffron"
            />
            <rect x="0" y="-1.2" width="30" height="2.4" className="train-stripe-blue" />
            <path
              d="M 0 3 L 18 3 Q 28 3 32 0 L 37 0 Q 33 6 20 6.5 L 0 6.5 Z"
              className="train-stripe-green"
            />
            {/* Aerodynamic Windshield */}
            <path
              d="M 18 -4.5 L 28 -3.8 Q 32 0 28 3.8 L 18 4.5 Z"
              className="train-windshield"
            />
            {/* Cab Side Windows */}
            <rect x="4" y="-5.2" width="6" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="4" y="3" width="6" height="2.2" rx="0.5" className="train-window-glow" />
            {/* Roof Electric Pantograph */}
            <path
              d="M 6 -6.5 L 11 -12 L 17 -6.5 M 9 -12 L 14 -12 M 11 -12 L 11 -13.5 L 8 -13.5 L 15 -13.5"
              className="train-pantograph"
            />
            {/* Forward Dual Headlights */}
            <circle cx="37" cy="-2" r="1.5" className="train-headlight-lens" />
            <circle cx="37" cy="2" r="1.5" className="train-headlight-lens" />
            {/* Steel Wheelsets Riding on Rails */}
            <circle cx="8" cy="-7" r="1.6" className="train-steel-wheel" />
            <circle cx="8" cy="7" r="1.6" className="train-steel-wheel" />
            <circle cx="24" cy="-7" r="1.6" className="train-steel-wheel" />
            <circle cx="24" cy="7" r="1.6" className="train-steel-wheel" />
            <rect x="6" y="-8" width="20" height="1.8" rx="0.5" className="train-bogie" />
            <rect x="6" y="6.2" width="20" height="1.8" rx="0.5" className="train-bogie" />
          </g>
        </g>

        {/* ================= TRAIN 2 (REGIONAL INTERCITY EXPRESS) ================= */}
        <g className="rail-train train-two">
          <animateMotion
            dur="16s"
            repeatCount="indefinite"
            rotate="auto"
            path="M20 135 C125 180 185 120 270 150 S400 235 485 190 S610 125 735 205"
          />

          {/* Forward Warm Light Beam */}
          <polygon
            points="34,0 100,-14 100,14"
            fill="url(#headlightBeamOrange)"
            className="train-headlight-cone"
          />

          {/* TRAILING COACH */}
          <g className="train-car train-coach">
            <rect x="-34" y="-6.5" width="31" height="13" rx="2" className="train-coach-body" />
            <rect x="-34" y="-1.2" width="31" height="2.4" className="train-stripe-blue" />
            <rect x="-30" y="-5" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="-22" y="-5" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="-14" y="-5" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="-30" y="2.8" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="-22" y="2.8" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="-14" y="2.8" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <circle cx="-33.5" cy="-3.5" r="1.3" className="train-taillight" />
            <circle cx="-33.5" cy="3.5" r="1.3" className="train-taillight" />
            <circle cx="-28" cy="-7" r="1.6" className="train-steel-wheel" />
            <circle cx="-28" cy="7" r="1.6" className="train-steel-wheel" />
            <circle cx="-12" cy="-7" r="1.6" className="train-steel-wheel" />
            <circle cx="-12" cy="7" r="1.6" className="train-steel-wheel" />
          </g>

          {/* Gangway Coupler */}
          <rect x="-3" y="-5" width="3" height="10" rx="0.8" className="train-gangway" />

          {/* LEADING LOCOMOTIVE */}
          <g className="train-car train-locomotive">
            <path
              d="M 0 -6.5 L 20 -6.5 Q 31 -5.5 34 0 Q 31 5.5 20 6.5 L 0 6.5 Z"
              className="train-loco-body"
            />
            <rect x="0" y="-1.2" width="28" height="2.4" className="train-stripe-saffron" />
            <path
              d="M 16 -4.2 L 26 -3.5 Q 29 0 26 3.5 L 16 4.2 Z"
              className="train-windshield"
            />
            <rect x="4" y="-5" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            <rect x="4" y="2.8" width="5" height="2.2" rx="0.5" className="train-window-glow" />
            {/* Roof Pantograph */}
            <path
              d="M 4 -6.5 L 9 -11.5 L 14 -6.5 M 7 -11.5 L 11 -11.5"
              className="train-pantograph"
            />
            <circle cx="33" cy="-2" r="1.4" className="train-headlight-lens" />
            <circle cx="33" cy="2" r="1.4" className="train-headlight-lens" />
            <circle cx="8" cy="-7" r="1.6" className="train-steel-wheel" />
            <circle cx="8" cy="7" r="1.6" className="train-steel-wheel" />
            <circle cx="20" cy="-7" r="1.6" className="train-steel-wheel" />
            <circle cx="20" cy="7" r="1.6" className="train-steel-wheel" />
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
          <span className="brand-mark">
            <img src="/indian-railways-seal.png" alt="Indian Railways" className="brand-mark-img" />
          </span>

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
          <span className="brand-mark">
            <img src="/indian-railways-seal.png" alt="Indian Railways" className="brand-mark-img" />
          </span>

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