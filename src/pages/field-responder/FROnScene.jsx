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
  const addVoiceMessage = useFieldResponderStore((s) => s.addVoiceMessage)
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
    if (pttSeconds > 0) {
      addVoiceMessage(pttSeconds, 'officer', 'YOU')
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

      <div className="dispatcher-surface fr-card fr-card--tight flex flex-col min-h-[300px]">
        <div className="fr-card-header bg-(--bg-elevated) shrink-0">
          <MessageSquare size={14} className="text-(--accent)" />
          <span className="font-semibold text-[13px]">Unified Comms Channel</span>
          <span className="fr-live-chip font-mono ml-auto">LIVE</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-(--bg-base)">
          {messages.map((m) => {
            const isSelf = m.from === 'officer' || m.role === 'field' || m.from === 'field';
            const unitColor = 'var(--accent)'; // Field UI often defaults dispatch to accent
            
            return (
              <div key={m.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                {m.type === 'text' ? (
                  // Text Bubble
                  <div className={`chat-bubble chat-bubble-text ${isSelf ? 'chat-bubble--self' : ''}`}>
                    <div
                      className="chat-bubble-label mb-1"
                      style={{ color: isSelf ? undefined : unitColor }}
                    >
                      {isSelf ? 'YOU' : 'DISPATCH'}
                      <span className="chat-bubble-time">
                        {m.time}
                      </span>
                    </div>
                    <p className="chat-bubble-msg">{m.text}</p>
                  </div>
                ) : (
                  // Voice Bubble
                  <div className={`chat-bubble chat-bubble-voice ${isSelf ? 'chat-bubble--self' : ''}`}>
                    {m.isNew && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-(--status-critical) border border-(--bg-base)" />}
                    <button
                      type="button"
                      className="chat-play-btn"
                      onClick={() => togglePlay(m)}
                    >
                      {playingId === m.id ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                    </button>
                    
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex justify-between items-end mb-0.5">
                        <span
                          className="chat-bubble-label"
                          style={{ color: isSelf ? undefined : unitColor }}
                        >
                          {isSelf ? 'YOU' : 'DISPATCH'}
                        </span>
                        <span className="chat-bubble-label chat-bubble-time !ml-0">
                          {playingId === m.id 
                            ? fmtDuration(Math.floor(playProgress[m.id] || 0)) 
                            : fmtDuration(m.durationS)}
                        </span>
                      </div>
                      
                      {/* Fake Waveform */}
                      <div className="h-4 flex items-end gap-[2px] w-full overflow-hidden mt-1">
                        {Array.from({ length: 24 }).map((_, i) => {
                          const isPlayed = playingId === m.id && ((i / 24) * m.durationS <= (playProgress[m.id] || 0));
                          return (
                            <div 
                              key={i} 
                              className="chat-waveform-bar"
                              style={{ 
                                height: `${20 + Math.random() * 80}%`,
                                opacity: isPlayed ? 0.85 : 0.35,
                                color: isPlayed && !isSelf ? 'var(--accent)' : undefined
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
