import { useFieldResponderStore } from '../../store/fieldResponderStore'

const STAGES = [
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'en_route', label: 'En Route' },
  { id: 'on_scene', label: 'On Scene' },
  { id: 'incident_clear', label: 'Incident Clear' },
]

export default function FieldResponderProgressStrip({ compact = false }) {
  const assignmentStage = useFieldResponderStore((s) => s.assignmentStage)
  const currentIdx = STAGES.findIndex((s) => s.id === assignmentStage)

  return (
    <div className={`fr-progress-strip${compact ? ' fr-progress-strip--compact' : ''}`}>
      <div className="fr-progress-stages">
        {STAGES.map((stage, i) => {
          const done = i < currentIdx
          const current = i === currentIdx
          return (
            <div key={stage.id} className="fr-progress-stage">
              {i > 0 && (
                <span
                  className={`fr-progress-line${done || current ? ' fr-progress-line--done' : ''}`}
                  aria-hidden
                />
              )}
              <div className="fr-progress-stage-inner">
                <span
                  className={`fr-progress-circle${done ? ' fr-progress-circle--done' : ''}${current ? ' fr-progress-circle--current' : ''}`}
                  aria-hidden
                />
                <span
                  className={`fr-progress-label${done || current ? ' fr-progress-label--active' : ''}`}
                >
                  {stage.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
