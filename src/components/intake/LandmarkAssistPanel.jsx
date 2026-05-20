import { MapPinned } from 'lucide-react'
import { IntakePanel, PanelHeader } from './IntakeUi'
import FieldLabel from '../ui/FieldLabel'

export default function LandmarkAssistPanel({ data }) {
  return (
    <IntakePanel className="p-4 md:p-5">
      <PanelHeader icon={MapPinned} title="Landmark assist" />
      <div className="space-y-3">
        <div>
          <FieldLabel className="mb-1.5">Nearby landmarks</FieldLabel>
          <ul className="m-0 pl-0 list-none space-y-1">
            {data.landmarks.map((name) => (
              <li
                key={name}
                className="text-[12px] text-(--text-secondary) pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-(--accent)"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-(--border-subtle)">
          <div>
            <FieldLabel>Suggested area</FieldLabel>
            <div className="text-[12px] font-semibold text-(--text-primary)">{data.suggestedArea}</div>
          </div>
          <div>
            <FieldLabel>Location confidence</FieldLabel>
            <div className="text-[12px] font-semibold text-(--accent)">{data.confidence}%</div>
          </div>
        </div>
      </div>
    </IntakePanel>
  )
}
