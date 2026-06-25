import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, Mic, Zap, AlertTriangle, Check, X } from 'lucide-react'
import { DEFAULT_IMMEDIATE_INCIDENT_ID } from '../../data/mockDispatchImmediateData'
import { useThemeStore } from '../../store/themeStore'
import {
  mockActiveCall,
  mockAutoCaller,
  mockLocationSharing,
  mockIncidentTimeline,
  mockAiRecommendation,
  mockLiveNotesPlaceholder,
  mockDispatchQueue,
  INCIDENT_CATEGORIES,
} from '../../data/mockIntakeData'
import { mockCallers } from '../../data/mockCallers'
import { mockIncidents } from '../../data/mockIncidents'
import { mockTriageQuestions } from '../../data/mockTriageQuestions'
import { calculateSeverity } from '../../utils/severityEngine'
import { haversineMeters } from '../../utils/geo'
import LiveEmergencyBanner from '../../components/intake/LiveEmergencyBanner'
import TriageLocationMap from '../../components/dispatcher/TriageLocationMap'
import IncidentTimeline from '../../components/intake/IncidentTimeline'
import AiDispatchRecommendation from '../../components/intake/AiDispatchRecommendation'
import RecentIncidentsQueue from '../../components/intake/RecentIncidentsQueue'
import {
  IntakePanel,
  PanelHeader,
  ReadonlyField,
  StatusPill,
} from '../../components/intake/IntakeUi'
import SeverityBadge from '../../components/dispatcher/SeverityBadge'
import FieldLabel from '../../components/ui/FieldLabel'

// Maps UI incident category labels → triage question incident_type codes
const CATEGORY_TO_TRIAGE_TYPE = {
  'Medical': 'MEDICAL',
  'Traffic / MVA': 'RTA',
  'Fire': 'FIRE',
  'Security / Disturbance': 'SECURITY',
}

const RWANDA_DISTRICT_GROUPS = [
  {
    label: '── Kigali City ──',
    districts: ['Nyarugenge', 'Kicukiro', 'Gasabo'],
  },
  {
    label: '── Northern Province ──',
    districts: ['Musanze', 'Burera', 'Gakenke', 'Rulindo', 'Gicumbi'],
  },
  {
    label: '── Southern Province ──',
    districts: ['Huye', 'Nyamagabe', 'Gisagara', 'Nyaruguru', 'Muhanga', 'Kamonyi', 'Ruhango', 'Nyanza'],
  },
  {
    label: '── Eastern Province ──',
    districts: ['Rwamagana', 'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare'],
  },
  {
    label: '── Western Province ──',
    districts: ['Rubavu', 'Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rusizi', 'Rutsiro'],
  },
]

const SEVERITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

