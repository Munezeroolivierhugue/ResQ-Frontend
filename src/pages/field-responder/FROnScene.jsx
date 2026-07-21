import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, AlertTriangle, Check, MessageSquare, FileText, Send, Mic, Square, Play } from 'lucide-react'
import SeverityBanner from '../../components/field-responder/SeverityBanner'
import BackupRequestModal from '../../components/field-responder/BackupRequestModal'
import ConfirmModal from '../../components/field-responder/ConfirmModal'
import { FR_QUICK_REPLIES } from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'
import { fmtDuration } from '../../data/mockAudioCommsData'
import { updateIncidentStatus } from '../../api/incidents'
import { subscribe, publish, connect } from '../../lib/wsClient'
import { getAccessToken, getCurrentUser, canFileFieldReports } from '../../utils/authSession'
import { formatIncidentType } from '../../utils/incidentTypeLabels'

// Zustand/useSyncExternalStore requires a selector to return a stable
// reference when nothing changed — `assignment?.otherDispatches ?? []`
// allocated a brand-new array on every render whenever assignment was null,
// which React treats as "the store changed," triggering another render,
// which allocates another new array, forever ("Maximum update depth
// exceeded"). This was always latent but only actually fired once something
// set assignment to null while this component was still mounted (e.g. a
// non-police responder clearing an incident, which does exactly that before
// navigating away).
const EMPTY_DISPATCHES = []

