import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, AlertTriangle, Check, MessageSquare, FileText, Send, Mic, Square, Play } from 'lucide-react'
import SeverityBanner from '../../components/field-responder/SeverityBanner'
import BackupRequestModal from '../../components/field-responder/BackupRequestModal'
import { FR_ASSIGNMENT, FR_QUICK_REPLIES } from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'
import { mockAudioClips, fmtDuration } from '../../data/mockAudioCommsData'

export default function FROnScene() {
  const navigate = useNavigate()
  const messages = useFieldResponderStore((s) => s.messages)
  const addMessage = useFieldResponderStore((s) => s.addMessage)
  const clearIncident = useFieldResponderStore((s) => s.clearIncident)
  const showToast = useFieldResponderStore((s) => s.showToast)
  const [backupOpen, setBackupOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [elapsed, setElapsed] = useState(504)
  // Audio comms state
  const [audioClips, setAudioClips] = useState(mockAudioClips)
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
    if (!text.trim()) return
    addMessage(text.trim())
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
    setPttSeconds(0)
    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    setAudioClips((prev) => [
      ...prev,
      {
        id: `ac-fr-${Date.now()}`,
        from: 'field',
        unitId: 'ME',
        unitType: 'police',
        time: now,
        durationS: Math.floor(Math.random() * 10) + 3,
        label: 'Voice update sent to Dispatch',
        isNew: false,
      },
    ])
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
    setAudioClips((prev) => prev.map((c) => c.id === clip.id ? { ...c, isNew: false } : c))
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

  const handleClear = () => {
    if (!window.confirm('Submit field report before clearing incident?')) return
    navigate('/field-responder/report')
  }

  const a = FR_ASSIGNMENT

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
          <span className="fr-scene-chip">P-19 also on scene</span>
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

      <div className="dispatcher-surface fr-card fr-card--tight">
        <div className="fr-card-header">
          <MessageSquare size={14} className="text-(--accent)" />
          <span className="font-semibold text-[13px]">Dispatcher Channel</span>
          <span className="fr-live-chip font-mono">LIVE</span>
        </div>
        <div className="fr-comms-thread">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`fr-msg${m.from === 'officer' ? ' fr-msg--officer' : ' fr-msg--dispatch'}`}
            >
              <div className="fr-msg-label font-mono">
                {m.from === 'officer' ? 'YOU' : 'DISPATCH'} · {m.time}
              </div>
              <div className="fr-msg-bubble">{m.text}</div>
            </div>
          ))}
        </div>
        <div className="fr-quick-replies">
          {FR_QUICK_REPLIES.map((q) => (
            <button key={q} type="button" className="fr-quick-chip" onClick={() => send(q)}>
              {q}
            </button>
          ))}
        </div>
        <form
          className="fr-comms-input-row"
          onSubmit={(e) => {
            e.preventDefault()
            send(draft)
          }}
        >
          <input
            className="fr-comms-input"
            placeholder="Type message..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="fr-comms-send" aria-label="Send">
            <Send size={16} className="text-(--text-on-accent)" />
          </button>
        </form>
      </div>

      {/* ── Voice Channel card ── */}
      <div className="dispatcher-surface fr-card fr-card--tight">
        <div className="fr-card-header">
          <Mic size={14} className="text-(--accent)" />
          <span className="font-semibold text-[13px]">Voice Channel — Dispatch</span>
          {audioClips.filter((c) => c.isNew).length > 0 && (
            <span className="audio-unread-badge" style={{ marginLeft: '4px' }}>
              {audioClips.filter((c) => c.isNew).length} new
            </span>
          )}
          <span className="fr-live-chip font-mono ml-auto">LIVE</span>
        </div>

        {/* Clip list */}
        <div className="fr-audio-clip-list">
          {audioClips.map((clip) => {
            const isPlaying = playingId === clip.id
            const prog = playProgress[clip.id] || 0
            const pct = clip.durationS > 0 ? Math.min(prog / clip.durationS, 1) : 0
            const isDispatch = clip.from === 'dispatch'
            return (
              <div
                key={clip.id}
                className="fr-audio-clip"
                style={{ borderColor: clip.isNew ? 'var(--accent)' : 'var(--border-subtle)' }}
              >
                {clip.isNew && <span className="w-1.5 h-1.5 rounded-full bg-(--status-critical) shrink-0" />}
                <button
                  type="button"
                  className="fr-audio-play-btn"
                  style={{ background: isPlaying ? 'var(--status-critical)' : 'var(--accent)' }}
                  onClick={() => togglePlay(clip)}
                  aria-label={isPlaying ? 'Stop' : 'Play'}
                >
                  {isPlaying
                    ? <Square size={12} color="#fff" />
                    : <Play size={12} color="var(--text-on-accent)" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: isDispatch ? 'var(--accent)' : 'var(--status-info)',
                      }}
                    >
                      {isDispatch ? 'DISPATCH' : clip.unitId}
                    </span>
                    <span className="text-[10px] text-(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }}>
                      {fmtDuration(clip.durationS)} · {clip.time}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="fr-audio-progress-track">
                    <div
                      className="fr-audio-progress-fill"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-(--text-secondary) m-0 mt-1">{clip.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recording indicator */}
        {pttActive && (
          <div className="audio-recording-indicator mb-1.5">
            <span className="audio-rec-dot" style={{ background: 'var(--status-critical)' }} />
            <span className="text-[11px] font-bold text-(--status-critical)" style={{ fontFamily: 'var(--font-mono)' }}>
              REC {pttSeconds}s — release to send
            </span>
          </div>
        )}

        {/* PTT button */}
        <button
          type="button"
          className={`fr-ptt-btn${pttActive ? ' fr-ptt-btn--active' : ''}`}
          onMouseDown={startPtt}
          onMouseUp={stopPtt}
          onTouchStart={startPtt}
          onTouchEnd={stopPtt}
          id="fr-ptt-btn"
        >
          <Mic size={16} />
          {pttActive ? `Release to Send (${pttSeconds}s)` : 'Hold to Talk'}
        </button>
      </div>

      <button
        type="button"
        className="dispatcher-btn-outline fr-report-btn"
        onClick={() => navigate('/field-responder/report')}
      >
        <FileText size={18} />
        Begin Field Report
      </button>

      <BackupRequestModal open={backupOpen} onClose={() => setBackupOpen(false)} />
    </div>
  )
}
