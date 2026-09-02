/**
 * FilterBar.jsx — Improved filter bar component
 * Provides filtering by department, severity, and sorting
 */

export default function FilterBar({
  departments = [],
  department = '',
  onDepartmentChange,
  severity = '',
  onSeverityChange,
  sortHighFirst = true,
  onSortChange,
  taskCount = 0,
  totalCount = 0,
  onClearFilters,
}) {
  const hasFilters = department || severity;

  return (
    <div className="filter-bar">
      <div className="filter-controls">
        <div className="filter-group">
          <label>Department</label>
          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="filter-select"
          >
            <option value="">All departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Severity</label>
          <select
            value={severity}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="filter-select"
          >
            <option value="">All severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort Priority</label>
          <button
            className="filter-sort-button"
            onClick={onSortChange}
          >
            <span>{sortHighFirst ? 'Highest first' : 'Lowest first'}</span>
            <span className="sort-arrow">{sortHighFirst ? '↓' : '↑'}</span>
          </button>
        </div>

        {hasFilters && (
          <button
            className="filter-clear-button"
            onClick={onClearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="filter-status">
        <span className="result-count">
          Showing <strong>{taskCount}</strong> of <strong>{totalCount}</strong> tasks
        </span>
      </div>
    </div>
  );
}
