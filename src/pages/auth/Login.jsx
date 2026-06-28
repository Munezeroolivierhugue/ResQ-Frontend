import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthSplitLayout from '../../components/auth/AuthSplitLayout'
import {
  AuthTabs,
  AuthField,
  AuthInput,
  PrimaryButton,
  DemoPortalDropdown,
} from '../../components/auth/AuthShared'
import { getDemoRole, getPortalForRole, setSession, navigatePortal } from '../../utils/authSession'
import { login } from '../../api/auth'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deviceRecognized] = useState(
    () => sessionStorage.getItem('resq-trusted-device') === 'true',
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Demo mode: no credentials entered, demo role already set via dropdown
    if (!email && !password) {
      const role = getDemoRole()
      if (role) {
        navigate(getPortalForRole(role))
        return
      }
    }

    if (deviceRecognized && !email) {
      navigate(getPortalForRole(getDemoRole()))
      return
    }

    setLoading(true)
    try {
      const result = await login(email, password)

      if (result.mfaRequired) {
        sessionStorage.setItem('resq-login-email', email)
        if (result.challengeToken) {
          sessionStorage.setItem('resq-challenge-token', result.challengeToken)
        }
        navigate('/login/mfa')
        return
      }

      setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: result.user ?? null,
      })

      const role = result.user?.role
      if (role) {
        const roleMap = {
          DISPATCHER: 'dispatcher',
          FIELD_RESPONDER: 'field_responder',
          OPERATIONS_MANAGER: 'ops_manager',
          OPS_MANAGER: 'ops_manager',
          DISTRICT_COMMANDER: 'district_commander',
          EMERGENCY_PLANNER: 'emergency_planner',
          ANALYST: 'analyst',
          SUPER_ADMIN: 'super_admin',
        }
        const mapped = roleMap[role] ?? role.toLowerCase()
        navigatePortal(mapped, navigate)
      } else {
        navigate('/login/mfa')
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Login failed. Check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout showTabs={<AuthTabs active="login" />}>
      <h1 className="auth-form-title">Command access</h1>
      <p className="auth-form-subtitle">
        Authenticate with your provisioned credentials for the RESQ ecosystem.
      </p>

      {deviceRecognized && (
        <div className="auth-banner auth-banner--ok">
          Trusted device recognized on this terminal. MFA step may be skipped for this session.
        </div>
      )}

      {error && (
        <div className="auth-banner auth-banner--error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form-grid">
        <AuthField label="Professional email" className="auth-field--full">
          <AuthInput
            type="email"
            placeholder="j.doe@agency.gov"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </AuthField>
        <AuthField label="Access key" className="auth-field--full">
          <AuthInput
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </AuthField>

        <div className="auth-field--full auth-login-demo">
          <span className="auth-login-demo-label">Demo portal access</span>
          <DemoPortalDropdown inline />
        </div>

        <div className="auth-field--full flex justify-between items-center text-[12px]">
          <label className="flex items-center gap-2 cursor-pointer text-(--text-secondary)">
            <input type="checkbox" defaultChecked={deviceRecognized} />
            Remember this device
          </label>
          <a href="#" className="auth-recover-link">
            Recover access
          </a>
        </div>

        <div className="auth-field--full">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? 'Authorizing…' : 'Authorize terminal'}
          </PrimaryButton>
        </div>
      </form>
    </AuthSplitLayout>
  )
}
