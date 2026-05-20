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

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [deviceRecognized] = useState(
    () => sessionStorage.getItem('resq-trusted-device') === 'true',
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (deviceRecognized) {
      const role = sessionStorage.getItem('resq-demo-role') || 'dispatcher'
      navigate(role === 'admin' ? '/admin' : '/dispatcher')
      return
    }
    sessionStorage.setItem('resq-login-email', email || 'user@rnp.gov.rw')
    navigate('/login/mfa')
  }

  return (
    <AuthSplitLayout showTabs={<AuthTabs active="login" />}>
      <h1 className="auth-form-title">Command access</h1>
      <p className="auth-form-subtitle">
        Authenticate with your provisioned credentials for the RESQ-AI ecosystem.
      </p>

      {deviceRecognized && (
        <div className="auth-banner auth-banner--ok">
          Trusted device recognized on this terminal. MFA step may be skipped for this session.
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form-grid">
        <AuthField label="Professional email" className="auth-field--full">
          <AuthInput
            type="email"
            placeholder="j.doe@agency.gov"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </AuthField>
        <AuthField label="Access key" className="auth-field--full">
          <AuthInput
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </AuthField>

        <div className="auth-field--full auth-login-demo">
          <span className="auth-login-demo-label">Demo portal access</span>
          <DemoPortalDropdown inline />
        </div>

        <div className="auth-field--full flex justify-between items-center text-[12px]">
          <label className="flex items-center gap-2 cursor-pointer text-(--text-secondary)">
            <input type="checkbox" className="accent-(--accent)" defaultChecked={deviceRecognized} />
            Remember this device
          </label>
          <a href="#" className="text-(--accent) font-semibold no-underline hover:underline">
            Recover access
          </a>
        </div>

        <div className="auth-field--full">
          <PrimaryButton type="submit">Authorize terminal</PrimaryButton>
        </div>
      </form>
    </AuthSplitLayout>
  )
}
