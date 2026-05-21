import { ChevronRight } from 'lucide-react'

export default function PageHeader({
  breadcrumbParent = 'Dispatcher',
  breadcrumbCurrent,
  title,
  subtitle,
  badges,
  actions,
}) {
  return (
    <header className="dispatcher-page-header mb-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[12px] text-(--text-muted)">{breadcrumbParent}</span>
            <ChevronRight size={12} className="text-(--text-muted)" />
            <span className="text-[12px] text-(--text-secondary)">{breadcrumbCurrent}</span>
          </div>
          {badges && <div className="flex flex-wrap items-center gap-2 mb-2">{badges}</div>}
          <h1 className="dispatcher-page-title">{title}</h1>
          {subtitle && <p className="dispatcher-page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  )
}
