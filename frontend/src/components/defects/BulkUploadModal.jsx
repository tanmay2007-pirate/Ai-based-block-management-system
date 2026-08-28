import { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BulkUploadModal({ onComplete }) {
  const { session } = useAuth();
  const department = session?.user?.department;
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!department || !['TMS', 'TDMS', 'SMMS'].includes(department)) return null;
  const path = `/${department.toLowerCase()}/defects`;

  const downloadTemplate = async (event) => {
    event.preventDefault();
    try {
      const response = await api.get(`${path}/template`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${department.toLowerCase()}-defect-template.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to download template');
    }
  };

  const upload = async () => {
    if (!file) return setError('Choose an .xlsx file first');
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await api.post(`${path}/bulk-upload`, body);
      setResult(response.data);
      onComplete?.();
    } catch (requestError) {
      setResult(requestError.response?.data || null);
      setError(requestError.response?.data?.message || requestError.response?.data?.error || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return <div className="bulk-upload">
    <a href={`${path}/template`} onClick={downloadTemplate}>Download Template</a>
    <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event => setFile(event.target.files?.[0] || null)} />
    <button className="secondary" onClick={upload} disabled={busy}>{busy ? 'Uploading…' : 'Upload .xlsx'}</button>
    {error && <p className="error">{error}</p>}
    {result && <div className="upload-result"><strong>Successful rows: {result.records || 0}</strong>{(result.failed_rows || []).map(row => <div key={row.row}>Row {row.row}: {row.reasons.join(', ')}</div>)}</div>}
  </div>;
}
