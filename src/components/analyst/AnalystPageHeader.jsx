export default function AnalystPageHeader({ title, subtitle, eyebrow, badge }) {
  return (
    <div className="mb-6">
      {eyebrow && <span className="dispatcher-eyebrow">{eyebrow}</span>}
      {badge && <span className="dispatcher-eyebrow">{badge}</span>}
      <h1 className="dispatcher-page-title m-0">{title}</h1>
      {subtitle && <p className="dispatcher-page-subtitle m-0 mt-2">{subtitle}</p>}
    </div>
  )
}
