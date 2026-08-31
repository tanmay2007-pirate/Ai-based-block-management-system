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

  return (
    <div className="bulk-upload-section">
      <div className="bulk-template-card">
        <div className="bulk-template-info">
          <span className="template-icon">📄</span>
          <div>
            <strong>Excel Data Template</strong>
            <small>Pre-formatted template with standard columns</small>
          </div>
        </div>
        <a href={`${path}/template`} className="btn-download-template" onClick={downloadTemplate}>
          📥 Download .xlsx
        </a>
      </div>

      <div className="bulk-file-area">
        <label className="file-input-wrapper">
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={event => setFile(event.target.files?.[0] || null)}
          />
          <div className="file-input-content">
            <span className="file-icon">{file ? '📊' : '📁'}</span>
            <span className="file-label-text">
              {file ? file.name : 'Choose or drag & drop .xlsx file'}
            </span>
          </div>
        </label>
        <button
          type="button"
          className="btn-upload-file"
          onClick={upload}
          disabled={busy || !file}
        >
          {busy ? 'Uploading spreadsheet…' : '🚀 Upload & Import Data'}
        </button>
      </div>

      {error && <p className="form-error-msg">{error}</p>}

      {result && (
        <div className="upload-result-box">
          <div className="upload-success-badge">
            ✓ Successfully imported <strong>{result.records || 0}</strong> defect records
          </div>
          {(result.failed_rows || []).length > 0 && (
            <div className="upload-failed-list">
              <span className="failed-title">Rows with errors:</span>
              {(result.failed_rows || []).map(row => (
                <div key={row.row} className="failed-row-item">
                  Row {row.row}: {row.reasons.join(', ')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
