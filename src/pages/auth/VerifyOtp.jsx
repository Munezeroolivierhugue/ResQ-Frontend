import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, RefreshCw } from 'lucide-react'
import AuthCenterLayout from '../../components/auth/AuthCenterLayout'

const OTP_LEN = 6

export default function VerifyOtp() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(Array(OTP_LEN).fill(''))
  const refs = useRef([])

  const email = sessionStorage.getItem('resq-register-email') || 'user@rnp.gov.rw'

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < OTP_LEN - 1) refs.current[i + 1]?.focus()
  }

  const handleVerify = (e) => {
    e.preventDefault()
    navigate('/mfa-setup')
  }

  return (
    <AuthCenterLayout>
      <div className="auth-otp-card">
        <span className="auth-otp-corner auth-otp-corner--tl" />
        <span className="auth-otp-corner auth-otp-corner--br" />

        <p className="auth-otp-eyebrow">Verification required</p>
        <h1 className="auth-otp-title">Mission credentials verification</h1>
        <p className="auth-otp-desc">
          A 6-digit secure code has been dispatched to <strong>{email}</strong>. Enter it below to
          authorize this terminal.
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
                className="auth-otp-digit"
              />
            ))}
          </div>
          <button type="submit" className="auth-otp-submit">
            <Lock size={16} />
            Verify & authorize
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
