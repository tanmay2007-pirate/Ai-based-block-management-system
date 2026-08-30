import { useEffect, useState } from 'react';
import api from '../services/api';
import { getMockData } from '../services/mockData';

export default function useFetch(path, initial) {
  const fallback = getMockData(path) || initial;
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await api.get(path);
        if (mounted && response.data && (Array.isArray(response.data) ? response.data.length > 0 : Object.keys(response.data).length > 0)) {
          setData(response.data);
        } else if (mounted) {
          setData(fallback);
        }
      } catch {
        if (mounted) {
          setData(fallback);
        }
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

  return { data, setData, loading };
}
