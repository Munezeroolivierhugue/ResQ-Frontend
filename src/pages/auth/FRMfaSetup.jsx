import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Siren, Mail, Lock, RefreshCw, Check } from 'lucide-react'
import FRAuthShell from '../../components/auth/FRAuthShell'
import { setupMfa, confirmMfaSetup } from '../../api/auth'
import { getAccessToken } from '../../utils/authSession'

const OTP_LEN = 6

export default function FRMfaSetup() {
  const navigate = useNavigate()
  const [challengeToken, setChallengeToken] = useState(null)
  const [message, setMessage] = useState('')
  const [digits, setDigits] = useState(Array(OTP_LEN).fill(''))
  const [error, setError] = useState('')
  const [setupLoading, setSetupLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [success, setSuccess] = useState(false)
  const refs = useRef([])

  useEffect(() => {
    if (!getAccessToken()) {
      navigate('/fr/login', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    if (!getAccessToken()) return
    let cancelled = false
    setupMfa()
      .then((res) => {
        if (cancelled) return
        setChallengeToken(res.challengeToken)
        setMessage(res.message || 'A 6-digit verification code has been sent to your email.')
      })
      .catch((err) => {
        if (cancelled) return
        const status = err?.response?.status
        const msg = err?.response?.data?.message
        if (status === 503) {
          setError('MFA service is temporarily unavailable. Please try again shortly.')
        } else {
          setError(msg || 'Failed to initiate MFA setup. Please try again.')
        }
      })
      .finally(() => { if (!cancelled) setSetupLoading(false) })
    return () => { cancelled = true }
  }, [])

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
    if (!challengeToken) { setError('No active challenge. Please resend the code.'); return }
    setError('')
    setVerifying(true)
    try {
      await confirmMfaSetup(challengeToken, digits.join(''))
      setSuccess(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Verification failed. The code may be incorrect or expired.')
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = () => {
    setSetupLoading(true)
    setDigits(Array(OTP_LEN).fill(''))
    setError('')
    setupMfa()
      .then((res) => {
        setChallengeToken(res.challengeToken)
        setMessage(res.message || 'A new verification code has been sent.')
      })
      .catch((err) => setError(err?.response?.data?.message || 'Failed to resend code.'))
      .finally(() => setSetupLoading(false))
  }

  if (success) {
    return (
      <FRAuthShell>
        <div className="fr-auth-card-wrap">
          <div className="fr-auth-logo">
            <Siren size={36} strokeWidth={1.5} color="#ffffff" />
            <span className="fr-auth-logo-name">RESQ</span>
          </div>
          <div className="fr-auth-card" style={{ textAlign: 'center' }}>
            <div style={{ margin: '0 auto 1rem', width: 52, height: 52, borderRadius: '50%', background: 'var(--status-low-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={26} style={{ color: 'var(--status-low)' }} />
            </div>
            <h2 className="fr-auth-card-title">MFA Enabled</h2>
            <p className="fr-auth-card-sub">Your account is now protected with two-factor authentication.</p>
            <button
              type="button"
              className="fr-auth-btn fr-auth-btn--primary fr-auth-btn--full"
              style={{ marginTop: '1rem' }}
              onClick={() => navigate('/field-responder/shift-start', { replace: true })}
            >
              ENTER YOUR PORTAL
            </button>
          </div>
          <p className="fr-auth-footer">Secured by RESQ</p>
        </div>
      </FRAuthShell>
    )
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
          <p className="fr-otp-eyebrow">Two-factor authentication setup</p>
          <h2 className="fr-auth-card-title">Secure Your Account</h2>
          <p className="fr-auth-card-sub">
            {setupLoading ? 'Sending verification code to your email…' : message}
          </p>

          {!setupLoading && (
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
              {error && <p className="fr-auth-error" style={{ textAlign: 'center' }}>{error}</p>}
              <button type="submit" className="fr-auth-btn fr-auth-btn--primary fr-auth-btn--full" disabled={verifying}>
                <Lock size={15} /> {verifying ? 'VERIFYING…' : 'ENABLE MFA'}
              </button>
            </form>
          )}

          {setupLoading && error && (
            <p className="fr-auth-error" style={{ textAlign: 'center', marginTop: '0.5rem' }}>{error}</p>
          )}

          <button type="button" className="fr-otp-resend" onClick={handleResend} disabled={setupLoading}>
            <RefreshCw size={13} /> Resend code
          </button>
        </div>

        <p className="fr-auth-footer">Secured by RESQ</p>
      </div>
    </FRAuthShell>
  )
}