export default function FROnScene() {
  const navigate = useNavigate()
  const addVoiceMessageToStore = useFieldResponderStore((s) => s.addVoiceMessage)
  const clearIncident = useFieldResponderStore((s) => s.clearIncident)
  const clearAssignmentLocal = useFieldResponderStore((s) => s.clearAssignmentLocal)
  const assignment    = useFieldResponderStore((s) => s.assignment)
  const incidentId    = useFieldResponderStore((s) => s.incidentId)
  const otherDispatches = useFieldResponderStore((s) => s.assignment?.otherDispatches ?? EMPTY_DISPATCHES)
  // Lifted into the shared store (see fieldResponderStore.js) so this thread
  // persists across Assignment → Navigation → OnScene instead of resetting to
  // empty every time this component unmounts/remounts, and so messages sent
  // before the responder even reached this screen (visible on FRAssignment)
  // aren't lost.
  const chatMessages = useFieldResponderStore((s) => s.dispatchMessages)
  const addDispatchMessage = useFieldResponderStore((s) => s.addDispatchMessage)
  const [backupOpen, setBackupOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [elapsed, setElapsed] = useState(504)
  const dispatchId = assignment?.dispatch?.dispatch_id
  // Scoped by dispatch_id (this responder's own unit-assignment), not
  // incidentId — an incident-scoped topic would have shown every field
  // responder assigned to a multi-unit incident the same shared thread.
  useEffect(() => {
    if (!dispatchId) return
    const token = getAccessToken()
    connect(token)
    const unsub = subscribe(`/topic/dispatches/${dispatchId}/chat`, (msg) => {
      const now = new Date()
      const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      addDispatchMessage({
        id: `ws-${Date.now()}-${Math.random()}`,
        type: 'text',
        from: msg.senderRole === 'FIELD_RESPONDER' ? 'officer' : 'dispatch',
        text: msg.text,
        senderName: msg.senderName,
        time: msg.timestamp ?? time,
      })
    })
    return unsub
  }, [dispatchId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Audio comms state
  const [pttActive, setPttActive] = useState(false)
  const [pttSeconds, setPttSeconds] = useState(0)
  const pttRef = useRef(null)
  const [playingId, setPlayingId] = useState(null)
  const playRef = useRef(null)
  const [playProgress, setPlayProgress] = useState({})

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const send = (text) => {
    if (!text.trim() || !dispatchId) return
    const user = getCurrentUser()
    publish(`/app/chat/dispatch/${dispatchId}`, {
      text: text.trim(),
      senderName: user?.full_name ?? 'Field Responder',
      senderRole: 'FIELD_RESPONDER',
    })
    setDraft('')
  }

  // PTT logic
  const startPtt = () => {
    setPttActive(true)
    setPttSeconds(0)
    pttRef.current = setInterval(() => setPttSeconds((s) => s + 1), 1000)
  }
  const stopPtt = () => {
    clearInterval(pttRef.current)
    setPttActive(false)
    if (pttSeconds > 0) {
      addVoiceMessageToStore(pttSeconds, 'officer', 'YOU')
    }
    setPttSeconds(0)
  }

  // Simulated playback for incoming clips
  const togglePlay = (clip) => {
    if (playingId === clip.id) {
      clearInterval(playRef.current)
      setPlayingId(null)
      setPlayProgress((p) => ({ ...p, [clip.id]: 0 }))
      return
    }
    setPlayingId(clip.id)
    setPlayProgress((p) => ({ ...p, [clip.id]: 0 }))

    playRef.current = setInterval(() => {
      setPlayProgress((p) => {
        const next = (p[clip.id] || 0) + 0.1
        if (next >= clip.durationS) {
          clearInterval(playRef.current)
          setPlayingId(null)
          return { ...p, [clip.id]: clip.durationS }
        }
        return { ...p, [clip.id]: next }
      })
    }, 100)
  }

  useEffect(() => () => { clearInterval(pttRef.current); clearInterval(playRef.current) }, [])

  const handleClear = () => setClearConfirmOpen(true)

  const confirmClear = async () => {
    setClearConfirmOpen(false)
    if (incidentId) {
      try {
        await updateIncidentStatus(incidentId, 'RESOLVED')
      } catch {
        // Continue even if status update fails — field report will set PENDING_REPORT
      }
    }
    // Non-police (non-RNP agency) responders don't file field reports —
    // only RNP units do — so send them back to their assignment instead of
    // a report page they have no access to. submitReport() (the police path)
    // clears the store's stale incident/assignment state as part of
    // completing the report; since this path skips the report entirely,
    // clear it here instead so the assignment screen shows "no active
    // assignment" rather than the incident that was just cleared.
    if (canFileFieldReports()) {
      navigate('/field-responder/report')
    } else {
      clearAssignmentLocal()
      navigate('/field-responder/assignment')
    }
  }

  const inc = assignment?.incident
  const a = {
    severity: inc?.severity ?? inc?.final_severity ?? 'medium',
    type: formatIncidentType(inc?.incident_type) ?? 'Incident',
    location: inc?.district ?? inc?.address ?? 'Unknown location',
  }

  return (
    <div className="fr-page fr-page--no-pad">
      <SeverityBanner
        severity={a.severity}
        label="ON SCENE"
        title={a.type}
        location={a.location}
      >
        <div className="fr-scene-chips">
          <span className="fr-scene-chip font-mono">Elapsed: {formatElapsed(elapsed)}</span>
          {otherDispatches.map((d) => (
            <span key={d.dispatch_id} className="fr-scene-chip">
              {d.vehicle_plate ?? d.unit_id ?? 'Unit'} also on scene
            </span>
          ))}
        </div>
      </SeverityBanner>

      <div className="fr-status-buttons">
        <button type="button" className="fr-status-btn fr-status-btn--active">
          <MapPin size={20} />
          On Scene
        </button>
        <button type="button" className="fr-status-btn fr-status-btn--backup" onClick={() => setBackupOpen(true)}>
          <AlertTriangle size={20} />
          Request Backup
        </button>
        <button type="button" className="fr-status-btn fr-status-btn--clear" onClick={handleClear}>
          <Check size={20} />
          Incident Clear
        </button>
      </div>

      <div className="dispatcher-surface fr-card fr-card--tight flex flex-col min-h-[300px]">
        <div className="fr-card-header bg-(--bg-elevated) shrink-0">
          <MessageSquare size={14} className="text-(--accent)" />
          <span className="font-semibold text-[13px]">Unified Comms Channel</span>
          <span className="fr-live-chip font-mono ml-auto">LIVE</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-(--bg-base)">
          {chatMessages.length === 0 && (
            <p className="text-center text-[11px] text-(--text-muted) py-4">No messages yet. Start the conversation.</p>
          )}
          {chatMessages.map((m) => {
            const isSelf = m.from === 'officer' || m.role === 'field' || m.from === 'field';
            const unitColor = 'var(--accent)'; // Field UI often defaults dispatch to accent
            
            return (
              <div key={m.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                {m.type === 'text' ? (
                  // Text Bubble
                  <div
                    className="max-w-[85%] rounded-2xl px-3.5 py-2.5 border shadow-sm relative"
                    style={{
                      background: isSelf ? '#a2cc29' : 'var(--bg-surface)',
                      color: isSelf ? '#000000' : 'var(--text-primary)',
                      borderColor: isSelf ? '#a2cc29' : 'var(--border-subtle)',
                      borderBottomRightRadius: isSelf ? '4px' : '16px',
                      borderBottomLeftRadius: isSelf ? '16px' : '4px',
                    }}
                  >
                    <div
                      className="text-[9px] font-bold uppercase tracking-wider mb-1"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: isSelf ? 'rgba(0,0,0,0.6)' : unitColor,
                      }}
                    >
                      {isSelf ? 'YOU' : 'DISPATCH'}
                      <span className="font-normal opacity-70 ml-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
                        {m.time}
                      </span>
                    </div>
                    <p className="text-[12.5px] m-0 leading-snug font-medium" style={{ color: isSelf ? '#111827' : 'var(--text-primary)' }}>{m.text}</p>
                  </div>
                ) : (
                  // Voice Bubble
                  <div
                    className="max-w-[85%] rounded-3xl px-1.5 py-1.5 border shadow-sm flex items-center gap-2 relative"
                    style={{
                      background: isSelf ? '#a2cc29' : 'var(--bg-surface)',
                      borderColor: isSelf ? '#a2cc29' : 'var(--border-subtle)',
                      borderBottomRightRadius: isSelf ? '6px' : '24px',
                      borderBottomLeftRadius: isSelf ? '24px' : '6px',
                      minWidth: '200px'
                    }}
                  >
                    {m.isNew && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-(--status-critical) border border-(--bg-base)" />}
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-none transition-transform active:scale-95"
                      style={{ 
                        background: isSelf ? 'rgba(0,0,0,0.1)' : 'var(--accent)',
                        color: isSelf ? '#000' : '#fff'
                      }}
                      onClick={() => togglePlay(m)}
                    >
                      {playingId === m.id ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                    </button>
                    
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex justify-between items-end mb-0.5">
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            fontFamily: 'var(--font-display)',
                            color: isSelf ? 'rgba(0,0,0,0.6)' : unitColor,
                          }}
                        >
                          {isSelf ? 'YOU' : 'DISPATCH'}
                        </span>
                        <span 
                          className="text-[9px] font-bold tabular-nums" 
                          style={{ color: isSelf ? 'rgba(0,0,0,0.5)' : 'var(--text-muted)' }}
                        >
                          {playingId === m.id 
                            ? fmtDuration(Math.floor(playProgress[m.id] || 0)) 
                            : fmtDuration(m.durationS)}
                        </span>
                      </div>
                      
                      {/* Fake Waveform */}
                      <div className="h-4 flex items-end gap-[2px] w-full overflow-hidden opacity-80 mt-1">
                        {Array.from({ length: 24 }).map((_, i) => {
                          const isPlayed = playingId === m.id && ((i / 24) * m.durationS <= (playProgress[m.id] || 0));
                          return (
                            <div 
                              key={i} 
                              className="flex-1 rounded-full bg-current transition-all duration-75"
                              style={{ 
                                height: `${20 + Math.random() * 80}%`,
                                color: isSelf 
                                  ? (isPlayed ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.2)') 
                                  : (isPlayed ? 'var(--accent)' : 'var(--border)'),
                              }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        <div className="fr-quick-replies shrink-0 pb-1">
          {FR_QUICK_REPLIES.map((q) => (
            <button key={q} type="button" className="fr-quick-chip text-[11px] py-1" onClick={() => send(q)}>
              {q}
            </button>
          ))}
        </div>
        
        <div className="p-2 border-t border-(--border-subtle) shrink-0 bg-(--bg-surface)">
          {pttActive && (
            <div className="flex items-center gap-2 mb-2 px-2">
              <span className="w-2 h-2 rounded-full bg-(--status-critical) animate-pulse" />
              <span className="text-[11px] font-bold text-(--status-critical) font-mono">
                RECORDING {fmtDuration(pttSeconds)}
              </span>
              <span className="text-[10px] text-(--text-muted) ml-auto">Release to send</span>
            </div>
          )}
          <form
            className="flex gap-2 items-end"
            onSubmit={(e) => {
              e.preventDefault()
              send(draft)
            }}
          >
            <input
              className="flex-1 h-[38px] rounded-xl px-3 text-[13px] bg-(--bg-input) border border-(--border) text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-(--accent) transition-colors"
              placeholder="Type message..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            {draft.trim() ? (
              <button
                type="submit"
                className="h-[38px] w-[38px] rounded-xl border-none flex items-center justify-center cursor-pointer shrink-0 transition-transform active:scale-95"
                style={{ background: 'var(--accent)', color: '#000' }}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="h-[38px] w-[38px] rounded-xl border-none flex items-center justify-center cursor-pointer shrink-0 transition-all duration-150 active:scale-95"
                style={{ 
                  background: pttActive ? 'var(--status-critical)' : 'transparent', 
                  color: pttActive ? '#fff' : 'var(--accent)',
                  border: pttActive ? 'none' : '1px solid var(--border)'
                }}
                aria-label="Hold to talk"
                onMouseDown={startPtt}
                onMouseUp={stopPtt}
                onMouseLeave={stopPtt}
                onTouchStart={startPtt}
                onTouchEnd={stopPtt}
              >
                <Mic size={18} />
              </button>
            )}
          </form>
        </div>
      </div>

      {canFileFieldReports() && (
        <button
          type="button"
          className="dispatcher-btn-outline fr-report-btn"
          onClick={() => navigate('/field-responder/report')}
        >
          <FileText size={18} />
          Begin Field Report
        </button>
      )}

      <BackupRequestModal open={backupOpen} onClose={() => setBackupOpen(false)} />
      <ConfirmModal
        open={clearConfirmOpen}
        title="Clear Incident"
        message={canFileFieldReports() ? 'Submit field report before clearing incident?' : 'Mark this incident as resolved?'}
        confirmLabel={canFileFieldReports() ? 'Continue to Report' : 'Clear Incident'}
        onConfirm={confirmClear}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </div>
  )
}
