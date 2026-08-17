import { useState } from 'react';
import { useList } from '../../hooks/useList';
import { formatMs, formatRelative } from '../../lib/formatters';

export default function ToolsList() {
  const [limit, setLimit] = useState(25);
  const { items, loading, error } = useList('/metrics/tool-executions', { limit });

  return (
    <div>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-[40px] font-bold text-dark-charcoal">Tool Executions</h1>
          <p className="mt-2 text-text-secondary text-sm">Individual tool calls made by Vigil.</p>
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
              <th className="px-4 py-3 font-medium">Tool</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No tool executions yet</td></tr>
            ) : items.map((row, i) => (
              <tr key={row.id || i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <span className="font-medium text-dark-charcoal">{row.tool_name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-vigil/10 text-vigil">{row.product_slug}</span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{row.user_fullname || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    row.tool_status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>{row.tool_status}</span>
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
