import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, RefreshCw, Smartphone } from 'lucide-react'
import AuthCenterLayout from '../../components/auth/AuthCenterLayout'
import { ASSIGNED_ROLES } from '../../data/mockAuthData'
import { setSession, getDemoRole, navigatePortal } from '../../utils/authSession'
import { verifyMfa } from '../../api/auth'

const OTP_LEN = 6

export default function LoginMfa() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(Array(OTP_LEN).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const refs = useRef([])

  const email = sessionStorage.getItem('resq-login-email') || 'user@rnp.gov.rw'

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
    pasted.split('').forEach((char, idx) => {
      next[idx] = char
    })
    setDigits(next)
    const focusIndex = Math.min(pasted.length, OTP_LEN - 1)
    refs.current[focusIndex]?.focus()
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (digits.some((d) => !d)) {
      setError('Please enter the complete 6-digit secure code.')
      return
    }
    setError('')

    const challengeToken = sessionStorage.getItem('resq-challenge-token')

    if (challengeToken) {
      // Real API flow
      setLoading(true)
      try {
        const result = await verifyMfa(challengeToken, digits.join(''))
        setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          user: result.user ?? null,
        })
        sessionStorage.removeItem('resq-challenge-token')
        sessionStorage.setItem('resq-trusted-device', 'true')

        const role = result.user?.role
        if (role) {
          const roleMap = {
            DISPATCHER: 'dispatcher',
            FIELD_RESPONDER: 'field_responder',
            OPERATIONS_MANAGER: 'ops_manager',
            OPS_MANAGER: 'ops_manager',
            DISTRICT_COMMANDER: 'district_commander',
            EMERGENCY_PLANNER: 'emergency_planner',
            ANALYST: 'analyst',
            SUPER_ADMIN: 'super_admin',
          }
          const mapped = roleMap[role] ?? role.toLowerCase()
          navigatePortal(mapped, navigate)
        } else {
          navigate('/dispatcher')
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Verification failed. Check your code and try again.'
        setError(msg)
      } finally {
        setLoading(false)
      }
    } else {
      // Demo mode: no real token
      sessionStorage.setItem('resq-trusted-device', 'true')
      const role = getDemoRole() || sessionStorage.getItem('resq-demo-role') || 'dispatcher'
      const portal = ASSIGNED_ROLES.find((r) => r.value === role)?.portal || '/dispatcher'
      navigate(portal)
    }
  }

  return (
    <AuthCenterLayout>
      <div className="auth-otp-card">
        <span className="auth-otp-corner auth-otp-corner--tl" />
        <span className="auth-otp-corner auth-otp-corner--br" />

        <div className="auth-otp-icon-wrap">
          <Smartphone size={28} className="text-(--accent)" />
        </div>

        <p className="auth-otp-eyebrow">Verification required</p>
        <h1 className="auth-otp-title">Google Authenticator verification</h1>
        <p className="auth-otp-desc">
          A 6-digit secure code has been sent to your authenticator app for{' '}
          <strong>{email}</strong>. Enter it below to authorize this terminal.
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

          {error && <p className="auth-field-error" style={{ textAlign: 'center', marginTop: '12px' }}>{error}</p>}

          <button type="submit" className="auth-otp-submit" disabled={loading}>
            <Lock size={16} />
            {loading ? 'Verifying…' : 'Verify & authorize'}
          </button>
        </form>

        <button type="button" className="auth-otp-resend">
          <RefreshCw size={14} />
          Resend secure code
        </button>
      </div>
    </AuthCenterLayout>
  )
}
