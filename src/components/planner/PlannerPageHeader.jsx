import { MapPin } from 'lucide-react'
import { PLANNER_DISTRICT } from '../../data/mockPlannerData'

export default function PlannerPageHeader({ title, subtitle, eyebrow }) {
  return (
    <div className="mb-6">
      {eyebrow && <span className="dispatcher-eyebrow">{eyebrow}</span>}
      <h1 className="dispatcher-page-title m-0">{title}</h1>
      <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono font-bold uppercase tracking-wider text-(--accent)">
        <MapPin size={14} aria-hidden />
        {PLANNER_DISTRICT} — ALL DISTRICTS
      </div>
      {subtitle && <p className="dispatcher-page-subtitle m-0 mt-2">{subtitle}</p>}
    </div>
  )
}
