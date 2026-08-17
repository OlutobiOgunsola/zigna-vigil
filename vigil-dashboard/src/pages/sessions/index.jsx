import { useState } from 'react';
import { useList } from '../../hooks/useList';
import { formatDateTime, formatRelative, formatMs } from '../../lib/formatters';
import { RefreshCw } from 'lucide-react';

export default function SessionsList() {
  const [limit, setLimit] = useState(25);
  const { items, loading, error } = useList('/metrics/questions', { limit });

  return (
    <div>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-[40px] font-bold text-dark-charcoal">Sessions</h1>
          <p className="mt-2 text-text-secondary text-sm">Recent Vigil conversation sessions.</p>
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
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Direction</th>
              <th className="px-4 py-3 font-medium">Content</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No sessions yet</td></tr>
            ) : items.map((row, i) => (
              <tr key={row.id || i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <span className="font-medium text-dark-charcoal">{row.user_fullname}</span>
                  <span className="block text-xs text-text-muted">{row.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-vigil/10 text-vigil">{row.product_slug}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    row.direction === 'inbound' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                  }`}>{row.direction}</span>
                </td>
                <td className="px-4 py-3 max-w-xs truncate text-text-secondary">{row.content}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    row.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>{row.status}</span>
                </td>
                <td className="px-4 py-3 text-text-muted">{formatMs(row.duration_ms)}</td>
                <td className="px-4 py-3 text-text-muted">{formatRelative(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
