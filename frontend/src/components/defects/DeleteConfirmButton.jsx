import { useState } from 'react';
import api from '../../services/api';

const sources = { TMS: 'tms', TDMS: 'tdms', SMMS: 'smms' };

export default function DeleteConfirmButton({ task, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const source = sources[task.department];

  const remove = async () => {
    if (!window.confirm('This cannot be easily undone. Delete this defect?')) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`/${source}/defects/${task.source_id}`);
      onDeleted?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete defect');
    } finally {
      setBusy(false);
    }
  };

  if (!source || !task.source_id) return null;
  return <><button className="danger-button" onClick={remove} disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</button>{error && <span className="inline-error">{error}</span>}</>;
}
