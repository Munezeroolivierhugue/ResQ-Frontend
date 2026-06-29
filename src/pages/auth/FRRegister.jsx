import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Siren, Lock, Eye, EyeOff, Check } from 'lucide-react'
import { PasswordStrength } from '../../components/auth/AuthShared'
import FRAuthShell from '../../components/auth/FRAuthShell'
import { acceptInvite } from '../../api/auth'

export default function FRRegister() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const inviteEmail = params.get('email') || sessionStorage.getItem('resq-invite-email') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const passwordsMatch = !confirmPassword || password === confirmPassword

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!passwordsMatch) return
    setLoading(true)
    setError('')
    try {
      await acceptInvite(token, password)
      setDone(true)
      setTimeout(() => navigate('/fr/login'), 2500)
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Invalid or expired invitation. Please contact your administrator.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <FRAuthShell>
        <div className="fr-auth-card-wrap">
          <div className="fr-auth-tabs">
            <Link to="/fr/login" className="fr-auth-tab">LOGIN</Link>
            <span className="fr-auth-tab fr-auth-tab--active">SIGN UP</span>
          </div>
          <div className="fr-auth-logo">
            <Siren size={32} strokeWidth={1.5} color="#ffffff" />
            <span className="fr-auth-logo-name">RESQ</span>
            <span className="fr-auth-logo-sub">Vigilant Sentinel</span>
          </div>
          <div className="fr-auth-card">
            <h2 className="fr-auth-card-title">Invitation required</h2>
            <p className="fr-auth-card-sub">
              Please use the secure invitation link sent to your registered email address.
            </p>
            <Link to="/fr/login" className="fr-auth-btn fr-auth-btn--primary fr-auth-btn--full" style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none', marginTop: '1rem' }}>
              BACK TO LOGIN
            </Link>
          </div>
          <p className="fr-auth-footer">Secured by RESQ</p>
        </div>
      </FRAuthShell>
    )
  }

  if (done) {
    return (
      <FRAuthShell>
        <div className="fr-auth-card-wrap">
          <div className="fr-auth-logo">
            <Siren size={32} strokeWidth={1.5} color="#ffffff" />
            <span className="fr-auth-logo-name">RESQ</span>
          </div>
          <div className="fr-auth-card" style={{ textAlign: 'center' }}>
            <div style={{ margin: '0 auto 1rem', width: 52, height: 52, borderRadius: '50%', background: 'var(--status-low-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={26} style={{ color: 'var(--status-low)' }} />
            </div>
            <h2 className="fr-auth-card-title">Account activated</h2>
            <p className="fr-auth-card-sub">Redirecting to login…</p>
          </div>
          <p className="fr-auth-footer">Secured by RESQ</p>
        </div>
      </FRAuthShell>
    )
  }

  return (
    <FRAuthShell>
      <div className="fr-auth-card-wrap" style={{ overflowY: 'auto', flex: 1, justifyContent: 'flex-start', padding: '1.25rem 1.25rem 1.5rem', gap: '0.8rem' }}>
        <div className="fr-auth-tabs">
          <Link to="/fr/login" className="fr-auth-tab">LOGIN</Link>
          <span className="fr-auth-tab fr-auth-tab--active">SIGN UP</span>
        </div>

        <div className="fr-auth-logo">
          <Siren size={32} strokeWidth={1.5} color="#ffffff" />
          <span className="fr-auth-logo-name">RESQ</span>
          <span className="fr-auth-logo-sub">Vigilant Sentinel</span>
        </div>

        <div className="fr-auth-card" style={{ padding: '1.25rem 1.1rem' }}>
          <h2 className="fr-auth-card-title">Set Your Password</h2>
          <p className="fr-auth-card-sub" style={{ marginBottom: '0.85rem' }}>
            {inviteEmail ? `Creating account for ${inviteEmail}` : 'Create a secure password for your responder account'}
          </p>

          {error && <p className="fr-auth-error" style={{ marginBottom: '0.75rem' }}>{error}</p>}

          <form onSubmit={handleSubmit} className="fr-auth-form" style={{ gap: '0.7rem' }}>
            <div className="fr-auth-field">
              <label className="fr-auth-field-label">Password</label>
              <div className="fr-auth-input-wrap">
                <Lock size={16} className="fr-auth-input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="fr-auth-input fr-auth-input--pr"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button type="button" className="fr-auth-eye" onClick={() => setShowPass(v => !v)} aria-label="Toggle password">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <div className="fr-auth-field">
              <label className="fr-auth-field-label">Confirm Password</label>
              <div className="fr-auth-input-wrap">
                <Lock size={16} className="fr-auth-input-icon" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="fr-auth-input fr-auth-input--pr"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="button" className="fr-auth-eye" onClick={() => setShowConfirm(v => !v)} aria-label="Toggle confirm">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!passwordsMatch && <span className="fr-auth-error">Passwords do not match</span>}
            </div>

            <button type="submit" className="fr-auth-btn fr-auth-btn--primary fr-auth-btn--full" disabled={loading}>
              {loading ? 'ACTIVATING…' : 'ACTIVATE ACCOUNT'}
            </button>
          </form>
        </div>

        <p className="fr-auth-footer">Secured by RESQ</p>
      </div>
    </FRAuthShell>
  )
}
