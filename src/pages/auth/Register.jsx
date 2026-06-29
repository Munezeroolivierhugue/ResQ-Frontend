import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, User, Mail, Shield } from 'lucide-react'
import AuthSplitLayout from '../../components/auth/AuthSplitLayout'
import {
  AuthTabs,
  AuthField,
  AuthInput,
  PrimaryButton,
  PasswordStrength,
} from '../../components/auth/AuthShared'
import { getInviteInfo, acceptInvite, login } from '../../api/auth'
import { setSession } from '../../utils/authSession'

const SESSION_KEY = 'resq-invite-token'

const ROLE_LABELS = {
  DISPATCHER: 'Dispatcher',
  FIELD_RESPONDER: 'Field Responder',
  OPERATIONS_MANAGER: 'Operations Manager',
  DISTRICT_COMMANDER: 'District Commander',
  EMERGENCY_PLANNER: 'Emergency Planner',
  ANALYST: 'Analyst',
  SUPER_ADMIN: 'Super Admin',
}

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // Read token from URL → store in sessionStorage → strip from URL bar
  const [token] = useState(() => {
    const urlToken = params.get('token')
    if (urlToken) {
      sessionStorage.setItem(SESSION_KEY, urlToken)
      window.history.replaceState({}, '', '/register')
      return urlToken
    }
    return sessionStorage.getItem(SESSION_KEY) || ''
  })

  const [inviteInfo, setInviteInfo] = useState(null)  // { fullName, email, role }
  const [infoLoading, setInfoLoading] = useState(!!token)
  const [infoError, setInfoError] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordsMatch = !confirmPassword || password === confirmPassword
  const canSubmit = password.length >= 8 && passwordsMatch && !loading && !infoLoading

  // Fetch invite info to auto-fill name / email / role
  useEffect(() => {
    if (!token) return
    let cancelled = false
    getInviteInfo(token)
      .then((info) => {
        if (!cancelled) setInviteInfo(info)
      })
      .catch((err) => {
        if (!cancelled) {
          const status = err?.response?.status
          const msg = err?.response?.data?.message
          if (status === 400) {
            setInfoError(msg || 'This invitation link is invalid or has already been used.')
          } else if (status === 500 || !status) {
            setInfoError('Server error. Please try again in a moment or contact your administrator.')
          } else {
            setInfoError(msg || 'Could not load invitation details. Please try again.')
          }
        }
      })
      .finally(() => { if (!cancelled) setInfoLoading(false) })
    return () => { cancelled = true }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      await acceptInvite(token, password)
      sessionStorage.removeItem(SESSION_KEY)

      // Auto-login then go straight to MFA setup
      const email = inviteInfo?.email
      const result = await login(email, password)
      setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: result.user ?? null,
      })
      const role = result.user?.role
      navigate(role === 'FIELD_RESPONDER' ? '/fr/mfa-setup' : '/mfa-setup', { replace: true })
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to activate account. The link may have expired — ask your administrator for a new invitation.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ── No token: invitation required ─────────────────────────────────────────
  if (!token) {
    return (
      <AuthSplitLayout showTabs={<AuthTabs active="register" />}>
        <h1 className="auth-form-title">Invitation required</h1>
        <p className="auth-form-subtitle">
          Access to the RESQ ecosystem is provisioned by invitation only. Please use the
          secure link sent to your registered email address.
        </p>
        <div className="auth-banner" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          No invitation token found. Contact your RESQ administrator to receive an invite.
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <PrimaryButton to="/login">Back to login</PrimaryButton>
        </div>
      </AuthSplitLayout>
    )
  }

  // ── Invalid / expired / already-used token ─────────────────────────────────
  if (!infoLoading && infoError) {
    return (
      <AuthSplitLayout showTabs={<AuthTabs active="register" />}>
        <h1 className="auth-form-title">Link invalid or expired</h1>
        <p className="auth-form-subtitle">{infoError}</p>
        <div className="auth-banner auth-banner--error" style={{ marginBottom: '1.5rem' }}>
          Invitation links expire after 48 hours and can only be used once. Please ask your
          RESQ administrator to send a new invitation.
        </div>
        <PrimaryButton to="/login">Back to login</PrimaryButton>
      </AuthSplitLayout>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <AuthSplitLayout showTabs={<AuthTabs active="register" />}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
        <ShieldCheck size={22} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
          Secure account setup
        </span>
      </div>

      <h1 className="auth-form-title">Create command profile</h1>
      <p className="auth-form-subtitle">
        {infoLoading
          ? 'Loading your invitation details…'
          : `Welcome, ${inviteInfo?.fullName ?? 'new user'}. Create a password to activate your RESQ account.`}
      </p>

      {/* Auto-filled info from backend */}
      {!infoLoading && inviteInfo && (
        <div className="auth-banner" style={{ borderColor: 'var(--border)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <User size={13} style={{ flexShrink: 0 }} />
            <strong>{inviteInfo.fullName}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Mail size={13} style={{ flexShrink: 0 }} />
            <span>{inviteInfo.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Shield size={13} style={{ flexShrink: 0 }} />
            <span>{ROLE_LABELS[inviteInfo.role] ?? inviteInfo.role}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="auth-banner auth-banner--error">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="auth-form-grid">
        <AuthField label="New password" className="auth-field--full">
          <div style={{ position: 'relative' }}>
            <AuthInput
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={infoLoading}
              style={{ paddingRight: '36px' }}
            />
            <button type="button" onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 0 }}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <PasswordStrength password={password} />
          {password.length > 0 && password.length < 8 && (
            <span className="auth-field-error">Minimum 8 characters required</span>
          )}
        </AuthField>

        <AuthField label="Confirm password" className="auth-field--full">
          <div style={{ position: 'relative' }}>
            <AuthInput
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={infoLoading}
              style={{ paddingRight: '36px' }}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 0 }}>
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {!passwordsMatch && (
            <span className="auth-field-error">Passwords do not match</span>
          )}
        </AuthField>

        <div className="auth-field--full">
          <PrimaryButton type="submit" disabled={!canSubmit}>
            {loading ? 'Activating account…' : 'Activate account'}
          </PrimaryButton>
        </div>
      </form>
    </AuthSplitLayout>
  )
}
