/**
 * BlockUtilization.jsx — Block utilization visualization
 * Shows maintenance workload by department
 */

import { useMemo } from 'react';

export default function BlockUtilization({ tasks = [], loading = false }) {
  const utilization = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    const departments = {
      Engineering: 0,
      Traction: 0,
      'S&T': 0,
    };

    tasks.forEach(task => {
      const dept = task.department;
      if (dept === 'TMS') departments.Engineering++;
      else if (dept === 'TDMS') departments.Traction++;
      else if (dept === 'SMMS') departments['S&T']++;
    });

    const total = Object.values(departments).reduce((a, b) => a + b, 0);

    return Object.entries(departments).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [tasks]);

  if (loading) {
    return (
      <div className="block-utilization-panel loading">
        <div className="skeleton skeleton-line" style={{ width: '50%', height: '20px' }} />
        <div className="skeleton skeleton-line" style={{ width: '100%', height: '40px', marginTop: '16px' }} />
      </div>
    );
  }

  const total = utilization.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="block-utilization-panel">
      <div className="utilization-header">
        <h3>Today's Block Utilization</h3>
        <span className="utilization-total">{total} active tasks</span>
      </div>

      <div className="utilization-content">
        {utilization.length > 0 ? (
          utilization.map((dept, index) => (
            <div key={index} className="utilization-item">
              <div className="utilization-label">
                <span className="dept-name">{dept.name}</span>
                <span className="dept-count">{dept.count} tasks</span>
              </div>

              <div className="utilization-bar-container">
                <div className="utilization-bar">
                  <div
                    className="utilization-fill"
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
                <span className="utilization-percent">{dept.percentage}%</span>
              </div>
            </div>
          ))
        ) : (
          <div className="utilization-empty">
            <p>No utilization data</p>
          </div>
        )}
      </div>
    </div>
  );
}
