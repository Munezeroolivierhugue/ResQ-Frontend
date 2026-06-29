import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, RefreshCw } from 'lucide-react'
import AuthCenterLayout from '../../components/auth/AuthCenterLayout'
import { setSession, navigatePortal } from '../../utils/authSession'
import { verifyMfa, resendMfaCode } from '../../api/auth'

const OTP_LEN = 6

const ROLE_MAP = {
  DISPATCHER: 'dispatcher',
  FIELD_RESPONDER: 'field_responder',
  OPERATIONS_MANAGER: 'ops_manager',
  OPS_MANAGER: 'ops_manager',
  DISTRICT_COMMANDER: 'district_commander',
  EMERGENCY_PLANNER: 'emergency_planner',
  ANALYST: 'analyst',
  SUPER_ADMIN: 'super_admin',
}

export default function LoginMfa() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(Array(OTP_LEN).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const refs = useRef([])

  const email = sessionStorage.getItem('resq-login-email') || ''

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < OTP_LEN - 1) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    if (!pasted) return
    const next = [...digits]
    pasted.split('').forEach((char, idx) => { next[idx] = char })
    setDigits(next)
    refs.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus()
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (digits.some((d) => !d)) {
      setError('Please enter the complete 6-digit secure code.')
      return
    }
    setError('')
    setResendMsg('')

    const challengeToken = sessionStorage.getItem('resq-challenge-token')
    if (!challengeToken) {
      navigate('/login')
      return
    }

    setLoading(true)
    try {
      const result = await verifyMfa(challengeToken, digits.join(''))
      sessionStorage.removeItem('resq-challenge-token')
      sessionStorage.setItem('resq-trusted-device', 'true')
      setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: result.user ?? null,
      })
      const role = result.user?.role
      navigatePortal(ROLE_MAP[role] ?? (role?.toLowerCase() || 'dispatcher'), navigate)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Verification failed. The code may be incorrect or expired.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    const challengeToken = sessionStorage.getItem('resq-challenge-token')
    if (!challengeToken) { navigate('/login'); return }
    setResending(true)
    setResendMsg('')
    setError('')
    setDigits(Array(OTP_LEN).fill(''))
    try {
      const result = await resendMfaCode(challengeToken)
      if (result.challengeToken) {
        sessionStorage.setItem('resq-challenge-token', result.challengeToken)
      }
      setResendMsg('A new code has been sent to your email.')
      refs.current[0]?.focus()
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to resend code. Please go back and log in again.'
      )
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthCenterLayout>
      <div className="auth-otp-card">
        <span className="auth-otp-corner auth-otp-corner--tl" />
        <span className="auth-otp-corner auth-otp-corner--br" />

        <div className="auth-otp-icon-wrap">
          <Mail size={28} className="text-(--accent)" />
        </div>

        <p className="auth-otp-eyebrow">Verification required</p>
        <h1 className="auth-otp-title">Check your email</h1>
        <p className="auth-otp-desc">
          A 6-digit secure code was sent to <strong>{email || 'your email'}</strong>. Enter it
          below to authorize this terminal. The code expires in <strong>5 minutes</strong>.
        </p>

        <form onSubmit={handleVerify}>
          <div className="auth-otp-inputs">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                autoFocus={i === 0}
                className="auth-otp-digit"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {error && (
            <p className="auth-field-error" style={{ textAlign: 'center', marginTop: '12px' }}>
              {error}
            </p>
          )}

          {resendMsg && (
            <p style={{ fontSize: '12px', color: 'var(--status-low)', textAlign: 'center', marginTop: '8px' }}>
              {resendMsg}
            </p>
          )}

          <button type="submit" className="auth-otp-submit" disabled={loading || resending}>
            <Lock size={16} />
            {loading ? 'Verifying…' : 'Verify & authorize'}
          </button>
        </form>

        <button
          type="button"
          className="auth-otp-resend"
          onClick={handleResend}
          disabled={resending || loading}
        >
          <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </AuthCenterLayout>
  )
}
