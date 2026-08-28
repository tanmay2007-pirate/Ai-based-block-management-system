export default function UtilizationChart({ values = {} }) {
  const entries = Object.entries(values);
  return <div className="panel"><h3>Block utilization by department</h3><div className="bars">{entries.map(([name, value]) => <div key={name}><span>{name}</span><div><i style={{ width: `${value}%` }} /></div><b>{value}%</b></div>)}</div>{!entries.length && <p className="muted">No utilization data available yet.</p>}</div>;
}
