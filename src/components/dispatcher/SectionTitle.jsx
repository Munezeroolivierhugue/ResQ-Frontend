export default function SectionTitle({ title, badge, accent = true, className = '' }) {
  return (
    <div className={`dispatcher-section-title ${className}`.trim()}>
      {accent && <span className="dispatcher-section-accent" aria-hidden />}
      <span className="panel-title">{title}</span>
      {badge}
    </div>
  )
}
