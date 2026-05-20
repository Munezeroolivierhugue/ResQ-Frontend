import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Mic } from 'lucide-react'
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
  { id: 'medium', label: 'MID', color: 'var(--status-info)' },
]

export default function NewIncident() {
  const navigate = useNavigate()
  const { theme } = useThemeStore()

  const [category] = useState(INCIDENT_CATEGORIES[0])
  const [priority] = useState('high')
  const [notes, setNotes] = useState(mockLiveNotesPlaceholder)

  const handleApproveDispatch = (e) => {
    e.preventDefault()
    navigate('/dispatcher/ai-engine')
  }

  return (
    <div className="min-h-full bg-(--bg-base) flex flex-col">
      <header className="shrink-0 px-5 md:px-6 pt-5 pb-3 border-b border-(--border)">
        <div className="max-w-[1800px] mx-auto">
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

        <form onSubmit={handleApproveDispatch} className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5">
          {/* LEFT — caller, classification, notes, AI */}
          <div className="xl:col-span-3 flex flex-col gap-4 min-w-0 xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto">
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
                    <div
                      key={p.id}
                      className="flex-1 min-h-10 px-1 py-2 rounded-lg text-[9px] font-bold tracking-wide uppercase border flex items-center justify-center"
                      style={{
                        fontFamily: 'var(--font-display)',
                        borderColor: active ? p.color : 'var(--border)',
                        color: active ? p.color : 'var(--text-muted)',
                        background: active
                          ? `color-mix(in srgb, ${p.color} 14%, transparent)`
                          : 'var(--bg-input)',
                      }}
                      aria-current={active ? 'true' : undefined}
                    >
                      {p.label}
                    </div>
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

            <AiDispatchRecommendation data={mockAiRecommendation} />

            <div className="flex flex-wrap gap-2 pt-1 sticky bottom-0 bg-(--bg-base) pb-1">
              <button
                type="button"
                onClick={() => navigate('/dispatcher')}
                className="px-4 py-2 rounded-lg border border-(--border) bg-transparent text-(--text-primary) text-[12px] font-semibold cursor-pointer hover:bg-(--bg-elevated)"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 min-w-[140px] px-4 py-2 rounded-lg border-none bg-(--accent) text-(--text-on-accent) text-[12px] font-bold uppercase tracking-wide cursor-pointer hover:bg-(--accent-dim)"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Approve & dispatch
              </button>
            </div>
          </div>

          {/* CENTER — dominant live map */}
          <div className="xl:col-span-6 flex flex-col gap-4 min-w-0 min-h-[480px] xl:min-h-0">
            <div className="flex-1 flex flex-col min-h-[480px]">
              <LiveLocationMap location={mockLocationSharing} />
            </div>
            <LandmarkAssistPanel data={mockLandmarkAssist} />
          </div>

          {/* RIGHT — timeline + queue */}
          <div className="xl:col-span-3 flex flex-col gap-4 min-w-0 xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto">
            <IncidentTimeline steps={mockIncidentTimeline} />
            <RecentIncidentsQueue incidents={mockDispatchQueue} theme={theme} />
          </div>
        </form>
      </div>
    </div>
  )
}
