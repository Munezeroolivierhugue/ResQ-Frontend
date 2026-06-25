import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, FileText, Camera, Building2, Mic, Send, X } from 'lucide-react'
import {
  FR_INCIDENT_TYPES,
  FR_SCENE_STATUSES,
  FR_AGENCY_OPTIONS,
} from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'

function YesNoToggle({ value, onChange, label }) {
  return (
    <div className="dispatcher-field">
      <span className="field-label">{label}</span>
      <div className="fr-yesno">
        {['YES', 'NO'].map((opt) => (
          <button
            key={opt}
            type="button"
            className={`fr-yesno-btn${value === opt ? ' fr-yesno-btn--on' : ''}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function FRFieldReport() {
  const navigate = useNavigate()
  const submitReport = useFieldResponderStore((s) => s.submitReport)
  const showToast = useFieldResponderStore((s) => s.showToast)

  const [incidentType, setIncidentType] = useState('Armed Robbery')
  const [persons, setPersons] = useState('2')
  const [injuries, setInjuries] = useState('')
  const [suspects, setSuspects] = useState('YES')
  const [sceneStatus, setSceneStatus] = useState('Scene Active')
  const [description, setDescription] = useState('')
  const [actions, setActions] = useState('')
  const [supportNeeded, setSupportNeeded] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [agencies, setAgencies] = useState([])
  const [hasPhoto, setHasPhoto] = useState(true)

  const showAgency = sceneStatus === 'Requires Specialist' || suspects === 'YES'

  const toggleAgency = (name) => {
    setAgencies((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    )
  }

  const handleSubmit = () => {
    submitReport({ persons, injuries, suspects, sceneStatus, description, actions, supportNeeded, followUp, agencies })
    showToast('Report submitted · Status: Available', 'success')
    navigate('/field-responder/shift-start')
  }

  return (
    <div className="fr-page fr-page--report">
      <div className="dispatcher-surface fr-card fr-card--tight">
        <div className="fr-card-header">
          <ClipboardList size={16} className="text-(--accent)" />
          <span className="font-semibold text-[13px]">Quick Assessment</span>
          <span className="text-[11px] text-(--text-muted) ml-auto">Required · &lt; 30 seconds</span>
        </div>
        <label className="dispatcher-field">
          <span className="field-label">Confirmed incident type</span>
          <select
            className="dispatcher-input dispatcher-select"
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
          >
            {FR_INCIDENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="dispatcher-field">
          <span className="field-label">Persons involved</span>
          <input
            type="number"
            min={0}
            className="dispatcher-input dispatcher-text-input fr-touch-input"
            value={persons}
            onChange={(e) => setPersons(e.target.value)}
          />
        </label>
        <YesNoToggle label="Injuries present" value={injuries} onChange={setInjuries} />
        <YesNoToggle label="Suspects present" value={suspects} onChange={setSuspects} />
        <span className="field-label">Scene status</span>
        {FR_SCENE_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`fr-tap-card fr-tap-card--full${sceneStatus === s ? ' fr-tap-card--selected' : ''}`}
            onClick={() => setSceneStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="dispatcher-surface fr-card fr-card--tight">
        <div className="fr-card-header">
          <FileText size={16} className="text-(--accent)" />
          <span className="font-semibold text-[13px]">Incident Detail</span>
        </div>
        <label className="dispatcher-field">
          <span className="field-label">What did you find?</span>
          <textarea
            className="dispatcher-input dispatcher-textarea"
            style={{ minHeight: '100px' }}
            placeholder="Describe what you observed on arrival..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="button" className="fr-voice-btn">
            <Mic size={14} />
            Speak to fill
          </button>
        </label>
        <label className="dispatcher-field">
          <span className="field-label">Actions taken</span>
          <textarea
            className="dispatcher-input dispatcher-textarea"
            style={{ minHeight: '80px' }}
            placeholder="Describe actions taken..."
            value={actions}
            onChange={(e) => setActions(e.target.value)}
          />
        </label>
        <YesNoToggle label="Additional support still needed?" value={supportNeeded} onChange={setSupportNeeded} />
        <label className="dispatcher-field">
          <span className="field-label">Recommended follow-up</span>
          <textarea
            className="dispatcher-input dispatcher-textarea"
            style={{ minHeight: '60px' }}
            placeholder="Optional — recommend next steps..."
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
          />
        </label>
      </div>

      <div className="dispatcher-surface fr-card fr-card--tight">
        <div className="fr-card-header">
          <Camera size={16} className="text-(--accent)" />
          <span className="font-semibold text-[13px]">Photos</span>
          <span className="text-[11px] text-(--text-muted) ml-auto">Optional</span>
        </div>
        <div className="fr-photo-grid">
          <button type="button" className="fr-photo-add">
            <Camera size={24} className="text-(--text-muted)" />
            <span>Add Photo</span>
          </button>
          {hasPhoto && (
            <div className="fr-photo-thumb">
              <button type="button" className="fr-photo-remove" onClick={() => setHasPhoto(false)} aria-label="Remove">
                <X size={10} />
              </button>
              <div className="fr-photo-meta font-mono">14:28 · -1.9441, 30.0619</div>
            </div>
          )}
        </div>
      </div>

      {showAgency && (
        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="fr-card-header">
            <Building2 size={16} className="text-(--accent)" />
            <span className="font-semibold text-[13px]">Agency Referral</span>
            <span className="fr-ai-badge">Required for this case</span>
          </div>
          {FR_AGENCY_OPTIONS.map((name) => (
            <button
              key={name}
              type="button"
              className={`fr-check-card${agencies.includes(name) ? ' fr-check-card--on' : ''}`}
              onClick={() => toggleAgency(name)}
            >
              <span className="fr-check-box">{agencies.includes(name) ? '✓' : ''}</span>
              {name}
            </button>
          ))}
          <p className="text-[11px] text-(--text-muted) m-0 mt-2">
            System will automatically generate a handover record for selected agencies.
          </p>
        </div>
      )}

      <div className="fr-submit-bar">
        <button type="button" className="dispatcher-btn-primary fr-submit-btn" onClick={handleSubmit}>
          <Send size={18} />
          Submit Report
        </button>
      </div>
    </div>
  )
}
