const VARIANTS = {
  resolved: { bg: 'var(--status-low-bg)', color: 'var(--status-low)' },
  handover: { bg: 'var(--status-medium-bg)', color: 'var(--status-medium)' },
  active: { bg: 'var(--accent-ghost)', color: 'var(--accent)' },
  info: { bg: 'var(--status-info-bg)', color: 'var(--status-info)' },
  critical: { bg: 'var(--status-critical-bg)', color: 'var(--status-critical)' },
}

export default function StatusBadge({ label, variant = 'resolved' }) {
  const s = VARIANTS[variant] || VARIANTS.resolved
  return (
    <span
      className="dispatcher-status-badge"
      style={{ background: s.bg, color: s.color, borderColor: `color-mix(in srgb, ${s.color} 35%, transparent)` }}
    >
      {label}
    </span>
  )
}
