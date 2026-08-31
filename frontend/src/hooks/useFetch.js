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

        if (!mounted) {return;}

        // Use real API response even if empty (empty array/object are valid responses)
        // Only fall back to mock data on actual network/HTTP errors
        setData(response.data);
      } catch (err) {
        if (!mounted) {return;}

        // On error, use fallback mock data
        setData(fallback);
        setError(err.response?.data?.message || err.message || 'Unable to load data');
      } finally {
        if (mounted) {setLoading(false);}
      }
    };

    load();
    window.addEventListener('railway-refresh', load);

    return () => {
      mounted = false;
      window.removeEventListener('railway-refresh', load);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return { data, setData, loading, error };
}
