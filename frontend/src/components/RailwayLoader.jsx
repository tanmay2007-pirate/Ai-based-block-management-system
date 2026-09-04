import './railway-loader.css';

export default function RailwayLoader() {
  return (
    <div className="railway-loader">
      <div className="railway-loader-grid" />

      <div className="railway-loader-content">
        <div className="railway-loader-brand">
          <span className="railway-loader-mark">IR</span>

          <div>
            <strong>RAILWAY BLOCK CONTROL</strong>
            <span>AI OPERATIONS NETWORK</span>
          </div>
        </div>

        <div className="railway-loader-status">
          <span className="loader-status-dot" />
          <span className="loader-status-text">
            ESTABLISHING CONTROL LINK
          </span>
          <span className="loader-dots">...</span>
        </div>

        <div className="railway-loader-track">
          <div className="loader-sleeper sleeper-1" />
          <div className="loader-sleeper sleeper-2" />
          <div className="loader-sleeper sleeper-3" />
          <div className="loader-sleeper sleeper-4" />
          <div className="loader-sleeper sleeper-5" />
          <div className="loader-sleeper sleeper-6" />
          <div className="loader-sleeper sleeper-7" />
          <div className="loader-sleeper sleeper-8" />
          <div className="loader-sleeper sleeper-9" />
          <div className="loader-sleeper sleeper-10" />
          <div className="loader-sleeper sleeper-11" />
          <div className="loader-sleeper sleeper-12" />

          <div className="loader-rail loader-rail-one" />
          <div className="loader-rail loader-rail-two" />

          <div className="loader-train">
            <span className="loader-train-window window-1" />
            <span className="loader-train-window window-2" />
            <span className="loader-train-window window-3" />
            <span className="loader-train-light" />
            <span className="loader-wheel wheel-1" />
            <span className="loader-wheel wheel-2" />
          </div>

          <div className="loader-signal">
            <span className="signal-post" />
            <span className="signal-light" />
          </div>
        </div>

        <div className="railway-loader-message">
          <span>BLOCK MANAGEMENT SYSTEM</span>
          <span className="loader-separator">/</span>
          <span>SECURE ACCESS</span>
        </div>
      </div>
    </div>
  );
}
