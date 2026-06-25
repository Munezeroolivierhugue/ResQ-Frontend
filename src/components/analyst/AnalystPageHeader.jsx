export default function AnalystPageHeader({ title, subtitle, eyebrow, badge }) {
  return (
    <div className="mb-6">
      {eyebrow && <span className="dispatcher-eyebrow">{eyebrow}</span>}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="dispatcher-page-title m-0">{title}</h1>
        {badge && <span className="dispatcher-eyebrow">{badge}</span>}
      </div>
      {subtitle && <p className="dispatcher-page-subtitle m-0 mt-2">{subtitle}</p>}
    </div>
  )
}
