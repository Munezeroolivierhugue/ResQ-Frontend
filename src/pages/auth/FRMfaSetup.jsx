import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Siren, Smartphone, ShieldCheck, Check, Info } from 'lucide-react'
import { MFA_SETUP_OPTIONS } from '../../data/mockAuthData'
import FRAuthShell from '../../components/auth/FRAuthShell'

const ICONS = { google_auth: Smartphone, trusted_device: ShieldCheck }

export default function FRMfaSetup() {
  const navigate = useNavigate()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleFinalContinue = () => {
    sessionStorage.setItem('resq-mfa-enabled', 'true')
    sessionStorage.setItem('resq-trusted-device', 'true')
    navigate('/fr/login')
  }

  return (
    <FRAuthShell>
      <div className="fr-auth-card-wrap" style={{ overflowY: 'auto', flex: 1 }}>
        <div className="fr-auth-logo">
          <Siren size={36} strokeWidth={1.5} color="#ffffff" />
          <span className="fr-auth-logo-name">RESQ</span>
          <span className="fr-auth-logo-sub">Vigilant Sentinel</span>
        </div>

        <div className="fr-auth-card">
          <span className="fr-mfa-badge">Identity protection active</span>
          <h2 className="fr-auth-card-title" style={{ marginTop: '0.75rem' }}>Account Secured</h2>
          <p className="fr-auth-card-sub">
            Multi-factor authentication has been established for your responder account.
          </p>

          <div className="fr-mfa-cards">
            {MFA_SETUP_OPTIONS.map(opt => {
              const Icon = ICONS[opt.id] || Smartphone
              return (
                <div key={opt.id} className="fr-mfa-card">
                  <div className="fr-mfa-card-top">
                    <div className="fr-mfa-card-icon-wrap"><Icon size={20} color="var(--accent)" /></div>
                    <span className="fr-mfa-card-configured">CONFIGURED</span>
                  </div>
                  <div className="fr-mfa-card-title">{opt.title}</div>
                  <p className="fr-mfa-card-text">{opt.description}</p>
                </div>
              )
            })}
          </div>

          <div className="fr-mfa-protocol">
            <Info size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p className="fr-mfa-protocol-text">
              All authentication attempts are logged and geo-tagged for security audit.
            </p>
          </div>

          <button
            type="button"
            className="fr-auth-btn fr-auth-btn--primary fr-auth-btn--full"
            style={{ marginTop: '1rem' }}
            onClick={() => setShowSuccess(true)}
          >
            COMPLETE REGISTRATION
          </button>
        </div>

        <p className="fr-auth-footer">Secured by RESQ</p>
      </div>

      {showSuccess && (
        <div className="fr-mfa-success-overlay">
          <div className="fr-mfa-success-card">
            <div className="fr-mfa-success-top">
              <div className="fr-mfa-success-check"><Check size={36} strokeWidth={3} color="#fff" /></div>
              <span className="fr-mfa-success-label">SUCCESS</span>
            </div>
            <div className="fr-mfa-success-body">
              <p className="fr-mfa-success-text">
                Your responder account has been successfully created and secured.
              </p>
              <button type="button" className="fr-auth-btn fr-auth-btn--primary fr-auth-btn--full" onClick={handleFinalContinue}>
                CONTINUE TO LOGIN
              </button>
            </div>
          </div>
        </div>
      )}
    </FRAuthShell>
  )
}
