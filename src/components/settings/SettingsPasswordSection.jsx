import { useRef, useState } from 'react'
import { Mail, RefreshCw, ShieldCheck, Lock, Check } from 'lucide-react'
import { PasswordStrength } from '../auth/AuthShared'

const OTP_LEN = 6

/** Frontend-only: any 6 digits passes until backend OTP is wired. */
function isMockOtpValid(code) {
  return /^\d{6}$/.test(code)
}

export const DISPATCHER_ACCOUNT_EMAIL = 'jb.nkurunziza@resq.rw'

function maskEmail(email) {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, 1)
  return `${visible}***@${domain}`
}

export default function SettingsPasswordSection({ onSuccess }) {
  const [step, setStep] = useState('idle')
  const [sending, setSending] = useState(false)
  const [digits, setDigits] = useState(Array(OTP_LEN).fill(''))
  const [otpError, setOtpError] = useState('')
  const [pw, setPw] = useState({ next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const refs = useRef([])

  const handleSendOtp = () => {
    setSending(true)
    setOtpError('')
    setDigits(Array(OTP_LEN).fill(''))
    setTimeout(() => {
      setSending(false)
      setStep('otp_pending')
    }, 900)
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    setOtpError('')
    if (val && i < OTP_LEN - 1) refs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const handleVerifyOtp = (e) => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== OTP_LEN) {
      setOtpError('Enter the full 6-digit code from your email.')
      return
    }
    if (!isMockOtpValid(code)) {
      setOtpError('Invalid or expired code. Request a new code and try again.')
      return
    }
    setOtpError('')
    setStep('verified')
  }

  const handleResend = () => {
    setDigits(Array(OTP_LEN).fill(''))
    setOtpError('')
    setSending(true)
    setTimeout(() => setSending(false), 700)
  }

  const handleUpdatePassword = (e) => {
    e.preventDefault()
    if (pw.next.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }
    if (pw.next !== pw.confirm) {
      setPwError('New password and confirmation do not match.')
      return
    }
    setPwError('')
    setPw({ next: '', confirm: '' })
    setDigits(Array(OTP_LEN).fill(''))
    setStep('idle')
    onSuccess?.()
  }

  const handleCancel = () => {
    setStep('idle')
    setDigits(Array(OTP_LEN).fill(''))
    setPw({ next: '', confirm: '' })
    setOtpError('')
    setPwError('')
  }

  return (
    <div className="settings-password-section">
      <div className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-3" style={{ fontFamily: 'var(--font-display)' }}>
        Password
      </div>

      {step === 'idle' && (
        <>
          <div
            className="settings-password-notice flex gap-3 p-3 rounded-lg mb-4 text-[13px] text-(--text-secondary)"
            style={{ background: 'var(--accent-ghost)', border: '1px solid var(--border)' }}
          >
            <ShieldCheck size={18} className="text-(--accent) shrink-0 mt-0.5" />
            <p className="m-0 leading-relaxed">
              For security, password changes require a one-time verification code sent to your
              registered email. You cannot update your password without completing this step.
            </p>
          </div>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-3">
            Registered email:{' '}
            <strong className="text-(--text-primary)">{DISPATCHER_ACCOUNT_EMAIL}</strong>
          </p>
          <button
            type="button"
            className="dispatcher-btn-primary flex items-center gap-2"
            disabled={sending}
            onClick={handleSendOtp}
          >
            <Mail size={16} />
            {sending ? 'Sending code…' : 'Send verification code'}
          </button>
        </>
      )}

      {step === 'otp_pending' && (
        <div className="settings-form-field">
          <p className="text-[13px] text-(--text-secondary) m-0 mb-3 leading-relaxed">
            A 6-digit code was sent to <strong>{maskEmail(DISPATCHER_ACCOUNT_EMAIL)}</strong>.
            Enter it below to unlock password change.
          </p>
          <form onSubmit={handleVerifyOtp}>
            <div className="settings-otp-inputs">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { refs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="settings-otp-digit"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            {otpError && (
              <p className="text-[12px] m-0 mb-3" style={{ color: 'var(--status-critical)' }}>
                {otpError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="dispatcher-btn-primary flex items-center gap-2">
                <Lock size={16} />
                Verify code
              </button>
              <button type="button" className="dispatcher-btn-ghost" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
          <button
            type="button"
            className="settings-otp-resend mt-3"
            disabled={sending}
            onClick={handleResend}
          >
            <RefreshCw size={14} className={sending ? 'animate-spin' : ''} />
            {sending ? 'Sending…' : 'Resend code'}
          </button>
          <p className="text-[11px] text-(--text-muted) m-0 mt-2">
            Prototype mode: enter any 6 digits (e.g. 123456) to continue. Email delivery is not connected yet.
          </p>
        </div>
      )}

      {step === 'verified' && (
        <form onSubmit={handleUpdatePassword} className="settings-form-field">
          <p className="text-[12px] m-0 mb-3 flex items-center gap-1.5" style={{ color: 'var(--status-low)' }}>
            <Check size={14} />
            Email verified — set your new password below.
          </p>
          <div className="grid grid-cols-1 gap-3 mb-2">
            <input
              type="password"
              placeholder="New password"
              className="auth-input"
              value={pw.next}
              onChange={(e) => { setPw((p) => ({ ...p, next: e.target.value })); setPwError('') }}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="auth-input"
              value={pw.confirm}
              onChange={(e) => { setPw((p) => ({ ...p, confirm: e.target.value })); setPwError('') }}
            />
          </div>
          <PasswordStrength password={pw.next} />
          {pwError && (
            <p className="text-[12px] mt-2 m-0" style={{ color: 'var(--status-critical)' }}>
              {pwError}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            <button type="submit" className="dispatcher-btn-primary">
              Update password
            </button>
            <button type="button" className="dispatcher-btn-ghost" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