const ACTIVE_STATUSES = new Set(['RECEIVED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'active', 'pending'])

// Anchor "now" to mock data timestamp so duplicate detection fires in demo
const DEMO_NOW = new Date('2026-06-24T15:10:00Z')

const VERIFICATION_ITEMS = [
  { key: 'callback_confirmed',    label: 'Callback confirmed' },
  { key: 'location_verified',     label: 'Location verified' },
  { key: 'type_confirmed',        label: 'Incident type confirmed' },
  { key: 'life_threat_assessed',  label: 'Life threat assessed' },
  { key: 'specialized_support',   label: 'Specialized support evaluated' },
]

// The caller on the active incoming call
const activeCallerRecord = mockCallers.find(
  (c) => c.caller_id === 'c1111111-0000-4000-8000-000000000001'
)

export default function NewIncident() {
  const navigate = useNavigate()
  const { theme } = useThemeStore()

  // Capture call_time at mount (the moment the call is being handled)
  const callTimeRef = useRef(new Date().toISOString())

  // ── Triage ──────────────────────────────────────────────────────────────────
  const [incidentType, setIncidentType] = useState('')
  const [triageResponses, setTriageResponses] = useState([])

  // ── Severity override ────────────────────────────────────────────────────────
  const [severityOverrideActive, setSeverityOverrideActive] = useState(false)
  const [finalSeverity, setFinalSeverity] = useState('LOW')
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideReasonError, setOverrideReasonError] = useState(false)

  // ── Location (fed from TriageLocationMap) ────────────────────────────────────
  const [location, setLocation] = useState(null)

  // ── Timestamps ───────────────────────────────────────────────────────────────
  const [occurrenceTime, setOccurrenceTime] = useState('')

  // ── Verification checklist ───────────────────────────────────────────────────
  const [checklist, setChecklist] = useState({
    callback_confirmed:   false,
    location_verified:    false,
    type_confirmed:       false,
    life_threat_assessed: false,
    specialized_support:  false,
  })

  // ── Duplicate detection ──────────────────────────────────────────────────────
  const [duplicates, setDuplicates] = useState([])
  const [duplicateAction, setDuplicateAction] = useState(null) // null | 'link' | 'new'
  const [linkedIncidentId, setLinkedIncidentId] = useState(null)
  const [investigateIncident, setInvestigateIncident] = useState(null)

  // ── Basic form fields ────────────────────────────────────────────────────────
  const [district, setDistrict] = useState('')
  const [districtError, setDistrictError] = useState(false)
  const [notes, setNotes] = useState(mockLiveNotesPlaceholder)

  // ── Derived: triage questions for selected category ──────────────────────────
  const triageTypeCode = CATEGORY_TO_TRIAGE_TYPE[incidentType]
  const triageQuestions = useMemo(() => {
    if (!triageTypeCode) return []
    return mockTriageQuestions
      .filter((q) => q.incident_type === triageTypeCode)
      .sort((a, b) => a.display_order - b.display_order)
  }, [triageTypeCode])

  // ── Derived: severity from triage answers ────────────────────────────────────
  const calculatedSeverity = useMemo(
    () => calculateSeverity(incidentType, triageResponses),
    [incidentType, triageResponses]
  )

  // Effective severity: override wins when active
  const effectiveSeverity = severityOverrideActive ? finalSeverity : calculatedSeverity

  // ── Derived: form readiness ──────────────────────────────────────────────────
  const allChecked = Object.values(checklist).every(Boolean)
  const canSubmit =
    allChecked &&
    !!district &&
    (!severityOverrideActive || overrideReason.trim().length > 0)

  // Duplicate banner shown when pending action
  const showDuplicateBanner = duplicates.length > 0 && duplicateAction == null
  const firstDuplicate = duplicates[0]

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Reset triage answers whenever incident type changes
  useEffect(() => {
    setTriageResponses([])
  }, [incidentType])

  // Duplicate detection: runs whenever a precise location is established
  useEffect(() => {
    if (!location || location.source === 'TELECOM_ROUGH') {
      setDuplicates([])
      setDuplicateAction(null)
      return
    }
    const matches = mockIncidents
      .filter((inc) => {
        if (!ACTIVE_STATUSES.has(inc.status)) return false
        if (inc.lat == null || inc.lng == null) return false
        const distM = haversineMeters(location.lat, location.lng, inc.lat, inc.lng)
        if (distM > 500) return false
        const minutesAgo = (DEMO_NOW - new Date(inc.call_time)) / 60000
        return minutesAgo <= 30
      })
      .map((inc) => ({
        ...inc,
        _distance: Math.round(haversineMeters(location.lat, location.lng, inc.lat, inc.lng)),
        _minutesAgo: Math.round((DEMO_NOW - new Date(inc.call_time)) / 60000),
      }))
    setDuplicates(matches)
    setDuplicateAction(null)
  }, [location])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTriageAnswer = useCallback((question_code, answer) => {
    setTriageResponses((prev) => {
      const idx = prev.findIndex((r) => r.question_code === question_code)
      const entry = {
        response_id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        question_code,
        answer,
        created_at: new Date().toISOString(),
      }
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = entry
        return next
      }
      return [...prev, entry]
    })
  }, [])

  const handleChecklistToggle = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleActivateOverride = () => {
    setSeverityOverrideActive(true)
    setFinalSeverity(calculatedSeverity || 'LOW')
  }

  const handleCancelOverride = () => {
    setSeverityOverrideActive(false)
    setFinalSeverity('LOW')
    setOverrideReason('')
    setOverrideReasonError(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!district) {
      setDistrictError(true)
      return
    }
    if (severityOverrideActive && !overrideReason.trim()) {
      setOverrideReasonError(true)
      return
    }
    if (!allChecked) return

    const incident = {
      incident_type: incidentType,
      triage_responses: triageResponses,
      calculated_severity: calculatedSeverity,
      final_severity: effectiveSeverity,
      severity_overridden: severityOverrideActive,
      severity_override_reason: severityOverrideActive ? overrideReason : null,
      location_source: location?.source ?? 'TELECOM_ROUGH',
      lat: location?.lat ?? activeCallerRecord?.rough_lat,
      lng: location?.lng ?? activeCallerRecord?.rough_lng,
      district,
      sector: mockLocationSharing.sector,
      occurrence_time: occurrenceTime || null,
      call_time: callTimeRef.current,
      is_duplicate: duplicateAction === 'link',
      duplicate_of: duplicateAction === 'link' ? linkedIncidentId : null,
      notes,
      ...checklist,
    }
    console.log('New incident submitted:', incident)
    navigate('/dispatcher/ai-engine')
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-(--bg-base) flex flex-col">
      {/* ── Page header ── */}
      <header className="shrink-0 px-5 md:px-6 pt-5 pb-3 border-b border-(--border)">
        <div className="max-w-[1800px] mx-auto">
          <span className="dispatcher-eyebrow">Emergency intake</span>
          <h1
            className="text-xl md:text-2xl font-bold text-(--text-primary) m-0 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Smart dispatch intake
          </h1>
          <p className="text-[12px] text-(--text-secondary) mt-1 m-0">
            Automated emergency call handling · Rwanda Police Emergency Response
          </p>
        </div>
      </header>

      <div className="flex-1 min-h-0 max-w-[1800px] w-full mx-auto px-5 md:px-6 py-4 flex flex-col gap-4">
        <LiveEmergencyBanner call={mockActiveCall} />

        {/* ── Duplicate detection banner (full-width, above form) ── */}
        {showDuplicateBanner && firstDuplicate && (
          <div
            className="rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in-up"
            style={{
              background: 'color-mix(in srgb, var(--status-warning) 15%, transparent)',
              borderColor: 'var(--status-warning)',
            }}
          >
            <AlertTriangle size={16} className="shrink-0" style={{ color: 'var(--status-warning)' }} />
            <p className="flex-1 min-w-0 text-[13px] font-semibold text-(--text-primary) m-0">
              Possible duplicate of{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                #{firstDuplicate.incident_ref}
              </span>{' '}
              — {firstDuplicate._distance}m away, {firstDuplicate._minutesAgo} min ago
            </p>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDuplicateAction('link')
                  setLinkedIncidentId(firstDuplicate.incident_id)
                }}
                className="px-3 py-1.5 rounded-lg border text-[12px] font-semibold cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display)',
                  borderColor: 'var(--status-warning)',
                  color: 'var(--status-warning)',
                  background: 'color-mix(in srgb, var(--status-warning) 10%, transparent)',
                }}
              >
                Link to existing
              </button>
              <button
                type="button"
                onClick={() => setDuplicateAction('new')}
                className="px-3 py-1.5 rounded-lg border text-[12px] font-semibold cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-input)',
                }}
              >
                Create new
              </button>
              <button
                type="button"
                onClick={() => setInvestigateIncident(firstDuplicate)}
                className="px-3 py-1.5 rounded-lg border text-[12px] font-semibold cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-input)',
                }}
              >
                Investigate further
              </button>
            </div>
          </div>
        )}

        {/* Duplicate linked confirmation pill */}
        {duplicateAction === 'link' && linkedIncidentId && (
          <div
            className="rounded-lg border px-3 py-2 text-[12px] font-medium flex items-center gap-2"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)',
              background: 'var(--accent-ghost)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <Check size={13} />
            Linked to #{firstDuplicate?.incident_ref} — will be recorded as duplicate on submit.
            <button
              type="button"
              onClick={() => { setDuplicateAction(null); setLinkedIncidentId(null) }}
              className="ml-auto cursor-pointer bg-transparent border-none p-0"
              style={{ color: 'var(--accent)' }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Three-column form ── */}
        <form onSubmit={handleSubmit} className="w-full intake-three-col items-start">

          {/* ════════════ LEFT ════════════ */}
          <div className="intake-col--left flex flex-col gap-4">

            {/* Caller profile — unchanged */}
            <IntakePanel className="p-4 md:p-5">
              <PanelHeader
                icon={Phone}
                title="Auto-filled caller profile"
                badge={<StatusPill label={mockAutoCaller.gpsStatus} color="var(--status-medium)" />}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5">
                <ReadonlyField label="Phone number" value={mockAutoCaller.phone_number} mono />
                <ReadonlyField label="Caller" value={mockAutoCaller.identity} />
                <ReadonlyField label="Previous incidents" value={String(mockAutoCaller.previous_incidents)} />
                <ReadonlyField label="Caller trust level" value={mockAutoCaller.trust_level} />
              </div>
            </IntakePanel>

            {/* ── Triage + Severity panel ── */}
            <IntakePanel className="p-4 md:p-5 flex flex-col gap-3">

              {/* Live severity badge — prominent, top of panel */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-(--border-subtle)">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.1em] text-(--text-secondary)"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Calculated severity
                </span>
                <SeverityBadge severity={effectiveSeverity} size="lg" />
              </div>

              {/* Incident type selector */}
              <label className="dispatcher-field m-0">
                <span className="field-label">Incident type *</span>
                <select
                  className="dispatcher-input dispatcher-select mt-1"
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  required
                  style={{ appearance: 'none' }}
                >
                  <option value="" disabled>
                    Select incident type...
                  </option>
                  {INCIDENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              {/* Triage questions */}
              {triageQuestions.length > 0 && (
                <div className="flex flex-col gap-3 pt-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.12em] text-(--text-muted)"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Triage questions
                  </span>

                  {triageQuestions.map((q, qi) => {
                    const response = triageResponses.find(
                      (r) => r.question_code === q.question_code
                    )
                    const useDropdown = q.answer_options.length > 4

                    return (
                      <div key={q.question_id} className="flex flex-col gap-1.5">
                        <span className="text-[12px] font-medium text-(--text-primary)">
                          {qi + 1}. {q.question_text}
                        </span>

                        {useDropdown ? (
                          <select
                            className="dispatcher-input dispatcher-select"
                            value={response?.answer ?? ''}
                            onChange={(e) =>
                              handleTriageAnswer(q.question_code, e.target.value)
                            }
                            style={{ appearance: 'none' }}
                          >
                            <option value="" disabled>
                              Select answer...
                            </option>
                            {q.answer_options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div
                            className="flex flex-wrap gap-1.5"
                            role="group"
                            aria-label={q.question_text}
                          >
                            {q.answer_options.map((opt) => {
                              const selected = response?.answer === opt
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    handleTriageAnswer(q.question_code, opt)
                                  }
                                  className="px-2.5 py-1 rounded-md border text-[11px] font-medium cursor-pointer"
                                  style={{
                                    fontFamily: 'var(--font-body)',
                                    borderColor: selected
                                      ? 'var(--accent)'
                                      : 'var(--border)',
                                    background: selected
                                      ? 'var(--accent-ghost)'
                                      : 'var(--bg-input)',
                                    color: selected
                                      ? 'var(--accent)'
                                      : 'var(--text-secondary)',
                                  }}
                                  aria-pressed={selected}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {incidentType && triageQuestions.length === 0 && (
                <p className="text-[11px] text-(--text-muted) italic m-0">
                  No triage questions for this type. Severity defaults to LOW.
                </p>
              )}

              {/* ── Severity override controls ── */}
              <div className="pt-2 border-t border-(--border-subtle)">
                {!severityOverrideActive ? (
                  <button
                    type="button"
                    onClick={handleActivateOverride}
                    className="text-[12px] font-medium text-(--text-muted) underline cursor-pointer bg-transparent border-none p-0"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Change severity
                  </button>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {/* Visual: calculated struck-through → final active */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[11px] text-(--text-muted)"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        Override:
                      </span>
                      <SeverityBadge severity={calculatedSeverity} strikethrough />
                      <span className="text-[11px] text-(--text-muted)">→</span>
                      <SeverityBadge severity={finalSeverity} />
                    </div>

                    <label className="dispatcher-field m-0">
                      <span className="field-label">Final severity *</span>
                      <select
                        className="dispatcher-input dispatcher-select mt-1"
                        value={finalSeverity}
                        onChange={(e) => setFinalSeverity(e.target.value)}
                        style={{ appearance: 'none' }}
                      >
                        {SEVERITY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="dispatcher-field m-0">
                      <span className="field-label">Reason for override *</span>
                      <textarea
                        className="dispatcher-input dispatcher-textarea mt-1"
                        value={overrideReason}
                        onChange={(e) => {
                          setOverrideReason(e.target.value.slice(0, 255))
                          setOverrideReasonError(false)
                        }}
                        maxLength={255}
                        placeholder="Explain why the calculated severity is being changed..."
                        rows={3}
                        aria-invalid={overrideReasonError}
                        style={
                          overrideReasonError
                            ? { borderColor: 'var(--status-critical)' }
                            : undefined
                        }
                      />
                      <div className="flex items-start justify-between mt-1 gap-2">
                        {overrideReasonError ? (
                          <p
                            className="text-[11px] m-0"
                            style={{ color: 'var(--status-critical)' }}
                          >
                            Override reason is required.
                          </p>
                        ) : (
                          <span />
                        )}
                        <span
                          className="text-[10px] text-(--text-muted) shrink-0 ml-auto"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {overrideReason.length} / 255
                        </span>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={handleCancelOverride}
                      className="text-[12px] font-medium text-(--text-muted) underline cursor-pointer bg-transparent border-none p-0 self-start"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Cancel override
                    </button>
                  </div>
                )}
              </div>
            </IntakePanel>

            {/* Notes — unchanged */}
            <IntakePanel className="p-4 md:p-5 flex flex-col">
              <PanelHeader
                icon={Mic}
                title="Live incident notes"
                badge={
                  <span className="text-[9px] font-bold text-(--accent) uppercase tracking-wider flex items-center gap-1">
                    <Mic size={10} />
                    Voice transcript active
                  </span>
                }
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px] w-full rounded-lg px-3 py-2.5 text-[13px] text-(--text-primary) bg-(--bg-input) border border-(--border) outline-none resize-y leading-relaxed focus:border-(--accent)"
                aria-label="Live incident notes"
              />
              <p className="text-[10px] text-(--text-muted) m-0 mt-2">
                Auto-save active · synced from live transcript
              </p>
            </IntakePanel>
          </div>

          {/* ════════════ CENTER ════════════ */}
          <div className="intake-col--center flex flex-col gap-4">

            {/* District confirmation */}
            <IntakePanel className="p-4 md:p-5 shrink-0">
              <FieldLabel className="mb-3">Location confirmation</FieldLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadonlyField label="Sector / area" value={mockLocationSharing.sector} />
                <label className="dispatcher-field m-0">
                  <span className="field-label">District *</span>
                  <select
                    className="dispatcher-input dispatcher-select mt-1"
                    value={district}
                    onChange={(e) => {
                      setDistrict(e.target.value)
                      setDistrictError(false)
                    }}
                    required
                    aria-invalid={districtError}
                    aria-describedby={districtError ? 'district-error' : 'district-helper'}
                    style={{
                      appearance: 'none',
                      ...(districtError
                        ? {
                            borderColor: 'var(--status-critical)',
                            boxShadow: '0 0 0 3px var(--status-critical-bg)',
                          }
                        : {}),
                    }}
                  >
                    <option value="" disabled>
                      Select district — confirm with caller
                    </option>
                    {RWANDA_DISTRICT_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p
                    id="district-helper"
                    className="m-0 mt-1"
                    style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}
                  >
                    Confirm the caller&apos;s location before selecting. District determines which
                    Operations Manager receives this incident.
                  </p>
                  {districtError && (
                    <p
                      id="district-error"
                      className="m-0 mt-1"
                      style={{ fontSize: '11px', color: 'var(--status-critical)' }}
                    >
                      District is required. Confirm location with caller before submitting.
                    </p>
                  )}
                </label>
              </div>
            </IntakePanel>

            {/* Three-way location map */}
            <TriageLocationMap caller={activeCallerRecord} onLocationChange={setLocation} />

            {/* Occurrence time */}
            <IntakePanel className="p-4 md:p-5 shrink-0">
              <label className="dispatcher-field m-0">
                <span className="field-label">When did this happen? (optional)</span>
                <input
                  type="datetime-local"
                  className="dispatcher-input dispatcher-text-input mt-1"
                  value={occurrenceTime}
                  onChange={(e) => setOccurrenceTime(e.target.value)}
                  aria-label="Occurrence time — ask the caller, do not auto-fill"
                />
                <p
                  className="m-0 mt-1"
                  style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}
                >
                  Ask the caller when the incident occurred. Do not auto-fill this field.
                </p>
              </label>
            </IntakePanel>

            {/* Verification checklist */}
            <IntakePanel className="p-4 md:p-5 shrink-0">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="panel-title">Verification checklist</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: allChecked
                      ? 'var(--status-low-bg)'
                      : 'var(--status-medium-bg)',
                    color: allChecked ? 'var(--status-low)' : 'var(--status-medium)',
                  }}
                >
                  {Object.values(checklist).filter(Boolean).length} / 5
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {VERIFICATION_ITEMS.map(({ key, label }) => {
                  const checked = checklist[key]
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2.5 cursor-pointer rounded-lg px-3 py-2 border"
                      style={{
                        borderColor: checked
                          ? 'color-mix(in srgb, var(--accent) 40%, transparent)'
                          : 'var(--border-subtle)',
                        background: checked ? 'var(--accent-ghost)' : 'var(--bg-input)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleChecklistToggle(key)}
                        className="w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <span
                        className="text-[12px] font-medium flex-1"
                        style={{
                          color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {label}
                      </span>
                      {checked && (
                        <Check
                          size={12}
                          className="shrink-0"
                          style={{ color: 'var(--accent)' }}
                        />
                      )}
                    </label>
                  )
                })}
              </div>

              {!allChecked && (
                <p
                  className="text-[11px] text-(--text-muted) mt-2 mb-0"
                  style={{ fontStyle: 'italic' }}
                >
                  All five items must be confirmed before submission.
                </p>
              )}
            </IntakePanel>

            {/* AI recommendation + action buttons */}
            <div className="w-full shrink-0">
              <div
                className="flex flex-col rounded-xl border border-(--border) bg-(--bg-surface) shadow-[var(--shadow-card)] overflow-hidden"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <div className="min-h-0 [&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none">
                  <AiDispatchRecommendation data={mockAiRecommendation} />
                </div>

                <div className="p-3 border-t border-(--border-subtle) shrink-0 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/dispatcher')}
                    className="px-4 py-2 rounded-lg border border-(--border) bg-transparent text-(--text-primary) text-[12px] font-semibold cursor-pointer hover:bg-(--bg-elevated)"
                  >
                    Cancel
                  </button>

                  {effectiveSeverity === 'CRITICAL' && (
                    <Link
                      to={`/dispatcher/dispatch-immediate/${DEFAULT_IMMEDIATE_INCIDENT_ID}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-none text-[12px] font-bold uppercase tracking-wide no-underline transition-opacity hover:opacity-90"
                      style={{
                        fontFamily: 'var(--font-display)',
                        background: 'var(--status-critical)',
                        color: 'var(--text-on-accent)',
                        boxShadow:
                          '0 4px 20px color-mix(in srgb, var(--status-critical) 40%, transparent)',
                      }}
                    >
                      <Zap size={14} />
                      Dispatch Immediate
                    </Link>
                  )}

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    title={!canSubmit ? 'Complete all verification items' : undefined}
                    className="flex-1 min-w-[140px] px-4 py-2 rounded-lg border-none text-[12px] font-bold uppercase tracking-wide"
                    style={{
                      fontFamily: 'var(--font-display)',
                      background: canSubmit ? 'var(--accent)' : 'var(--border)',
                      color: canSubmit ? 'var(--text-on-accent)' : 'var(--text-muted)',
                      cursor: canSubmit ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Approve &amp; dispatch
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ════════════ RIGHT ════════════ */}
          <div className="intake-col--right flex flex-col gap-4">
            <IncidentTimeline steps={mockIncidentTimeline} />
            <div className="w-full xl:sticky xl:top-4 xl:self-start">
              <RecentIncidentsQueue incidents={mockDispatchQueue} theme={theme} />
            </div>
          </div>
        </form>
      </div>

      {/* ── Investigate Further modal ── */}
      {investigateIncident && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Existing incident details"
          onClick={() => setInvestigateIncident(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-(--border) bg-(--bg-surface) p-6 flex flex-col gap-4 shadow-[var(--shadow-modal)] animate-fade-in-up"
            style={{ fontFamily: 'var(--font-body)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.12em] text-(--accent)"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Existing incident
                </span>
                <h2
                  className="text-[18px] font-bold text-(--text-primary) m-0 mt-0.5"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {investigateIncident.incident_ref}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInvestigateIncident(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-(--border) bg-(--bg-input) text-(--text-secondary) cursor-pointer hover:bg-(--bg-elevated)"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            {/* Incident details grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <ReadonlyField
                label="Type"
                value={investigateIncident.incident_type}
              />
              <ReadonlyField
                label="Severity"
                value={
                  (
                    investigateIncident.final_severity ||
                    investigateIncident.severity ||
                    'UNKNOWN'
                  ).toUpperCase()
                }
              />
              <ReadonlyField
                label="Status"
                value={investigateIncident.status?.toUpperCase() ?? '—'}
              />
              <ReadonlyField
                label="District"
                value={investigateIncident.district ?? '—'}
              />
            </div>

            {/* Distance + time info */}
            <div
              className="p-3 rounded-lg border border-(--border-subtle) bg-(--bg-input) text-[12px] text-(--text-secondary)"
            >
              Distance:{' '}
              <strong className="text-(--text-primary) font-semibold">
                {investigateIncident._distance}m
              </strong>
              {' · '}
              Reported:{' '}
              <strong className="text-(--text-primary) font-semibold">
                {investigateIncident._minutesAgo} min ago
              </strong>
            </div>

            <button
              type="button"
              onClick={() => setInvestigateIncident(null)}
              className="w-full py-2 rounded-lg border border-(--border) bg-transparent text-(--text-primary) text-[12px] font-semibold cursor-pointer hover:bg-(--bg-elevated)"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
