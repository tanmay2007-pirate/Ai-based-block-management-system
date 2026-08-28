import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function ExplainPanel({ taskId: providedTaskId, onClose }) {
  const { id } = useParams(); const taskId = providedTaskId || id;
  const [data, setData] = useState(null);
  useEffect(() => { if (taskId) api.get(`/tasks/${taskId}/explain`).then(response => setData(response.data)).catch(() => setData({ error: 'Explanation unavailable' })); }, [taskId]);
  if (!taskId) return null;
  return <div className="detail-panel"><button className="close" onClick={onClose}>×</button><span className="eyebrow">AI EXPLANATION</span><h2>Priority rationale</h2><pre className="json">{JSON.stringify(data, null, 2)}</pre></div>;
}
