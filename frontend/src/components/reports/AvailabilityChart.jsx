export default function AvailabilityChart({ daily = [] }) {
  return <div className="panel"><h3>Asset availability</h3><div className="big-number">{daily.length ? daily[daily.length - 1].availability_percentage : 0}<span>%</span></div><div className="sparkline">{daily.map(item => <i key={item.date} style={{ height: `${Math.max(5, item.availability_percentage)}%` }} title={`${item.date}: ${item.availability_percentage}%`} />)}</div></div>;
}
