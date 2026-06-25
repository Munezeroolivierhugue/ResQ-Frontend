import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AuthSplitLayout from '../../components/auth/AuthSplitLayout'
import {
  AuthTabs,
  AuthField,
  AuthInput,
  AuthSelect,
  PrimaryButton,
  PasswordStrength,
} from '../../components/auth/AuthShared'
import { ORGANIZATIONS, ASSIGNED_ROLES } from '../../data/mockAuthData'

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const inviteEmail = params.get('email') || sessionStorage.getItem('resq-invite-email') || ''

  const [form, setForm] = useState({
    fullName: sessionStorage.getItem('resq-invite-name') || '',
    email: inviteEmail,
    phone: sessionStorage.getItem('resq-invite-phone') || '',
    organization: sessionStorage.getItem('resq-invite-org') || ORGANIZATIONS[0],
    role: sessionStorage.getItem('resq-invite-role') || 'dispatcher',
    password: '',
    confirmPassword: '',
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const passwordsMatch = !form.confirmPassword || form.password === form.confirmPassword

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!passwordsMatch) return
    sessionStorage.setItem('resq-register-email', form.email)
    sessionStorage.setItem('resq-demo-role', form.role)
    navigate('/verify-otp')
  }

  const isInvite = Boolean(params.get('invite') || inviteEmail)

  return (
    <AuthSplitLayout showTabs={<AuthTabs active="register" />}>
      <h1 className="auth-form-title">Create command profile</h1>
      <p className="auth-form-subtitle">
        {isInvite
          ? 'Complete your profile using the secure invitation issued by RESQ administration.'
          : 'Provision your access credentials for the RESQ-AI ecosystem.'}
      </p>

      {isInvite && (
        <div className="auth-banner auth-banner--info">
          Invitation link verified · email <strong>{inviteEmail || form.email}</strong> is authorized
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form-grid">
        <AuthField label="Full name">
          <AuthInput
            placeholder="Commander John Doe"
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            required
          />
        </AuthField>
        <AuthField label="Professional email">
          <AuthInput
            type="email"
            placeholder="j.doe@agency.gov"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            readOnly={Boolean(inviteEmail)}
            required
          />
        </AuthField>
        <AuthField label="Phone number">
          <AuthInput
            type="tel"
            placeholder="+250 788 000 000"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            required
          />
        </AuthField>

        <AuthField label="Assigned role">
          <AuthSelect value={form.role} onChange={(e) => set('role', e.target.value)}>
            {ASSIGNED_ROLES.filter((r) => r.value !== 'admin' && r.value !== 'super_admin').map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </AuthSelect>
        </AuthField>
        <AuthField label="Access key creation" className="auth-field--full">
          <AuthInput
            type="password"
            placeholder="••••••••••••"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            required
          />
          <PasswordStrength password={form.password} />
        </AuthField>

        <AuthField label="Confirm access key" className="auth-field--full">
          <AuthInput
            type="password"
            placeholder="••••••••••••"
            value={form.confirmPassword}
            onChange={(e) => set('confirmPassword', e.target.value)}
            required
          />
          {!passwordsMatch && (
            <span className="auth-field-error">Access keys do not match</span>
          )}
        </AuthField>

        <div className="auth-field--full">
          <PrimaryButton type="submit">Initialize account</PrimaryButton>
        </div>
      </form>
    </AuthSplitLayout>
  )
}
