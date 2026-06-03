export default function AdminPageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap justify-between gap-4 items-start mb-6">
      <div>
        <h1 className="dispatcher-page-title m-0">{title}</h1>
        {subtitle && <p className="dispatcher-page-subtitle m-0 mt-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
