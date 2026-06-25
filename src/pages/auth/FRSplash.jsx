import { useNavigate } from 'react-router-dom'
import { Siren, Shield, Zap } from 'lucide-react'
import FRAuthShell from '../../components/auth/FRAuthShell'

export default function FRSplash() {
  const navigate = useNavigate()

  return (
    <FRAuthShell splash>
      <div className="fr-splash-body">
        <div className="fr-splash-badges">
          <span className="fr-splash-badge"><Shield size={11} /> SECURE</span>
          <span className="fr-splash-badge"><Zap size={11} /> AI POWERED</span>
        </div>

        <div className="fr-splash-logo-wrap">
          <div className="fr-splash-icon-ring">
            <Siren size={40} strokeWidth={1.5} color="var(--accent)" />
          </div>
          <div className="fr-splash-brand">
            <span className="fr-splash-brand-name">RESQ</span>
            <span className="fr-splash-brand-sub">Vigilant Sentinel</span>
          </div>
        </div>

        <div className="fr-splash-text">
          <h1 className="fr-splash-headline">
            Precision response starts with secure intelligence.
          </h1>
          <p className="fr-splash-desc">
            Join the network of emergency responders powered by AI intelligence systems.
          </p>
        </div>

        <div className="fr-splash-actions">
          <button
            type="button"
            className="fr-auth-btn fr-auth-btn--primary"
            onClick={() => navigate('/fr/login')}
          >
            GET STARTED
          </button>
          <p className="fr-splash-hint">
            Already have an account?{' '}
            <button type="button" className="fr-splash-link" onClick={() => navigate('/fr/login')}>
              Sign in
            </button>
          </p>
        </div>

        <p className="fr-splash-footer">RESQ · Secured by RNP Command Context · TLS 1.3</p>
      </div>
    </FRAuthShell>
  )
}
