import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BarChartWidget({ data = [], xKey = 'name', yKey = 'value', color = '#7C3AED', label }) {
  if (!data.length) return <div className="bg-white rounded shadow-md p-6"><p className="text-sm text-text-muted">No data</p></div>;

  return (
    <div className="bg-white rounded shadow-md p-6">
      {label && <p className="text-sm font-semibold text-dark-charcoal mb-4">{label}</p>}
      <ResponsiveContainer width="100%" height={240}>
        <ReBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
