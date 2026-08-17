import { AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AreaChartWidget({ data = [], xKey = 'date', yKey = 'count', color = '#7C3AED', label }) {
  if (!data.length) return <div className="bg-white rounded shadow-md p-6"><p className="text-sm text-text-muted">No data</p></div>;

  return (
    <div className="bg-white rounded shadow-md p-6">
      {label && <p className="text-sm font-semibold text-dark-charcoal mb-4">{label}</p>}
      <ResponsiveContainer width="100%" height={240}>
        <ReAreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Area type="monotone" dataKey={yKey} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
