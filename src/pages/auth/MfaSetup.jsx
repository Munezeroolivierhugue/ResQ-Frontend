import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, RefreshCw, ShieldCheck, Check } from 'lucide-react'
import AuthCenterLayout from '../../components/auth/AuthCenterLayout'
import { setupMfa, confirmMfaSetup } from '../../api/auth'
import { getAccessToken, getDemoRole, navigatePortal } from '../../utils/authSession'

const OTP_LEN = 6

export default function MfaSetup() {
  const navigate = useNavigate()
  const [challengeToken, setChallengeToken] = useState(null)
  const [message, setMessage] = useState('')
  const [digits, setDigits] = useState(Array(OTP_LEN).fill(''))
  const [error, setError] = useState('')
  const [setupLoading, setSetupLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [success, setSuccess] = useState(false)
  const refs = useRef([])
  const setupStarted = useRef(false)

  // Guard: redirect to login if not authenticated
  useEffect(() => {
    if (!getAccessToken()) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    if (!getAccessToken()) return   // skip if not authenticated (redirect pending)
    // StrictMode double-invokes this effect in dev; setupMfa() is not idempotent
    // (it mints a new code + sends a new email every call), so guard against
    // firing the request twice on the same mount. Unlike a `cancelled` flag tied
    // to cleanup, this guard is never reset, so the one request that does fire
    // is always allowed to update state when it resolves.
    if (setupStarted.current) return
    setupStarted.current = true
    setupMfa()
      .then((res) => {
        setChallengeToken(res.challengeToken)
        setMessage(res.message || 'A 6-digit verification code has been sent to your email.')
      })
      .catch((err) => {
        const status = err?.response?.status
        const msg = err?.response?.data?.message
        if (status === 503) {
          setError('MFA service is temporarily unavailable (Redis may be down). Please try again shortly.')
        } else {
          setError(msg || 'Failed to initiate MFA setup. Please try again.')
        }
      })
      .finally(() => { setSetupLoading(false) })
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
    if (digits.some((d) => !d)) {
      setError('Please enter the complete 6-digit code.')
      return
    }
    if (!challengeToken) {
      setError('No active challenge. Please resend the code.')
      return
    }
    setError('')
    setVerifying(true)
    try {
      await confirmMfaSetup(challengeToken, digits.join(''))
      setSuccess(true)
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Verification failed. The code may be incorrect or expired.'
      )
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
        setMessage(res.message || 'A new verification code has been sent to your email.')
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to resend code.')
      })
      .finally(() => setSetupLoading(false))
  }

  if (success) {
    return (
      <AuthCenterLayout>
        <div className="auth-otp-card">
          <div className="auth-otp-icon-wrap">
            <ShieldCheck size={28} className="text-(--accent)" />
          </div>
          <p className="auth-otp-eyebrow">MFA enabled</p>
          <h1 className="auth-otp-title">Account secured</h1>
          <p className="auth-otp-desc">
            Two-factor authentication is now active. Your account is protected by email OTP verification on every login.
          </p>
          <button type="button" className="auth-otp-submit" onClick={() => navigatePortal(getDemoRole(), navigate)}>
            <Check size={16} />
            Enter your portal
          </button>
        </div>
      </AuthCenterLayout>
    )
  }

  return (
    <AuthCenterLayout>
      <div className="auth-otp-card">
        <span className="auth-otp-corner auth-otp-corner--tl" />
        <span className="auth-otp-corner auth-otp-corner--br" />

        <div className="auth-otp-icon-wrap">
          <Mail size={28} className="text-(--accent)" />
        </div>

        <p className="auth-otp-eyebrow">Two-factor authentication setup</p>
        <h1 className="auth-otp-title">Secure your account</h1>
        <p className="auth-otp-desc">
          {setupLoading
            ? 'Sending verification code to your email…'
            : message}
        </p>

        {!setupLoading && (
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

            <button type="submit" className="auth-otp-submit" disabled={verifying}>
              <Lock size={16} />
              {verifying ? 'Verifying…' : 'Enable MFA'}
            </button>
          </form>
        )}

        {setupLoading && error && (
          <p className="auth-field-error" style={{ textAlign: 'center', marginTop: '12px' }}>{error}</p>
        )}

        <button
          type="button"
          className="auth-otp-resend"
          onClick={handleResend}
          disabled={setupLoading}
        >
          <RefreshCw size={14} />
          Resend code
        </button>
      </div>
    </AuthCenterLayout>
  )
}
