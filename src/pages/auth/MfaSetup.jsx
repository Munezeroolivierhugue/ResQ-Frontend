import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, ShieldCheck, Info, Check } from 'lucide-react'
import AuthCenterLayout from '../../components/auth/AuthCenterLayout'
import { MFA_SETUP_OPTIONS } from '../../data/mockAuthData'

const ICONS = {
  google_auth: Smartphone,
  trusted_device: ShieldCheck,
}

export default function MfaSetup() {
  const navigate = useNavigate()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleConfirm = () => {
    setShowSuccess(true)
  }

  const handleFinalContinue = () => {
    sessionStorage.setItem('resq-mfa-enabled', 'true')
    sessionStorage.setItem('resq-trusted-device', 'true')
    navigate('/login')
  }

  return (
    <AuthCenterLayout>
      <div className="auth-mfa-wrap auth-mfa-wrap--centered">
        <span className="auth-mfa-badge">Identity protection active</span>
        <h1 className="auth-mfa-title">Command profile secured</h1>
        <p className="auth-mfa-desc">
          Multi-factor authentication has been successfully established. Google Authenticator and
          trusted device recognition are now active for your account.
        </p>

        <div className="auth-mfa-cards auth-mfa-cards--two">
          {MFA_SETUP_OPTIONS.map((opt) => {
            const Icon = ICONS[opt.id] || Smartphone
            return (
              <div
                key={opt.id}
                className="auth-mfa-card auth-mfa-card--active"
                style={{ cursor: 'default' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={22} className="auth-mfa-card-icon m-0" />
                  <span className="text-[13px] font-bold text-(--accent)">CONFIGURED</span>
                </div>
                <div className="auth-mfa-card-title">{opt.title}</div>
                <p className="auth-mfa-card-text">{opt.description}</p>
                <span className="auth-mfa-radio auth-mfa-radio--on" />
              </div>
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
            Complete Registration
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-(--bg-base) rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-10 flex flex-col items-center justify-center text-center" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center mb-4" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
                <Check size={36} strokeWidth={3} />
              </div>
              <div className="font-bold tracking-widest text-lg uppercase">Success</div>
            </div>
            <div className="p-8 text-center flex flex-col gap-6">
              <p className="text-(--text-secondary) text-[14px] leading-relaxed m-0">
                Congratulations, your account has been successfully created and secured.
              </p>
              <button
                type="button"
                className="dispatcher-btn-primary w-full justify-center"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)', border: 'none' }}
                onClick={handleFinalContinue}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthCenterLayout>
  )
}
