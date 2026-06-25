import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Siren, Lock, RefreshCw, Smartphone } from 'lucide-react'
import FRAuthShell from '../../components/auth/FRAuthShell'

const OTP_LEN = 6

export default function FRLoginMfa() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(Array(OTP_LEN).fill(''))
  const [error, setError] = useState('')
  const refs = useRef([])

  const email = sessionStorage.getItem('resq-login-email') || 'responder@rnp.gov.rw'

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

  const handleVerify = (e) => {
    e.preventDefault()
    if (digits.some(d => !d)) { setError('Please enter the complete 6-digit code.'); return }
    setError('')
    sessionStorage.setItem('resq-trusted-device', 'true')
    navigate('/field-responder/shift-start')
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
            <Smartphone size={26} color="var(--accent)" />
          </div>
          <p className="fr-otp-eyebrow">Verification required</p>
          <h2 className="fr-auth-card-title">Authenticator Code</h2>
          <p className="fr-auth-card-sub">
            Enter the 6-digit code from your authenticator app for <strong>{email}</strong>
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
            {error && <p className="fr-auth-error" style={{ textAlign: 'center' }}>{error}</p>}
            <button type="submit" className="fr-auth-btn fr-auth-btn--primary fr-auth-btn--full">
              <Lock size={15} /> VERIFY & AUTHORIZE
            </button>
          </form>

          <button type="button" className="fr-otp-resend">
            <RefreshCw size={13} /> Resend secure code
          </button>
        </div>

        <p className="fr-auth-footer">Secured by RESQ</p>
      </div>
    </FRAuthShell>
  )
}
