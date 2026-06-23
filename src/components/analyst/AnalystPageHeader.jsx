export default function AnalystPageHeader({ title, subtitle, eyebrow }) {
  return (
    <div className="mb-6">
      {eyebrow && <span className="dispatcher-eyebrow">{eyebrow}</span>}
      <h1 className="dispatcher-page-title m-0">{title}</h1>
      {subtitle && <p className="dispatcher-page-subtitle m-0 mt-2">{subtitle}</p>}
    </div>
  )
}
