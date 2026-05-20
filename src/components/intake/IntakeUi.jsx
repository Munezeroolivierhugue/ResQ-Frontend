/** Shared intake UI primitives — visual only, no business logic. */
import FieldLabel from '../ui/FieldLabel'

export function IntakePanel({ children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-(--border) bg-(--bg-surface) shadow-[var(--shadow-card)] ${className}`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {children}
    </div>
  )
}

export function PanelHeader({ icon: Icon, title, badge, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-2 mb-3 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon size={14} className="text-(--accent) shrink-0" />}
        <h2 className="panel-title m-0 truncate">{title}</h2>
      </div>
      {badge}
    </div>
  )
}

export function ReadonlyField({ label, value, mono }) {
  return (
    <div className="rounded-lg border border-(--border-subtle) bg-(--bg-input) px-3 py-2.5">
      <FieldLabel className="mb-0.5">{label}</FieldLabel>
      <div
        className="text-[13px] font-semibold text-(--text-primary) leading-snug"
        style={mono ? { fontFamily: 'var(--font-mono)' } : undefined}
      >
        {value}
      </div>
    </div>
  )
}

const SEVERITY_STYLES = {
  critical: { bg: 'var(--status-critical-bg)', color: 'var(--status-critical)', label: 'CRITICAL' },
  high: { bg: 'var(--status-high-bg)', color: 'var(--status-high)', label: 'HIGH' },
  medium: { bg: 'var(--status-medium-bg)', color: 'var(--status-medium)', label: 'MEDIUM' },
  resolved: { bg: 'var(--status-low-bg)', color: 'var(--status-low)', label: 'RESOLVED' },
  low: { bg: 'var(--status-low-bg)', color: 'var(--status-low)', label: 'LOW' },
}

export function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold tracking-[0.08em] uppercase shrink-0"
      style={{ background: s.bg, color: s.color, fontFamily: 'var(--font-display)' }}
    >
      {s.label}
    </span>
  )
}

export function StatusPill({ label, color = 'var(--accent)' }) {
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
      style={{
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
        fontFamily: 'var(--font-display)',
      }}
    >
      {label}
    </span>
  )
}
