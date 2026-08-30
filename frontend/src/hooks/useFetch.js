import { useEffect, useState } from 'react';
import api from '../services/api';
import { getMockData } from '../services/mockData';

export default function useFetch(path, initial) {
const fallback = getMockData(path) || initial;
const [data, setData] = useState(fallback);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  let mounted = true;

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(path);

      if (!mounted) return;

      if (response.data && (Array.isArray(response.data) ? response.data.length > 0 : Object.keys(response.data).length > 0)) {
        setData(response.data);
      } else {
        setData(fallback);
      }
    } catch (err) {
      if (!mounted) return;

      setData(fallback);
      setError(err.response?.data?.message || err.message || 'Unable to load data');
    } finally {
      if (mounted) setLoading(false);
    }
  };

  load();
  window.addEventListener('railway-refresh', load);

  return () => {
    mounted = false;
    window.removeEventListener('railway-refresh', load);
  };
}, [path]);

return { data, setData, loading, error };
}
