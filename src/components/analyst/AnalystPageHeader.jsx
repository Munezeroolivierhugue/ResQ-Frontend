export default function AnalystPageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex justify-between items-start">
      <div>
        <h1 className="dispatcher-page-title m-0">{title}</h1>
        {subtitle && <p className="dispatcher-page-subtitle m-0 mt-2">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
