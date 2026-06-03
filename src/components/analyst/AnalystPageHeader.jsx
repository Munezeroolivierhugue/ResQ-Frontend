export default function AnalystPageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="dispatcher-page-title m-0">{title}</h1>
      {subtitle && <p className="dispatcher-page-subtitle m-0 mt-2">{subtitle}</p>}
    </div>
  )
}
