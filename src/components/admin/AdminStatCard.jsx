// Same stat-tile design used on AdminDashboard: icon in a tinted accent
// circle, big value, label below — reused here so Users/Units/Agencies
// match the dashboard instead of the older dispatcher MetricCard style.
export default function AdminStatCard({ label, value, icon: Icon, sub }) {
  return (
    <div className="dispatcher-surface p-4 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent-ghost)' }}>
        <Icon size={17} style={{ color: 'var(--accent)' }} />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="font-mono text-[26px] font-bold leading-none text-(--text-primary)">{value}</div>
        <div className="text-[12px] font-medium text-(--text-secondary)">{label}</div>
        {sub && <div className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--accent-dim)' }}>{sub}</div>}
      </div>
    </div>
  )
}
