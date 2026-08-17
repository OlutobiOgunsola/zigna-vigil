import { useEffect, useState } from 'react';
import http from '../lib/http';

export function useList(resourcePath, { limit = 50, filters = {} } = {}) {
  const [state, setState] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    async function fetchList() {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const query = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') query.set(k, v);
        });
        if (limit) query.set('limit', limit);
        const qs = query.toString();

        const res = await http.authorized(`${resourcePath}${qs ? `?${qs}` : ''}`);
        if (!cancelled) {
          const data = res.data;
          setState({ items: Array.isArray(data) ? data : data?.items || data?.data || [], loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) setState({ items: [], loading: false, error: err.message || 'Failed to load' });
      }
    }

    fetchList();
    return () => { cancelled = true; };
  }, [resourcePath, limit, JSON.stringify(filters)]);

  return state;
}
