import { Phone, Check, MessageSquare, MapPin, Bot, Truck } from 'lucide-react'
import { IntakePanel, PanelHeader } from './IntakeUi'

const ICONS = { phone: Phone, check: Check, message: MessageSquare, map: MapPin, bot: Bot, truck: Truck }

function StepIcon({ step }) {
  const Icon = ICONS[step.icon] || Check
  const done = step.status === 'done'
  const current = step.status === 'current'

  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border"
      style={{
        background: done || current ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
        borderColor: current ? 'var(--accent)' : done ? 'var(--border)' : 'var(--border-subtle)',
        color: current ? 'var(--accent)' : done ? 'var(--text-secondary)' : 'var(--text-muted)',
      }}
    >
      {done ? <Check size={14} strokeWidth={2.5} /> : <Icon size={13} />}
    </div>
  )
}

export default function IncidentTimeline({ steps }) {
  return (
    <IntakePanel className="p-4 md:p-5">
      <PanelHeader title="Incident progress" />
      <ol className="list-none m-0 p-0 space-y-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          const done = step.status === 'done'
          const current = step.status === 'current'
          return (
            <li key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepIcon step={step} />
                {!isLast && (
                  <div
                    className="w-px flex-1 min-h-[20px] my-1"
                    style={{
                      background: done ? 'var(--accent)' : 'var(--border-subtle)',
                      opacity: done ? 0.5 : 1,
                    }}
                  />
                )}
              </div>
              <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                <div
                  className="text-[12px] font-semibold leading-tight"
                  style={{
                    color: current ? 'var(--accent)' : done ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {step.label}
                </div>
                {current && (
                  <span className="text-[10px] text-(--text-muted) mt-0.5 block">In progress</span>
                )}
                {step.status === 'pending' && (
                  <span className="text-[10px] text-(--text-muted) mt-0.5 block">Pending</span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </IntakePanel>
  )
}
