import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, AlertTriangle, Check, MessageSquare, FileText, Send } from 'lucide-react'
import SeverityBanner from '../../components/field-responder/SeverityBanner'
import BackupRequestModal from '../../components/field-responder/BackupRequestModal'
import { FR_ASSIGNMENT, FR_QUICK_REPLIES } from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'

export default function FROnScene() {
  const navigate = useNavigate()
  const messages = useFieldResponderStore((s) => s.messages)
  const addMessage = useFieldResponderStore((s) => s.addMessage)
  const clearIncident = useFieldResponderStore((s) => s.clearIncident)
  const showToast = useFieldResponderStore((s) => s.showToast)
  const [backupOpen, setBackupOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [elapsed, setElapsed] = useState(504)

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
