import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, PhoneOff } from 'lucide-react'
import { useCallChannelStore } from '../../store/callChannelStore'

const TIMEOUT_S = 30

/** Mask phone: +250788123456 → +250788***456 */
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone
  const visible = 3
  return phone.slice(0, -visible - 3) + '***' + phone.slice(-visible)
}

export default function IncomingCallBanner() {
  const { incomingCall, showIncomingBanner, answerCall, declineCall } = useCallChannelStore()
  const navigate = useNavigate()
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!showIncomingBanner) {
      setElapsed(0)
      clearInterval(intervalRef.current)
      return
    }

    setElapsed(0)
    intervalRef.current = setInterval(() => {
      setElapsed((s) => {
        if (s + 1 >= TIMEOUT_S) {
          clearInterval(intervalRef.current)
          declineCall()
          return s + 1
        }
        return s + 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [showIncomingBanner, declineCall])

  if (!showIncomingBanner || !incomingCall) return null

  const remaining = TIMEOUT_S - elapsed

  const handleAnswer = () => {
    clearInterval(intervalRef.current)
    answerCall()
    navigate(
      `/dispatcher/new-incident?call_id=${encodeURIComponent(incomingCall.call_id)}&phone=${encodeURIComponent(incomingCall.phone_number)}`
    )
  }

  const handleDecline = () => {
    clearInterval(intervalRef.current)
    declineCall()
  }

  return (
    <div
      className="animate-slide-in-right"
      style={{
        position: 'fixed',
        top: '4.75rem',
        right: '1rem',
        zIndex: 300,
        width: 'min(400px, calc(100vw - 2rem))',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden',
      }}
      role="alertdialog"
      aria-modal="false"
      aria-label="Incoming emergency call"
    >
      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--border-subtle)' }}>
        <div
          style={{
            height: '100%',
            width: `${(remaining / TIMEOUT_S) * 100}%`,
            background: remaining <= 10 ? 'var(--status-critical)' : 'var(--status-low)',
            transition: 'width 1s linear, background 0.3s',
          }}
        />
      </div>

      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2">
          {/* Pulsing phone icon */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--status-low-bg)',
              flexShrink: 0,
              animation: 'pulse 1.4s ease-in-out infinite',
            }}
          >
            <Phone size={16} color="var(--status-low)" />
          </span>

          <div className="flex-1 min-w-0">
            <p
              className="m-0 text-[10px] font-bold uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--status-low)' }}
            >
              Incoming emergency call
            </p>
            <p
              className="m-0 font-semibold text-[15px] truncate"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
            >
              {maskPhone(incomingCall.phone_number)}
            </p>
          </div>

          <span
            className="text-[11px] font-bold shrink-0"
            style={{
              fontFamily: 'var(--font-mono)',
              color: remaining <= 10 ? 'var(--status-critical)' : 'var(--text-muted)',
            }}
          >
            Ringing {remaining}s
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handleDecline}
            className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg font-bold text-[12px] uppercase tracking-wide cursor-pointer border-none"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'var(--status-critical-bg)',
              color: 'var(--status-critical)',
              border: '1px solid var(--status-critical)',
            }}
          >
            <PhoneOff size={14} />
            Decline
          </button>

          <button
            type="button"
            onClick={handleAnswer}
            className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg font-bold text-[12px] uppercase tracking-wide cursor-pointer border-none"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'var(--status-low)',
              color: '#ffffff',
              boxShadow: '0 2px 12px color-mix(in srgb, var(--status-low) 40%, transparent)',
            }}
          >
            <Phone size={14} />
            Answer
          </button>
        </div>
      </div>
    </div>
  )
}
