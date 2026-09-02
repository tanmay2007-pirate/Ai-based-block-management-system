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

  if (!department || !['TMS', 'TDMS', 'SMMS'].includes(department)) {return null;}
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
    if (!file) {return setError('Please select an .xlsx file first');}
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
    <div className="bulk-upload-container">
      {/* 1. DOWNLOAD TEMPLATE */}
      <div className="bulk-step-block">
        <span className="bulk-step-label">1. Download Template</span>
        <button
          type="button"
          className="bulk-download-btn"
          onClick={downloadTemplate}
          title="Download Excel spreadsheet template"
        >
          <svg className="bulk-btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <div className="bulk-btn-copy">
            <strong>Download {department} Template</strong>
            <small>.xlsx template with validated defect headers</small>
          </div>
        </button>
      </div>

      {/* 2. CHOOSE FILE */}
      <div className="bulk-step-block">
        <span className="bulk-step-label">2. Choose Excel File</span>
        <label className={`bulk-file-dropzone ${file ? 'has-file' : ''}`}>
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={event => {
              setFile(event.target.files?.[0] || null);
              setError('');
            }}
          />
          <div className="bulk-dropzone-content">
            <svg className="bulk-dropzone-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <div className="bulk-dropzone-text">
              {file ? (
                <>
                  <strong className="bulk-chosen-filename">{file.name}</strong>
                  <small>{(file.size / 1024).toFixed(1)} KB · File selected</small>
                </>
              ) : (
                <>
                  <strong>Choose file from your device</strong>
                  <small>Click to browse .xlsx spreadsheets</small>
                </>
              )}
            </div>
          </div>
        </label>
      </div>

      {/* 3. UPLOAD BUTTON */}
      <div className="bulk-step-block">
        <span className="bulk-step-label">3. Upload & Ingest</span>
        <button
          type="button"
          className="bulk-upload-submit-btn"
          onClick={upload}
          disabled={busy || !file}
        >
          <svg className="bulk-btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span>{busy ? 'Processing & Ingesting…' : 'Upload .xlsx'}</span>
        </button>
      </div>

      {/* ERROR & SUCCESS FEEDBACK */}
      {error && <p className="form-error-msg">{error}</p>}
      {result && (
        <div className="upload-result-box">
          <div className="upload-success-badge">
            ✓ Successfully imported {result.records || 0} defect records
          </div>
          {(result.failed_rows || []).length > 0 && (
            <div className="upload-failed-list">
              <span className="failed-title">Failed rows ({result.failed_rows.length}):</span>
              {result.failed_rows.map(row => (
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

