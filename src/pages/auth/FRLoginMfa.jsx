import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Siren, Lock, RefreshCw, Mail } from 'lucide-react'
import FRAuthShell from '../../components/auth/FRAuthShell'
import { verifyMfa, resendMfaCode } from '../../api/auth'
import { setSession } from '../../utils/authSession'

const OTP_LEN = 6

export default function FRLoginMfa() {
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
    if (digits.some(d => !d)) { setError('Please enter the complete 6-digit code.'); return }
    setError('')
    setResendMsg('')

    const challengeToken = sessionStorage.getItem('resq-challenge-token')
    if (!challengeToken) { navigate('/fr/login'); return }

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
      navigate('/field-responder/shift-start')
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
    if (!challengeToken) { navigate('/fr/login'); return }
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
    <FRAuthShell>
      <div className="fr-auth-card-wrap">
        <div className="fr-auth-logo">
          <Siren size={36} strokeWidth={1.5} color="#ffffff" />
          <span className="fr-auth-logo-name">RESQ</span>
          <span className="fr-auth-logo-sub">Vigilant Sentinel</span>
        </div>

        <div className="fr-auth-card">
          <div className="fr-otp-icon-wrap">
            <Mail size={26} color="var(--accent)" />
          </div>
          <p className="fr-otp-eyebrow">Verification required</p>
          <h2 className="fr-auth-card-title">Check Your Email</h2>
          <p className="fr-auth-card-sub">
            A 6-digit code was sent to <strong>{email || 'your email'}</strong>. Enter it below.
            The code expires in <strong>5 minutes</strong>.
          </p>

          <form onSubmit={handleVerify} className="fr-auth-form">
            <div className="fr-otp-inputs">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { refs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  autoFocus={i === 0}
                  className="fr-otp-digit"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {error && (
              <p className="fr-auth-error" style={{ textAlign: 'center' }}>{error}</p>
            )}
            {resendMsg && (
              <p style={{ fontSize: '11px', color: 'var(--status-low)', textAlign: 'center', margin: '4px 0' }}>
                {resendMsg}
              </p>
            )}

            <button type="submit" className="fr-auth-btn fr-auth-btn--primary fr-auth-btn--full" disabled={loading || resending}>
              <Lock size={15} /> {loading ? 'VERIFYING…' : 'VERIFY & AUTHORIZE'}
            </button>
          </form>

          <button
            type="button"
            className="fr-otp-resend"
            onClick={handleResend}
            disabled={resending || loading}
          >
            <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        </div>

        <p className="fr-auth-footer">Secured by RESQ</p>
      </div>
    </FRAuthShell>
  )
}
