import { useState } from 'react'
import { Phone, PhoneMissed, PhoneCall, PhoneForwarded } from 'lucide-react'
import { mockMissedCalls } from '../../data/mockMissedCalls'

function maskPhone(phone) {
  if (!phone) return '—'
  return phone.replace(/\d(?=\d{4})/g, 'x')
}

function formatCallTime(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatWaitDuration(seconds) {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function OpsManagerMissedCallsPanel() {
  const [calls, setCalls] = useState(
    () => mockMissedCalls.filter((c) => c.status !== 'CALLED_BACK')
  )
  const [toastMsg, setToastMsg] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleCallBack = (missedCallId) => {
    const call = mockMissedCalls.find((c) => c.missed_call_id === missedCallId)
    if (!call) return
    Object.assign(call, {
      status: 'CALLED_BACK',
      called_back_by: 'demo-user-uuid',
      callback_time: new Date().toISOString(),
    })
    setCalls((prev) => prev.filter((c) => c.missed_call_id !== missedCallId))
    showToast('Callback initiated')
  }

  const count = calls.length

  return (
    <div className="dispatcher-surface overflow-hidden relative">
      {toastMsg && (
        <div
          className="absolute top-2 right-2 z-10 text-[12px] px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: 'var(--status-low-bg)', color: 'var(--status-low)', border: '1px solid var(--status-low)' }}
        >
          {toastMsg}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-(--border-subtle)">
        <div className="flex items-center gap-2 min-w-0">
          <PhoneMissed size={16} style={{ color: 'var(--status-critical)' }} aria-hidden />
          <span className="text-[14px] font-semibold text-(--text-primary)">Missed Calls</span>
          {count > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-bold"
              style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}
            >
              {count}
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-(--text-muted)">Last 60 minutes</span>
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center justify-center text-center" style={{ padding: '1.25rem' }}>
          <PhoneForwarded size={20} style={{ color: 'var(--status-low)' }} aria-hidden />
          <p className="text-[12px] text-(--text-muted) m-0 mt-2">No missed calls in the last hour</p>
        </div>
      ) : (
        <div>
          {calls.map((call) => (
            <div
              key={call.missed_call_id}
              className="flex flex-wrap items-center gap-3 border-b border-(--border-subtle) last:border-0"
              style={{ padding: '0.65rem 0.85rem' }}
            >
              <div className="flex items-center gap-2 min-w-[140px] flex-1">
                <Phone size={14} className="text-(--text-muted) shrink-0" aria-hidden />
                <span className="font-mono text-[12px] text-(--text-primary)">
                  {call.phoneMasked || maskPhone(call.phone_number)}
                </span>
              </div>
              <div className="shrink-0">
                <div className="text-[10px] uppercase text-(--text-muted) tracking-wide">Called</div>
                <div className="font-mono text-[12px] text-(--text-secondary)">
                  {call.calledAt || formatCallTime(call.call_time)}
                </div>
              </div>
              <div className="shrink-0">
                <div className="text-[10px] uppercase text-(--text-muted) tracking-wide">Waited</div>
                <div className="font-mono text-[12px] text-(--text-secondary)">
                  {call.waited || formatWaitDuration(call.wait_duration)}
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 shrink-0 cursor-pointer font-semibold transition-colors hover:bg-(--accent-ghost)"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  borderRadius: '6px',
                  padding: '0.3rem 0.65rem',
                  fontSize: '11px',
                }}
                onClick={() => handleCallBack(call.missed_call_id)}
              >
                <PhoneCall size={12} aria-hidden />
                Call Back
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
