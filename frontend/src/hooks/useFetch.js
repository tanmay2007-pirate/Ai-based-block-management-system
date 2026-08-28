import { useEffect, useState } from 'react';
import api from '../services/api';

export default function useFetch(path, initial) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = () => api.get(path).then(response => setData(response.data)).catch(() => {}).finally(() => setLoading(false));
    load(); window.addEventListener('railway-refresh', load);
    return () => window.removeEventListener('railway-refresh', load);
  }, [path]);
  return { data, setData, loading };
}
