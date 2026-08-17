import { Activity, AlertTriangle, Brain, MessageSquare, MessagesSquare, Wrench } from 'lucide-react';
import KPICard from '../../components/widgets/shared/KPICard';
import AreaChartWidget from '../../components/widgets/shared/AreaChart';
import DonutChartWidget from '../../components/widgets/shared/DonutChart';
import { useMetrics } from '../../hooks/useMetrics';
import { formatCompactNumber, formatMs } from '../../lib/formatters';

const OVERVIEW_KEYS = [
  { key: 'total_questions', label: 'Total Questions', icon: MessageSquare, iconColor: '#7C3AED', iconBg: '#EDE9FE' },
  { key: 'total_sessions', label: 'Sessions', icon: MessagesSquare, iconColor: '#2660A4', iconBg: '#E8F0FB' },
  { key: 'unique_users', label: 'Unique Users', icon: Activity, iconColor: '#22C55E', iconBg: '#DCFCE7' },
  { key: 'total_tool_calls', label: 'Tool Calls', icon: Wrench, iconColor: '#F59E0B', iconBg: '#FEF3C7' },
  { key: 'error_rate', label: 'Error Rate', icon: AlertTriangle, iconColor: '#EF4444', iconBg: '#FEE2E2' },
];

export default function DashboardOverview() {
  const { data, loading, error } = useMetrics('/metrics/overview');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-vigil border-t-transparent rounded-full" />
        <span className="ml-3 text-sm text-text-secondary">Loading metrics…</span>
      </div>
    );
  }

  if (error) {
    return <p className="rounded bg-red-50 p-3 text-sm text-danger">{error}</p>;
  }

  const total = data?.total_questions || 0;
  const errors = data?.error_count || 0;
  const errorRate = total > 0 ? ((errors / total) * 100).toFixed(1) + '%' : '0%';

  const kpiValues = {
    total_questions: formatCompactNumber(data?.total_questions),
    total_sessions: formatCompactNumber(data?.total_sessions),
    unique_users: formatCompactNumber(data?.unique_users),
    total_tool_calls: formatCompactNumber(data?.total_tool_calls || 0),
    error_rate: errorRate,
  };

  const kpiSubtext = {
    total_questions: `${formatMs(data?.avg_duration_ms)} avg response`,
    total_sessions: 'Unique conversations',
    unique_users: 'Across all products',
    total_tool_calls: 'Executed by AI',
    error_rate: `${errors} total errors`,
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-[40px] font-bold text-dark-charcoal">Vigil Overview</h1>
        <p className="mt-2 text-text-secondary text-sm">AI assistant usage and performance metrics.</p>
      </div>

      {/* KPIs */}
      <div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-16 grid">
        {OVERVIEW_KEYS.map((kpi, i) => (
          <div key={kpi.key} className="widget-enter widget-hover" style={{ animationDelay: `${Math.min(i * 60, 600)}ms` }}>
            <KPICard
              label={kpi.label}
              value={kpiValues[kpi.key]}
              subtext={kpiSubtext[kpi.key]}
              icon={kpi.icon}
              iconColor={kpi.iconColor}
              iconBg={kpi.iconBg}
            />
          </div>
        ))}
      </div>

      {/* Token usage summary */}
      <div className="mb-16">
        <h2 className="text-xl font-bold text-gray-500 mb-8">TOKEN USAGE</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="widget-enter widget-hover" style={{ animationDelay: '0ms' }}>
            <div className="bg-white rounded shadow-md p-6">
              <p className="text-sm text-text-secondary mb-1">Input Tokens</p>
              <p className="text-[28px] font-bold text-dark-charcoal">{formatCompactNumber(data?.total_input_tokens)}</p>
            </div>
          </div>
          <div className="widget-enter widget-hover" style={{ animationDelay: '80ms' }}>
            <div className="bg-white rounded shadow-md p-6">
              <p className="text-sm text-text-secondary mb-1">Output Tokens</p>
              <p className="text-[28px] font-bold text-dark-charcoal">{formatCompactNumber(data?.total_output_tokens)}</p>
            </div>
          </div>
          <div className="widget-enter widget-hover" style={{ animationDelay: '160ms' }}>
            <div className="bg-white rounded shadow-md p-6">
              <p className="text-sm text-text-secondary mb-1">Success vs Errors</p>
              <p className="text-[28px] font-bold text-dark-charcoal">
                <span className="text-success">{formatCompactNumber(data?.success_count)}</span>
                <span className="text-text-muted mx-1">/</span>
                <span className="text-danger">{formatCompactNumber(errors)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
