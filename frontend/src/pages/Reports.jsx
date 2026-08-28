import { useMemo } from 'react';
import useFetch from '../hooks/useFetch';
import AvailabilityChart from '../components/reports/AvailabilityChart';
import UtilizationChart from '../components/reports/UtilizationChart';

function MetricCard({ label, value, suffix = '', tone = '', detail }) {
  return (
    <div className={`report-metric ${tone}`}>
      <div className="report-metric-label">{label}</div>
      <div className="report-metric-value">
        {value}
        <span>{suffix}</span>
      </div>
      <div className="report-metric-detail">{detail}</div>
    </div>
  );
}

export default function Reports() {
  const { data, loading } = useFetch('/reports/summary', {});

  const completion = useMemo(() => {
    const values = Object.values(data.completion_by_department || {});
    return values.length
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : 0;
  }, [data]);

  const availability = data.availability?.daily || [];

  const latestAvailability = availability.length
    ? Number(availability[availability.length - 1].availability_percentage || 0)
    : 0;

  const utilization = Object.values(data.utilization_by_department || {});
  const averageUtilization = utilization.length
    ? Math.round(
        utilization.reduce((sum, value) => sum + Number(value || 0), 0) /
          utilization.length
      )
    : 0;

  return (
    <>
      <div className="reports-heading">
        <div>
          <span className="eyebrow">NETWORK INTELLIGENCE</span>
          <h1>Reports & analytics</h1>
          <p>
            Monitor railway availability, maintenance performance and block
            utilization across the network.
          </p>
        </div>

        <div className="reports-period">
          <span className="report-live-dot" />
          <div>
            <strong>LIVE OPERATIONS DATA</strong>
            <small>Rolling 30-day view</small>
          </div>
        </div>
      </div>

      <div className="report-metrics">
        <MetricCard
          label="Network availability"
          value={latestAvailability}
          suffix="%"
          tone="green"
          detail="Latest recorded availability"
        />

        <MetricCard
          label="Task completion"
          value={completion}
          suffix="%"
          tone="blue"
          detail="Average across departments"
        />

        <MetricCard
          label="Block utilization"
          value={averageUtilization}
          suffix="%"
          tone="orange"
          detail="Average planned utilization"
        />

        <MetricCard
          label="Departments tracked"
          value={utilization.length}
          tone="purple"
          detail="Active operational groups"
        />
      </div>

      {loading ? (
        <div className="panel reports-loading">
          <div className="loading-ring" />
          <strong>Loading network analytics…</strong>
          <span>Synchronizing operational performance data</span>
        </div>
      ) : (
        <>
          <div className="reports-grid">
            <div className="panel report-chart-card">
              <div className="report-card-heading">
                <div>
                  <span className="eyebrow">NETWORK PERFORMANCE</span>
                  <h2>Asset availability</h2>
                </div>
                <span className="report-value-pill green">
                  {latestAvailability}%
                </span>
              </div>

              <p className="report-description">
                Daily network availability over the selected reporting period.
              </p>

              <AvailabilityChart daily={availability} />
            </div>

            <div className="panel report-chart-card">
              <div className="report-card-heading">
                <div>
                  <span className="eyebrow">MAINTENANCE PERFORMANCE</span>
                  <h2>Completion rate</h2>
                </div>
                <span className="report-value-pill blue">
                  {completion}%
                </span>
              </div>

              <div className="completion-display">
                <div
                  className="completion-ring"
                  style={{ '--completion': `${completion * 3.6}deg` }}
                >
                  <div>
                    <strong>{completion}%</strong>
                    <span>completed</span>
                  </div>
                </div>
              </div>

              <p className="center muted">
                Network-wide maintenance task completion.
              </p>
            </div>
          </div>

          <div className="panel report-utilization-card">
            <div className="report-card-heading">
              <div>
                <span className="eyebrow">BLOCK PLANNING</span>
                <h2>Utilization by department</h2>
              </div>

              <span className="report-value-pill orange">
                {averageUtilization}% avg
              </span>
            </div>

            <p className="report-description">
              Compare how operational block capacity is being utilized across
              maintenance departments.
            </p>

            <UtilizationChart
              values={data.utilization_by_department}
            />
          </div>

          <div className="panel reports-insight">
            <div className="insight-icon">AI</div>
            <div>
              <span className="eyebrow">PLANNING INSIGHT</span>
              <h3>Operational performance snapshot</h3>
              <p>
                The analytics layer combines availability, maintenance
                completion and block utilization to help coordinators identify
                operational pressure points before approving new blocks.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}