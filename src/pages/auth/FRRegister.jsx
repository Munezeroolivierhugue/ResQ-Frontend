import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Siren, User, Mail, Hash, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import { setDemoRole } from '../../utils/authSession'
import { PasswordStrength } from '../../components/auth/AuthShared'
import FRAuthShell from '../../components/auth/FRAuthShell'

export default function FRRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', responderId: '', phone: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const passwordsMatch = !form.confirmPassword || form.password === form.confirmPassword

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!passwordsMatch) return
    setDemoRole('field_responder')
    sessionStorage.setItem('resq-register-email', form.email)
    sessionStorage.setItem('resq-demo-role', 'field_responder')
    navigate('/fr/verify-otp')
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
          <h2 className="fr-auth-card-title">Register Field Responder</h2>
          <p className="fr-auth-card-sub" style={{ marginBottom: '0.85rem' }}>Create your secure responder account</p>

          <form onSubmit={handleSubmit} className="fr-auth-form" style={{ gap: '0.7rem' }}>
            {[
              { k: 'full_name', label: 'Full Name', icon: User, placeholder: 'John Doe', type: 'text' },
              { k: 'email', label: 'Professional Email', icon: Mail, placeholder: 'j.doe@agency.gov', type: 'email' },
              { k: 'responderId', label: 'Responder ID', icon: Hash, placeholder: 'FR-00000', type: 'text' },
              { k: 'phone', label: 'Phone Number', icon: Phone, placeholder: '+250 788 000 000', type: 'tel' },
            ].map(({ k, label, icon: Icon, placeholder, type }) => (
              <div key={k} className="fr-auth-field">
                <label className="fr-auth-field-label">{label}</label>
                <div className="fr-auth-input-wrap">
                  <Icon size={16} className="fr-auth-input-icon" />
                  <input type={type} className="fr-auth-input" placeholder={placeholder} value={form[k]} onChange={e => set(k, e.target.value)} required />
                </div>
              </div>
            ))}

            {/* Password */}
            <div className="fr-auth-field">
              <label className="fr-auth-field-label">Password</label>
              <div className="fr-auth-input-wrap">
                <Lock size={16} className="fr-auth-input-icon" />
                <input type={showPass ? 'text' : 'password'} className="fr-auth-input fr-auth-input--pr" placeholder="••••••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
                <button type="button" className="fr-auth-eye" onClick={() => setShowPass(v => !v)} aria-label="Toggle password">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirm */}
            <div className="fr-auth-field">
              <label className="fr-auth-field-label">Confirm Password</label>
              <div className="fr-auth-input-wrap">
                <Lock size={16} className="fr-auth-input-icon" />
                <input type={showConfirm ? 'text' : 'password'} className="fr-auth-input fr-auth-input--pr" placeholder="••••••••••••" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
                <button type="button" className="fr-auth-eye" onClick={() => setShowConfirm(v => !v)} aria-label="Toggle confirm">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!passwordsMatch && <span className="fr-auth-error">Passwords do not match</span>}
            </div>

            <button type="submit" className="fr-auth-btn fr-auth-btn--primary fr-auth-btn--full">
              CREATE ACCOUNT
            </button>
          </form>
        </div>

        <p className="fr-auth-footer">Secured by RESQ</p>
      </div>
    </FRAuthShell>
  )
}
