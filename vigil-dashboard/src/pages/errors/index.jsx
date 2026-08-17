import { useState } from 'react';
import { useList } from '../../hooks/useList';
import { formatDateTime, formatRelative } from '../../lib/formatters';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function ErrorsList() {
  const [limit, setLimit] = useState(25);
  const [expanded, setExpanded] = useState(null);
  const { items, loading, error } = useList('/metrics/questions', { limit, filters: { status: 'error' } });

  // Fallback: fetch from a direct error_logs endpoint if available
  const { items: errorItems, loading: errorLoading } = useList('/error-logs', { limit });

  const displayItems = errorItems.length > 0 ? errorItems : items.filter(i => i.status === 'error');

  return (
    <div>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-[40px] font-bold text-dark-charcoal">Errors</h1>
          <p className="mt-2 text-text-secondary text-sm">Failed requests and AI provider errors.</p>
        </div>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="border border-border-gray rounded px-3 py-1.5 text-sm">
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} rows</option>)}
        </select>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-danger mb-6">{error}</p>}

      <div className="bg-white rounded shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-text-secondary">
              <th className="px-4 py-3 font-medium">Error</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Endpoint</th>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {(loading || errorLoading) ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Loading…</td></tr>
            ) : displayItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-success" />
                  </div>
                  <p className="font-medium text-dark-charcoal">No errors</p>
                  <p className="text-sm text-text-muted mt-1">Everything is running smoothly.</p>
                </td>
              </tr>
            ) : displayItems.map((row, i) => (
              <tr key={row.id || i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <span className="font-medium text-danger">{row.error_name || row.status}</span>
                  <span className="block text-xs text-text-muted max-w-xs truncate">{row.error_message || row.content}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">{row.source || 'api'}</span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{row.user_fullname || '—'}</td>
                <td className="px-4 py-3 text-text-muted text-xs">{row.endpoint || '—'}</td>
                <td className="px-4 py-3 text-text-muted">{formatRelative(row.created_at)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setExpanded(expanded === i ? null : i)} className="text-text-muted hover:text-dark-charcoal">
                    {expanded === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
