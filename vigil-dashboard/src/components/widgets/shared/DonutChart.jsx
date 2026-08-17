import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#7C3AED', '#2660A4', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4'];

export default function DonutChartWidget({ data = [], nameKey = 'name', valueKey = 'value', label }) {
  if (!data.length) return <div className="bg-white rounded shadow-md p-6"><p className="text-sm text-text-muted">No data</p></div>;

  return (
    <div className="bg-white rounded shadow-md p-6">
      {label && <p className="text-sm font-semibold text-dark-charcoal mb-4">{label}</p>}
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey={valueKey} nameKey={nameKey}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
