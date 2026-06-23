import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, Mic, Zap } from 'lucide-react'
import { DEFAULT_IMMEDIATE_INCIDENT_ID } from '../../data/mockDispatchImmediateData'
import { useThemeStore } from '../../store/themeStore'
import {
  mockActiveCall,
  mockAutoCaller,
  mockLocationSharing,
  mockIncidentTimeline,
  mockAiRecommendation,
  mockLandmarkAssist,
  mockLiveNotesPlaceholder,
  mockDispatchQueue,
  INCIDENT_CATEGORIES,
} from '../../data/mockIntakeData'
import LiveEmergencyBanner from '../../components/intake/LiveEmergencyBanner'
import LiveLocationMap from '../../components/intake/LiveLocationMap'
import IncidentTimeline from '../../components/intake/IncidentTimeline'
import AiDispatchRecommendation from '../../components/intake/AiDispatchRecommendation'
import LandmarkAssistPanel from '../../components/intake/LandmarkAssistPanel'
import RecentIncidentsQueue from '../../components/intake/RecentIncidentsQueue'
import {
  IntakePanel,
  PanelHeader,
  ReadonlyField,
  StatusPill,
} from '../../components/intake/IntakeUi'
import FieldLabel from '../../components/ui/FieldLabel'

const PRIORITIES = [
  { id: 'critical', label: 'CRITICAL', color: 'var(--status-critical)' },
  { id: 'high', label: 'HIGH', color: 'var(--status-high)' },
  { id: 'medium', label: 'MID', color: 'var(--status-medium)' },
]

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

export default function NewIncident() {
  const navigate = useNavigate()
  const { theme } = useThemeStore()

  const [category] = useState(INCIDENT_CATEGORIES[0])
  const [priority, setPriority] = useState('high')
  const [notes, setNotes] = useState(mockLiveNotesPlaceholder)
  const [district, setDistrict] = useState('')
  const [districtError, setDistrictError] = useState(false)

  const handleApproveDispatch = (e) => {
    e.preventDefault()
    if (!district) {
      setDistrictError(true)
      return
    }
    const incident = {
      category,
      priority,
      notes,
      district,
      sector: mockLocationSharing.sector,
      location: {
        lat: mockLocationSharing.lat,
        lng: mockLocationSharing.lng,
      },
      caller: mockAutoCaller,
    }
    console.log('New incident submitted:', incident)
    navigate('/dispatcher/ai-engine')
  }

  return (
    <div className="min-h-full bg-(--bg-base) flex flex-col">
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

        <form
          onSubmit={handleApproveDispatch}
          className="w-full intake-three-col items-start"
        >
          {/* LEFT — caller, classification, notes */}
          <div className="intake-col--left flex flex-col gap-4">
            <IntakePanel className="p-4 md:p-5">
              <PanelHeader
                icon={Phone}
                title="Auto-filled caller profile"
                badge={<StatusPill label={mockAutoCaller.gpsStatus} color="var(--status-medium)" />}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5">
                <ReadonlyField label="Phone number" value={mockAutoCaller.phone} mono />
                <ReadonlyField label="Caller" value={mockAutoCaller.name} />
                <ReadonlyField label="Previous incidents" value={String(mockAutoCaller.previousIncidents)} />
                <ReadonlyField label="Caller trust level" value={mockAutoCaller.trustLevel} />
              </div>
            </IntakePanel>

            <IntakePanel className="p-4 md:p-5">
              <FieldLabel className="mb-2">Incident class</FieldLabel>
              <div className="h-10 rounded-lg px-3 flex items-center text-[13px] font-medium text-(--text-primary) bg-(--bg-input) border border-(--border)">
                {category}
              </div>
              <FieldLabel className="mb-2 mt-3">Priority level</FieldLabel>
              <div className="flex gap-1.5" role="group" aria-label="Priority level">
                {PRIORITIES.map((p) => {
                  const active = priority === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className="flex-1 min-h-10 px-1 py-2 rounded-lg text-[9px] font-bold tracking-wide uppercase border flex items-center justify-center cursor-pointer"
                      style={{
                        fontFamily: 'var(--font-display)',
                        borderColor: active ? p.color : 'var(--border)',
                        color: active ? p.color : 'var(--text-muted)',
                        background: active
                          ? `color-mix(in srgb, ${p.color} 14%, transparent)`
                          : 'var(--bg-input)',
                      }}
                      aria-pressed={active}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </IntakePanel>

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
              <p className="text-[10px] text-(--text-muted) m-0 mt-2">Auto-save active · synced from live transcript</p>
            </IntakePanel>
          </div>

          {/* CENTER — location confirmation + live map */}
          <div className="intake-col--center flex flex-col gap-4">
            <IntakePanel className="p-4 md:p-5 shrink-0">
              <FieldLabel className="mb-3">Location confirmation</FieldLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadonlyField label="Sector / location" value={mockLocationSharing.sector} />
                <label className="dispatcher-field m-0">
                  <span className="field-label">District *</span>
                  <select
                    className="dispatcher-input dispatcher-select"
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
                            border: '1px solid var(--status-critical)',
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
                    className="m-0 mt-1.5"
                    style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}
                  >
                    Confirm the caller&apos;s location before selecting. District determines which Operations
                    Manager receives this incident.
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
            <LiveLocationMap location={mockLocationSharing} />
            <LandmarkAssistPanel data={mockLandmarkAssist} />
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
                  {priority === 'critical' && (
                    <Link
                      to={`/dispatcher/dispatch-immediate/${DEFAULT_IMMEDIATE_INCIDENT_ID}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-none text-[12px] font-bold uppercase tracking-wide no-underline transition-opacity hover:opacity-90"
                      style={{
                        fontFamily: 'var(--font-display)',
                        background: 'var(--status-critical)',
                        color: 'var(--text-on-accent)',
                        boxShadow: '0 4px 20px color-mix(in srgb, var(--status-critical) 40%, transparent)',
                      }}
                    >
                      <Zap size={14} />
                      Dispatch Immediate
                    </Link>
                  )}
                  <button
                    type="submit"
                    className="flex-1 min-w-[140px] px-4 py-2 rounded-lg border-none bg-(--accent) text-(--text-on-accent) text-[12px] font-bold uppercase tracking-wide cursor-pointer hover:bg-(--accent-dim)"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Approve & dispatch
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — timeline + queue */}
          <div className="intake-col--right flex flex-col gap-4">
            <IncidentTimeline steps={mockIncidentTimeline} />
            <div className="w-full xl:sticky xl:top-4 xl:self-start">
              <RecentIncidentsQueue incidents={mockDispatchQueue} theme={theme} />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
