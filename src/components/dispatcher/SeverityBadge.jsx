/** Maps severity level to CSS variable tokens defined in index.css */
const SEVERITY_STYLES = {
  CRITICAL: { bg: 'var(--severity-critical-bg)', color: 'var(--severity-critical)', border: 'var(--severity-critical)' },
  HIGH:     { bg: 'var(--severity-high-bg)',     color: 'var(--severity-high)',     border: 'var(--severity-high)' },
  MEDIUM:   { bg: 'var(--severity-medium-bg)',   color: 'var(--severity-medium)',   border: 'var(--severity-medium)' },
  LOW:      { bg: 'var(--severity-low-bg)',       color: 'var(--severity-low)',       border: 'var(--severity-low)' },
}

/**
 * @param {{ severity: 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW', strikethrough?: boolean, size?: 'sm'|'lg' }} props
 */
export default function SeverityBadge({ severity, strikethrough = false, size = 'sm' }) {
  const s = SEVERITY_STYLES[severity?.toUpperCase()] || SEVERITY_STYLES.LOW
  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded border ${size === 'lg' ? 'text-sm px-3 py-1' : 'text-[10px] px-2.5 py-0.5'}`}
      style={{
        background: s.bg,
        color: s.color,
        borderColor: s.border,
        textDecoration: strikethrough ? 'line-through' : 'none',
        opacity: strikethrough ? 0.5 : 1,
        fontFamily: 'var(--font-display)',
      }}
    >
      {severity}
    </span>
  )
}
