/**
 * SeverityDistribution.jsx — Chart showing severity distribution
 * Uses Recharts for responsive visualization
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function SeverityDistribution({ tasks = [] }) {
  const data = useMemo(() => {
    const severityMap = {};

    tasks.forEach(task => {
      const severity = String(task.severity || 'UNKNOWN').toUpperCase();
      severityMap[severity] = (severityMap[severity] || 0) + 1;
    });

    const colors = {
      CRITICAL: '#ef4444',
      HIGH: '#f97316',
      MEDIUM: '#eab308',
      LOW: '#22c55e',
      UNKNOWN: '#6b7280',
    };

    return Object.entries(severityMap)
      .map(([name, value]) => ({
        name,
        value,
        fill: colors[name] || colors.UNKNOWN,
      }))
      .sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };
        return (order[a.name] ?? 5) - (order[b.name] ?? 5);
      });
  }, [tasks]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="distribution-chart">
      <div className="chart-header">
        <h3>Severity Distribution</h3>
        <span className="chart-total">{total} defects</span>
      </div>

      {total > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#fff',
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">
          <p>No severity data available</p>
        </div>
      )}
    </div>
  );
}
