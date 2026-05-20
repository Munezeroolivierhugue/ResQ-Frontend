import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, ShieldCheck, Info } from 'lucide-react'
import AuthCenterLayout from '../../components/auth/AuthCenterLayout'
import { MFA_SETUP_OPTIONS } from '../../data/mockAuthData'

const ICONS = {
  google_auth: Smartphone,
  trusted_device: ShieldCheck,
}

export default function MfaSetup() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState('google_auth')

  const handleConfirm = () => {
    sessionStorage.setItem('resq-mfa-enabled', 'true')
    if (selected === 'trusted_device') {
      sessionStorage.setItem('resq-trusted-device', 'true')
    }
    navigate('/login')
  }

  return (
    <AuthCenterLayout>
      <div className="auth-mfa-wrap auth-mfa-wrap--centered">
        <span className="auth-mfa-badge">Identity protection active</span>
        <h1 className="auth-mfa-title">Fortify your command profile</h1>
        <p className="auth-mfa-desc">
          Multi-factor authentication is mandatory for Sentinel Protocol access. Enable Google
          Authenticator and trusted device recognition before entering the command grid.
        </p>

        <div className="auth-mfa-cards auth-mfa-cards--two">
          {MFA_SETUP_OPTIONS.map((opt) => {
            const Icon = ICONS[opt.id] || Smartphone
            const active = selected === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected(opt.id)}
                className={`auth-mfa-card${active ? ' auth-mfa-card--active' : ''}`}
              >
                {opt.recommended && <span className="auth-mfa-recommended">Recommended</span>}
                <Icon size={22} className="auth-mfa-card-icon" />
                <div className="auth-mfa-card-title">{opt.title}</div>
                <p className="auth-mfa-card-text">{opt.description}</p>
                <span className={`auth-mfa-radio${active ? ' auth-mfa-radio--on' : ''}`} />
              </button>
            )
          })}
        </div>

        <div className="auth-mfa-protocol">
          <Info size={16} className="shrink-0 text-(--text-muted)" />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-(--text-secondary)">
              System protocol 4.0
            </div>
            <p className="text-[12px] text-(--text-muted) m-0 mt-0.5">
              All authentication attempts are logged and geo-tagged for security audit.
            </p>
          </div>
          <button type="button" onClick={handleConfirm} className="auth-mfa-confirm">
            Confirm MFA setup
          </button>
        </div>
      </div>
    </AuthCenterLayout>
  )
}
