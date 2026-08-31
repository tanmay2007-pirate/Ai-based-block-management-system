import { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const fields = {
  TMS: [
    ['asset_id', 'Asset ID'], ['asset_type', 'Asset type'], ['location_km', 'Location (km)'],
    ['defect_type', 'Defect type'], ['severity', 'Severity'], ['description', 'Description'], ['reported_by', 'Reported by'],
  ],
  TDMS: [
    ['asset_id', 'Asset ID'], ['loco_number', 'Loco number'], ['loco_type', 'Loco type'],
    ['defect_type', 'Defect type'], ['severity', 'Severity'], ['description', 'Description'], ['depot', 'Depot'], ['reported_by', 'Reported by'],
  ],
  SMMS: [
    ['asset_id', 'Asset ID'], ['signal_id', 'Signal ID'], ['signal_type', 'Signal type'], ['location_km', 'Location (km)'],
    ['defect_type', 'Defect type'], ['severity', 'Severity'], ['description', 'Description'], ['reported_by', 'Reported by'],
  ],
};

export default function AddDefectForm({ onComplete }) {
  const { session } = useAuth();
  const department = session?.user?.department;
  const config = fields[department];
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!config) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...values };
      if (payload.location_km !== undefined && payload.location_km !== '') payload.location_km = Number(payload.location_km);
      await api.post(`/` + department.toLowerCase() + '/defects', payload);
      setValues({});
      onComplete?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to add defect');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="defect-form" onSubmit={submit}>
      <div className="form-grid">
        {config.map(([name, label]) => (
          <div className="form-field" key={name}>
            <label htmlFor={`field-${name}`}>{label}</label>
            {name === 'severity' ? (
              <select
                id={`field-${name}`}
                required={name !== 'description'}
                value={values[name] || ''}
                onChange={event => setValues({ ...values, [name]: event.target.value })}
              >
                <option value="">Select severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            ) : name === 'description' ? (
              <input
                id={`field-${name}`}
                placeholder="Enter description of defect"
                type="text"
                value={values[name] || ''}
                onChange={event => setValues({ ...values, [name]: event.target.value })}
              />
            ) : (
              <input
                id={`field-${name}`}
                required
                placeholder={`Enter ${label.toLowerCase()}`}
                type={name === 'location_km' ? 'number' : 'text'}
                value={values[name] || ''}
                onChange={event => setValues({ ...values, [name]: event.target.value })}
              />
            )}
          </div>
        ))}
      </div>
      {error && <p className="form-error-msg">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="defect-submit-btn" disabled={saving}>
          {saving ? 'Saving defect…' : '＋ Add defect record'}
        </button>
      </div>
    </form>
  );
}
