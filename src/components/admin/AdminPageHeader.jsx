export default function AdminPageHeader({ title, subtitle, actions, badge }) {
  return (
    <div className="flex flex-wrap justify-between gap-4 items-start mb-6">
      <div>
        {/* {eyebrow && <span className="dispatcher-eyebrow">{eyebrow}</span>} */}
        {badge && <span className="dispatcher-eyebrow">{badge}</span>}
        <h1 className="dispatcher-page-title m-0">{title}</h1>
        {subtitle && <p className="dispatcher-page-subtitle m-0 mt-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
