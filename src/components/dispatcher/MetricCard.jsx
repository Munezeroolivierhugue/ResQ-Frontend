const HINT_TONES = {
  positive: 'dispatcher-metric-hint--positive',
  neutral: 'dispatcher-metric-hint--neutral',
  warning: 'dispatcher-metric-hint--warning',
}

export default function MetricCard({ icon: Icon, label, value, hint, hintTone = 'neutral', className = '', children }) {
  return (
    <div className={`dispatcher-metric-card ${className}`.trim()}>
      {Icon && (
        <span className="dispatcher-metric-icon" aria-hidden>
          <Icon size={16} />
        </span>
      )}
      <div className="field-label mb-1">{label}</div>
      <div className="dispatcher-metric-value">{value}</div>
      {hint && <div className={HINT_TONES[hintTone] || HINT_TONES.neutral}>{hint}</div>}
      {children}
    </div>
  )
}
