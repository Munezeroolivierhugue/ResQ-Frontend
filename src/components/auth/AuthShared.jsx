import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Siren, ArrowRight, ShieldCheck } from 'lucide-react'
import signupImage from '../../assets/signup_Image.png'

/** Login-only demo portal switcher — remove when backend is wired. */
export function DemoPortalDropdown({ inline = false }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`auth-demo-dropdown relative${inline ? ' auth-demo-dropdown--inline' : ''}`}>
      <button
        type="button"
        className="auth-demo-dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        Demo portal access
        <span className="auth-demo-dropdown-chevron" aria-hidden>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <>
          <button
            type="button"
            className="auth-demo-dropdown-backdrop"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="auth-demo-dropdown-menu" role="listbox">
            <Link
              to="/admin"
              className="auth-demo-dropdown-item"
              onClick={() => setOpen(false)}
            >
              Admin portal
            </Link>
            <Link
              to="/dispatcher"
              className="auth-demo-dropdown-item auth-demo-dropdown-item--accent"
              onClick={() => setOpen(false)}
            >
              Dispatcher portal
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export function AuthBrandPanel() {
  return (
    <div className="auth-brand-panel">
      <div
        className="auth-brand-panel-bg"
        aria-hidden
        style={{ '--auth-brand-photo': `url(${signupImage})` }}
      />
      <div className="auth-brand-content auth-brand-content--centered">
        <div className="auth-logo-row">
          <span className="auth-logo-icon">
            <Siren size={44} strokeWidth={1.75} />
          </span>
          <div>
            <span className="auth-logo-text">RESQ</span>
            <span className="auth-logo-sub">Vigilant Sentinel</span>
          </div>
        </div>
        <h2 className="auth-brand-headline">
          Precision response starts with secure{' '}
          <span className="auth-brand-accent">intelligence</span>.
        </h2>
        <p className="auth-brand-desc">
          Join the elite network of emergency response professionals powered by the highest AI
          intelligence systems.
        </p>
      </div>
    </div>
  )
}

export function AuthStatusFooter() {
  return (
    <footer className="auth-status-footer">
      <span>Secure node // RNP command context</span>
      <span className="auth-status-footer-right">
        Encryption active <span className="auth-status-sep">|</span>
        <span className="auth-status-ok">System status: nominal</span>
      </span>
    </footer>
  )
}

export function AuthFormFooter() {
  return (
    <div className="auth-form-mini-footer">
      <span className="flex items-center gap-1.5">
        <ShieldCheck size={14} strokeWidth={2} aria-hidden />
        Secured by RESQ
      </span>
      <span>
        <a href="#">Privacy policy</a>
        <span className="mx-2 opacity-40">|</span>
        <a href="#">Terms of service</a>
      </span>
    </div>
  )
}

export function AuthTabs({ active }) {
  return (
    <div className="auth-tabs">
      <Link to="/login" className={`auth-tab${active === 'login' ? ' auth-tab--active' : ''}`}>
        Authentication
      </Link>
      <Link to="/register" className={`auth-tab${active === 'register' ? ' auth-tab--active' : ''}`}>
        Registration
      </Link>
    </div>
  )
}

export function PasswordStrength({ password }) {
  const score = !password ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3
  const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong'
  return (
    <div className="auth-pw-strength">
      <div className="auth-pw-bars">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`auth-pw-bar${i <= score ? ' auth-pw-bar--on' : ''}`} />
        ))}
      </div>
      <span className="auth-pw-label">{label}</span>
    </div>
  )
}

export function PrimaryButton({ children, type = 'button', onClick, to, showArrow = true }) {
  const className = 'auth-primary-btn'
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
        {showArrow && <ArrowRight size={16} />}
      </Link>
    )
  }
  return (
    <button type={type} onClick={onClick} className={className}>
      {children}
      {showArrow && <ArrowRight size={16} />}
    </button>
  )
}

export function AuthField({ label, children, className = '' }) {
  return (
    <label className={`auth-field ${className}`}>
      <span className="auth-field-label">{label}</span>
      {children}
    </label>
  )
}

export function AuthInput(props) {
  return <input className="auth-input" {...props} />
}

export function AuthSelect({ children, ...props }) {
  return <select className="auth-input auth-select" {...props}>{children}</select>
}
