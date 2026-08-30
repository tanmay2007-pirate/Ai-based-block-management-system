export default function AvailabilityChart({ daily = [] }) {
  const latest = daily.length ? daily[daily.length - 1].availability_percentage : null;
  return <div className="panel"><h3>Asset availability</h3><div className="big-number">{latest ?? '--'}<span>{latest === null ? '' : '%'}</span></div>{daily.length ? <div className="sparkline">{daily.map(item => <i key={item.date} style={{ height: `${Math.max(5, item.availability_percentage)}%` }} title={`${item.date}: ${item.availability_percentage}%`} />)}</div> : <p className="muted">MISSING BACKEND DATA</p>}</div>;
}
