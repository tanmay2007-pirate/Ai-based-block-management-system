import './railway-loader.css';

export default function RailwayLoader() {
  return (
    <div className="railway-loader">
      <div className="railway-loader-grid" />

      <div className="railway-loader-content">
        {/* OFFICIAL BRAND SEAL */}
        <div className="railway-loader-brand">
          <span className="railway-loader-mark">
            <img
              src="/indian-railways-seal.png"
              alt="Indian Railways"
              className="loader-seal-img"
            />
          </span>

          <div>
            <strong>RAILWAY BLOCK CONTROL</strong>
            <span>AI OPERATIONS NETWORK</span>
          </div>
        </div>

        {/* STATUS */}
        <div className="railway-loader-status">
          <span className="loader-status-dot" />
          <span className="loader-status-text">
            ESTABLISHING CONTROL LINK
          </span>
          <span className="loader-dots">...</span>
        </div>

        {/* AUTHENTIC RAILWAY TRACK & HIGH-SPEED TRAIN */}
        <div className="railway-loader-track-container">
          <svg
            className="railway-loader-svg"
            viewBox="0 0 700 110"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="loaderBeam" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="30%" stopColor="#7ee3ff" stopOpacity="0.5" />
                <stop offset="75%" stopColor="#44bde2" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#44bde2" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* BALLAST TRACK BED FOUNDATION */}
            <rect
              x="10"
              y="45"
              width="680"
              height="30"
              rx="6"
              className="loader-ballast"
            />

            {/* RAILWAY SLEEPERS / TIES (Crossbars) */}
            {Array.from({ length: 17 }).map((_, i) => (
              <g key={i} transform={`translate(${28 + i * 40}, 40)`}>
                <rect
                  x="0"
                  y="0"
                  width="10"
                  height="40"
                  rx="2"
                  className="loader-sleeper-tie"
                />
                {/* Upper and Lower Rail Fastening Tie-Plates */}
                <rect x="1" y="8" width="8" height="4" rx="0.5" className="loader-tie-plate" />
                <rect x="1" y="28" width="8" height="4" rx="0.5" className="loader-tie-plate" />
              </g>
            ))}

            {/* DUAL PARALLEL STEEL RAILS */}
            {/* Upper Rail (y = 50) */}
            <line
              x1="10"
              y1="50"
              x2="690"
              y2="50"
              className="loader-steel-rail"
            />
            {/* Lower Rail (y = 70) */}
            <line
              x1="10"
              y1="70"
              x2="690"
              y2="70"
              className="loader-steel-rail"
            />

            {/* SIGNAL POST AT BLOCK END (x = 645) */}
            <g className="loader-track-signal">
              <line x1="645" y1="46" x2="645" y2="16" stroke="rgba(160, 200, 215, 0.6)" strokeWidth="2" />
              <circle cx="645" cy="12" r="6" className="loader-signal-glow" />
            </g>

            {/* HIGH-SPEED ELECTRIC TRAIN CONSIST (ANIMATED ACROSS THE TRACK) */}
            <g className="loader-animated-train">
              {/* FORWARD HEADLIGHT BEAM PROJECTION */}
              <polygon
                points="136,60 215,42 215,78"
                fill="url(#loaderBeam)"
                className="loader-headlight-cone"
              />

              {/* TRAILING PASSENGER COACH */}
              <g className="loader-car-coach">
                <rect x="0" y="44" width="56" height="22" rx="3" className="loader-coach-body" />
                <rect x="0" y="53" width="56" height="4" className="loader-stripe-blue" />
                <rect x="0" y="45" width="56" height="2.5" className="loader-stripe-saffron" />
                {/* Passenger Windows */}
                <rect x="6" y="47" width="8" height="4.5" rx="1" className="loader-window-glow" />
                <rect x="18" y="47" width="8" height="4.5" rx="1" className="loader-window-glow" />
                <rect x="30" y="47" width="8" height="4.5" rx="1" className="loader-window-glow" />
                <rect x="42" y="47" width="8" height="4.5" rx="1" className="loader-window-glow" />
                {/* Red Tail Marker Lights */}
                <circle cx="2" cy="48" r="1.8" className="loader-taillight" />
                <circle cx="2" cy="62" r="1.8" className="loader-taillight" />
                {/* Steel Wheels on Rails (y = 50 and y = 70) */}
                <circle cx="12" cy="50" r="2.2" className="loader-steel-wheel" />
                <circle cx="12" cy="70" r="2.2" className="loader-steel-wheel" />
                <circle cx="44" cy="50" r="2.2" className="loader-steel-wheel" />
                <circle cx="44" cy="70" r="2.2" className="loader-steel-wheel" />
                <rect x="8" y="48.5" width="38" height="3" rx="0.5" className="loader-bogie" />
                <rect x="8" y="68.5" width="38" height="3" rx="0.5" className="loader-bogie" />
              </g>

              {/* INTER-CAR ACCORDION GANGWAY BELLOWS */}
              <rect x="56" y="47" width="6" height="16" rx="1" className="loader-gangway" />

              {/* LEADING ELECTRIC BULLET-NOSE LOCOMOTIVE */}
              <g className="loader-car-locomotive">
                {/* Aerodynamic Locomotive Body with Bullet Nose */}
                <path
                  d="M 62 44 L 118 44 Q 134 46 138 60 Q 134 74 118 76 L 62 76 Z"
                  className="loader-loco-body"
                />
                {/* Saffron Speed Stripe */}
                <path
                  d="M 62 44 L 116 44 Q 130 46 136 60 L 129 60 Q 120 53 108 53 L 62 53 Z"
                  className="loader-stripe-saffron"
                />
                {/* Blue Speed Stripe */}
                <rect x="62" y="58" width="56" height="4" className="loader-stripe-blue" />
                {/* Green Speed Stripe */}
                <path
                  d="M 62 67 L 108 67 Q 120 67 129 60 L 136 60 Q 130 74 116 76 L 62 76 Z"
                  className="loader-stripe-green"
                />
                {/* Driver Cab Curved Windshield */}
                <path
                  d="M 112 48 L 127 50 Q 131 60 127 70 L 112 72 Z"
                  className="loader-windshield"
                />
                {/* Cab Side Windows */}
                <rect x="88" y="47" width="9" height="4.5" rx="1" className="loader-window-glow" />
                <rect x="72" y="47" width="9" height="4.5" rx="1" className="loader-window-glow" />
                {/* Roof Electric Pantograph */}
                <path
                  d="M 80 44 L 89 31 L 98 44 M 85 31 L 93 31 M 89 31 L 89 27 L 83 27 L 95 27"
                  className="loader-pantograph"
                />
                {/* Forward Dual Headlights */}
                <circle cx="136" cy="56" r="2" className="loader-headlight-lens" />
                <circle cx="136" cy="64" r="2" className="loader-headlight-lens" />
                {/* Steel Wheels on Rails (y = 50 and y = 70) */}
                <circle cx="78" cy="50" r="2.2" className="loader-steel-wheel" />
                <circle cx="78" cy="70" r="2.2" className="loader-steel-wheel" />
                <circle cx="112" cy="50" r="2.2" className="loader-steel-wheel" />
                <circle cx="112" cy="70" r="2.2" className="loader-steel-wheel" />
                <rect x="74" y="48.5" width="42" height="3" rx="0.5" className="loader-bogie" />
                <rect x="74" y="68.5" width="42" height="3" rx="0.5" className="loader-bogie" />
              </g>
            </g>
          </svg>
        </div>

        {/* BOTTOM MESSAGE */}
        <div className="railway-loader-message">
          <span>BLOCK MANAGEMENT SYSTEM</span>
          <span className="loader-separator">/</span>
          <span>SECURE ACCESS</span>
        </div>
      </div>
    </div>
  );
}
