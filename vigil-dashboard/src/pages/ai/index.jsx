import { useState } from 'react';
import { useList } from '../../hooks/useList';
import { formatMs, formatRelative } from '../../lib/formatters';
import { useMetrics } from '../../hooks/useMetrics';
import BarChartWidget from '../../components/widgets/shared/BarChart';

export default function AIList() {
  const [limit, setLimit] = useState(25);
  const { items, loading, error } = useList('/metrics/tool-executions', { limit });
  const { data: providerData } = useMetrics('/metrics/providers');

  return (
    <div>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-[40px] font-bold text-dark-charcoal">AI Interactions</h1>
          <p className="mt-2 text-text-secondary text-sm">Provider calls, latency, and token usage.</p>
        </div>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="border border-border-gray rounded px-3 py-1.5 text-sm">
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} rows</option>)}
        </select>
      </div>

      {/* Provider breakdown chart */}
      {providerData && providerData.length > 0 && (
        <div className="mb-10 widget-enter widget-hover" style={{ animationDelay: '0ms' }}>
          <BarChartWidget
            data={providerData.map(p => ({ name: p.provider, calls: p.total_calls }))}
            xKey="name"
            yKey="calls"
            label="Calls by Provider"
          />
        </div>
      )}

      {error && <p className="rounded bg-red-50 p-3 text-sm text-danger mb-6">{error}</p>}

      <div className="bg-white rounded shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-text-secondary">
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Total Calls</th>
              <th className="px-4 py-3 font-medium">Input Tokens</th>
              <th className="px-4 py-3 font-medium">Output Tokens</th>
              <th className="px-4 py-3 font-medium">Avg Latency</th>
              <th className="px-4 py-3 font-medium">Errors</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">Loading…</td></tr>
            ) : !providerData || providerData.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No AI interactions yet</td></tr>
            ) : providerData.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-dark-charcoal">{row.provider}</td>
                <td className="px-4 py-3 text-text-secondary">{row.model}</td>
                <td className="px-4 py-3">{row.total_calls}</td>
                <td className="px-4 py-3 text-text-muted">{row.total_input_tokens?.toLocaleString()}</td>
                <td className="px-4 py-3 text-text-muted">{row.total_output_tokens?.toLocaleString()}</td>
                <td className="px-4 py-3 text-text-muted">{formatMs(row.avg_latency_ms)}</td>
                <td className="px-4 py-3">
                  {row.error_count > 0 ? (
                    <span className="text-danger font-medium">{row.error_count}</span>
                  ) : (
                    <span className="text-success">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
