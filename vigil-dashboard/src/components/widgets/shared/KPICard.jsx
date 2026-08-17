export default function KPICard({ label, value, subtext, icon: Icon, iconColor = '#7C3AED', iconBg = '#EDE9FE' }) {
  const displayValue = value === undefined || value === null || value === '' ? '—' : value;

  return (
    <div className="bg-white rounded shadow-md p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: iconBg, color: iconColor }}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-bold text-dark-charcoal leading-none">{displayValue}</span>
      </div>
      {subtext && <div className="mt-auto text-sm text-text-muted">{subtext}</div>}
    </div>
  );
}
