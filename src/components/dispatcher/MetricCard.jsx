// Same stat-tile design used on AdminDashboard/AdminStatCard: icon in a
// tinted accent circle, big mono value, label below, colored hint text —
// rolled out here so every portal that shares this component (Dispatcher,
// Planner, Analyst, Ops Manager dashboards) matches the admin reference.
const HINT_COLOR = {
  positive: 'var(--status-low)',
  neutral: 'var(--accent-dim)',
  warning: 'var(--status-medium)',
  critical: 'var(--status-critical)',
}

export default function MetricCard({ icon: Icon, label, value, hint, hintTone = 'neutral', className = '', children }) {
  return (
    <div className={`dispatcher-surface p-4 flex flex-col gap-3 ${className}`.trim()}>
      {Icon && (
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent-ghost)' }}>
          <Icon size={17} style={{ color: 'var(--accent)' }} />
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <div className="font-mono text-[26px] font-bold leading-none text-(--text-primary)">{value}</div>
        <div className="text-[12px] font-medium text-(--text-secondary)">{label}</div>
        {hint && (
          <div className="text-[11px] font-medium mt-0.5" style={{ color: HINT_COLOR[hintTone] || HINT_COLOR.neutral }}>
            {hint}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
