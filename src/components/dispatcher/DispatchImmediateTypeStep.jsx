import {
  Shield, AlertTriangle, Flame, Plus, Car, Users, User, AlertCircle,
} from 'lucide-react'
import { IMMEDIATE_INCIDENT_TYPES } from '../../data/mockDispatchImmediateData'

const ICONS = {
  shield: Shield,
  warning: AlertTriangle,
  fire: Flame,
  medical: Plus,
  car: Car,
  people: Users,
  person: User,
  alert: AlertCircle,
}

export default function DispatchImmediateTypeStep({
  detectedTypeId,
  onSelect,
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[920px]">
        <h2
          className="text-xl font-bold text-(--text-primary) m-0 mb-1 text-center"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Select Incident Type
        </h2>
        <p className="text-[14px] text-(--text-secondary) m-0 mb-6 text-center">
          Select quickly — unit recommendation loads instantly after selection
        </p>

        <div className="dispatch-immediate-type-grid">
          {IMMEDIATE_INCIDENT_TYPES.map((type) => {
            const Icon = ICONS[type.icon] || AlertCircle
            const detected = detectedTypeId === type.id
            return (
              <button
                key={type.id}
                type="button"
                className={`dispatch-immediate-type-btn${detected ? ' dispatch-immediate-type-btn--detected' : ''}`}
                onClick={() => onSelect(type)}
              >
                {detected && (
                  <span className="dispatch-immediate-type-detected-badge">Detected from call</span>
                )}
                <Icon size={26} className="dispatch-immediate-type-icon" strokeWidth={1.75} />
                <span className="dispatch-immediate-type-label">{type.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
