import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Flag, Check } from 'lucide-react'
import SeverityBanner from '../../components/field-responder/SeverityBanner'
import FieldResponderProgressStrip from '../../components/field-responder/FieldResponderProgressStrip'
import FlagIssueModal from '../../components/field-responder/FlagIssueModal'
import { FR_ASSIGNMENT, etaColor } from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'

export default function FRAssignment() {
  const navigate = useNavigate()
  const acceptAssignment = useFieldResponderStore((s) => s.acceptAssignment)
  const [flagOpen, setFlagOpen] = useState(false)
  const a = FR_ASSIGNMENT

  const handleAccept = () => {
    acceptAssignment()
    navigate('/field-responder/navigation')
  }

  return (
    <div className="fr-page fr-page--assignment">
      <SeverityBanner
        severity={a.severity}
        label="INCOMING ASSIGNMENT"
        title={a.type}
        location={a.location}
        landmark={a.landmark}
        incidentId={a.id}
      />

      <FieldResponderProgressStrip />

      <div className="dispatcher-surface fr-card fr-card--tight">
        <div className="fr-card-header">
          <Phone size={14} className="text-(--accent)" />
          <span className="font-semibold text-[13px]">Caller Report</span>
          <span className="fr-ai-badge">AI summarized</span>
        </div>
        <div className="fr-divider" />
        {[
          ['Persons involved', a.caller.persons],
          ['Weapons reported', a.caller.weapons, true],
          ['Injuries confirmed', a.caller.injuries],
        ].map(([label, val, critical]) => (
          <div key={label} className="fr-info-row">
            <span className="text-(--text-secondary)">{label}</span>
            <span
              className={critical ? 'font-semibold' : ''}
              style={critical ? { color: 'var(--status-critical)' } : undefined}
            >
              {val}
            </span>
          </div>
        ))}
        <blockquote className="fr-caller-quote">{a.caller.description}</blockquote>
      </div>

      <div className="fr-key-numbers">
        {[
          { val: String(a.eta_minutes), unit: 'min ETA', color: etaColor(a.eta_minutes) },
          { val: String(a.distanceKm), unit: 'km away', color: 'var(--text-primary)' },
          { val: a.priority, unit: 'priority', color: 'var(--status-critical)' },
        ].map((tile) => (
          <div key={tile.unit} className="dispatcher-surface fr-key-tile">
            <div className="fr-key-value font-mono" style={{ color: tile.color }}>
              {tile.val}
            </div>
            <div className="fr-key-unit">{tile.unit}</div>
          </div>
        ))}
      </div>

      <div className="dispatcher-surface fr-card fr-card--tight">
        <div className="fr-card-header">
          <span className="font-semibold text-[13px]">Also Responding</span>
          <span className="fr-count-badge">{a.otherUnits.length}</span>
        </div>
        {a.otherUnits.map((u) => (
          <div key={u.id} className="fr-unit-row font-mono">
            <span className="text-(--accent) font-bold">{u.id}</span>
            <span className="text-(--text-secondary)">
              · {u.type} · ETA {u.eta}
            </span>
          </div>
        ))}
      </div>

      <div className="fr-action-bar">
        <button type="button" className="dispatcher-btn-ghost fr-flag-btn" onClick={() => setFlagOpen(true)}>
          <Flag size={18} />
          Flag Issue
        </button>
        <button type="button" className="dispatcher-btn-primary fr-accept-btn" onClick={handleAccept}>
          <Check size={18} />
          Accept Assignment
        </button>
      </div>

      <FlagIssueModal open={flagOpen} onClose={() => setFlagOpen(false)} />
    </div>
  )
}
