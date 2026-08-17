import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import http from '../lib/http';

export function useMetrics(resourcePath) {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    async function fetchMetrics() {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const query = new URLSearchParams();
        if (from) query.set('from', from);
        if (to) query.set('to', to);
        const qs = query.toString();

        const res = await http.authorized(`${resourcePath}${qs ? `?${qs}` : ''}`);
        if (!cancelled) setState({ data: res.data, loading: false, error: null });
      } catch (err) {
        if (!cancelled) setState({ data: null, loading: false, error: err.message || 'Failed to load metrics' });
      }
    }

    fetchMetrics();
    return () => { cancelled = true; };
  }, [from, to, resourcePath]);

  return state;
}
