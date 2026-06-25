import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Siren, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { setDemoRole } from '../../utils/authSession'
import FRAuthShell from '../../components/auth/FRAuthShell'

export default function FRLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setDemoRole('field_responder')
    sessionStorage.setItem('resq-login-email', email || 'responder@rnp.gov.rw')
    sessionStorage.setItem('resq-demo-role', 'field_responder')
    navigate('/fr/login/mfa')
  }

  return (
    <FRAuthShell>
      <div className="fr-auth-card-wrap">
        <div className="fr-auth-tabs">
          <span className="fr-auth-tab fr-auth-tab--active">LOGIN</span>
          <Link to="/fr/register" className="fr-auth-tab">SIGN UP</Link>
        </div>

        <div className="fr-auth-logo">
          <Siren size={36} strokeWidth={1.5} color="#ffffff" />
          <span className="fr-auth-logo-name">RESQ</span>
          <span className="fr-auth-logo-sub">Vigilant Sentinel</span>
        </div>

        <div className="fr-auth-card">
          <h2 className="fr-auth-card-title">Welcome back</h2>
          <p className="fr-auth-card-sub">Sign in to your responder account</p>

          <form onSubmit={handleSubmit} className="fr-auth-form">
            <div className="fr-auth-field">
              <label className="fr-auth-field-label">Professional Email</label>
              <div className="fr-auth-input-wrap">
                <Mail size={16} className="fr-auth-input-icon" />
                <input
                  type="email"
                  className="fr-auth-input"
                  placeholder="responder@agency.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="fr-auth-field">
              <label className="fr-auth-field-label">Access Key</label>
              <div className="fr-auth-input-wrap">
                <Lock size={16} className="fr-auth-input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="fr-auth-input fr-auth-input--pr"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="fr-auth-eye" onClick={() => setShowPass(v => !v)} aria-label="Toggle password">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="fr-auth-row">
              <label className="fr-auth-check-label">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="fr-auth-checkbox" />
                Remember this device
              </label>
              <a href="#" className="fr-auth-recover">Recover access</a>
            </div>

            <button type="submit" className="fr-auth-btn fr-auth-btn--primary fr-auth-btn--full">
              AUTHORIZE TERMINAL
            </button>
          </form>
        </div>

        <p className="fr-auth-footer">Secured by RESQ</p>
      </div>
    </FRAuthShell>
  )
}
