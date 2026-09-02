/**
 * PriorityDistribution.jsx — Chart showing priority distribution
 * Uses Recharts for responsive visualization
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function PriorityDistribution({ tasks = [] }) {
  const data = useMemo(() => {
    const distribution = {
      Critical: tasks.filter(t => Number(t.priority_score) >= 80).length,
      High: tasks.filter(t => {
        const s = Number(t.priority_score) || 0;
        return s >= 50 && s < 80;
      }).length,
      Medium: tasks.filter(t => {
        const s = Number(t.priority_score) || 0;
        return s >= 20 && s < 50;
      }).length,
      Low: tasks.filter(t => (Number(t.priority_score) || 0) < 20).length,
    };

    return [
      { name: 'Critical', value: distribution.Critical, fill: '#ef4444' },
      { name: 'High', value: distribution.High, fill: '#f97316' },
      { name: 'Medium', value: distribution.Medium, fill: '#eab308' },
      { name: 'Low', value: distribution.Low, fill: '#22c55e' },
    ];
  }, [tasks]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="distribution-chart">
      <div className="chart-header">
        <h3>Priority Distribution</h3>
        <span className="chart-total">{total} tasks</span>
      </div>

      {total > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
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
          <p>No priority data available</p>
        </div>
      )}
    </div>
  );
}
