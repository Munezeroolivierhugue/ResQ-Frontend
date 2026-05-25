import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Copy, CheckCircle, Users } from 'lucide-react'
import { ASSIGNED_ROLES, mockInvitedUsers } from '../../data/mockAuthData'
import FieldLabel from '../../components/ui/FieldLabel'

const RECENT_LIMIT = 5

function RecentProvisionedPanel() {
  const recent = [...mockInvitedUsers]
    .sort((a, b) => (b.invitedAt > a.invitedAt ? 1 : -1))
    .slice(0, RECENT_LIMIT)

  if (recent.length === 0) {
    return (
      <aside className="dispatcher-surface admin-provision-recent">
        <h2 className="admin-provision-recent-title">Recently provisioned</h2>
        <div className="admin-provision-empty">
          <Users size={32} className="admin-provision-empty-icon" aria-hidden />
          <p className="text-[13px] m-0">No users provisioned yet.</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="dispatcher-surface admin-provision-recent">
      <h2 className="admin-provision-recent-title">Recently provisioned</h2>
      <div className="admin-provision-recent-list">
        {recent.map((u) => {
          const roleLabel = ASSIGNED_ROLES.find((r) => r.value === u.role)?.label || u.role
          const statusLabel = u.status === 'active' ? 'Active' : 'Pending'
          return (
            <div key={u.id} className="admin-provision-recent-row">
              <div className="min-w-0">
                <p className="admin-provision-recent-name">{u.fullName}</p>
                <p className="admin-provision-recent-meta">{u.email}</p>
              </div>
              <div className="admin-provision-recent-badges">
                <span className="admin-provision-role-badge">{roleLabel}</span>
                <span
                  className={`admin-provision-status-badge admin-provision-status-badge--${u.status}`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <Link
        to="/admin/users"
        className="inline-flex mt-4 text-[12px] font-semibold text-(--accent) no-underline hover:underline"
      >
        View all provisioned users →
      </Link>
    </aside>
  )
}

export default function AdminInviteUser() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'dispatcher',
  })
  const [sent, setSent] = useState(null)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const inviteLink = sent
    ? `${window.location.origin}/register?invite=1&email=${encodeURIComponent(sent.email)}`
    : ''

  const handleSubmit = (e) => {
    e.preventDefault()
    sessionStorage.setItem('resq-invite-email', form.email)
    sessionStorage.setItem('resq-invite-name', form.fullName)
    sessionStorage.setItem('resq-invite-phone', form.phone)
    sessionStorage.setItem('resq-invite-role', form.role)
    sessionStorage.setItem('resq-demo-role', form.role)
    setSent({ ...form })
  }

  const copyLink = () => {
    navigator.clipboard?.writeText(inviteLink)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        Create user & send invitation
      </h1>
      <p className="text-[13px] text-(--text-secondary) m-0 mb-6">
        Super admin provisions accounts. The user completes registration, password, and MFA via the
        invitation link (UI simulation only).
      </p>

      <div className="admin-provision-layout">
        <div className="admin-provision-form">
          {sent ? (
            <div className="rounded-xl border border-(--border) bg-(--bg-surface) p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle size={22} className="text-(--status-low) shrink-0" />
                <div>
                  <div className="font-bold text-(--text-primary)">Invitation dispatched</div>
                  <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
                    {sent.fullName} ({sent.email}) will receive a link to create their command profile.
                  </p>
                </div>
              </div>
              <FieldLabel className="mb-1.5">Mock invitation link</FieldLabel>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 h-10 rounded-lg px-3 text-[12px] bg-(--bg-input) border border-(--border) text-(--text-primary)"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="h-10 px-3 rounded-lg border border-(--border) bg-(--bg-elevated) cursor-pointer flex items-center gap-1.5 text-[12px] font-semibold text-(--text-primary)"
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>
              <Link
                to={`/register?invite=1&email=${encodeURIComponent(sent.email)}`}
                className="inline-flex mt-4 text-[13px] font-semibold text-(--accent) no-underline hover:underline"
              >
                Open registration as invited user →
              </Link>
              <button
                type="button"
                onClick={() => setSent(null)}
                className="block mt-4 text-[12px] text-(--text-muted) bg-transparent border-none cursor-pointer hover:text-(--text-primary)"
              >
                Invite another user
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-(--border) bg-(--bg-surface) p-5 shadow-[var(--shadow-card)] space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="auth-field">
                  <span className="auth-field-label">Full name</span>
                  <input
                    className="auth-input"
                    placeholder="Jean Bosco Nkurunziza"
                    value={form.fullName}
                    onChange={(e) => set('fullName', e.target.value)}
                    required
                  />
                </label>
                <label className="auth-field">
                  <span className="auth-field-label">Professional email</span>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="j.bosco@rnp.gov.rw"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    required
                  />
                </label>
                <label className="auth-field">
                  <span className="auth-field-label">Phone number</span>
                  <input
                    type="tel"
                    className="auth-input"
                    placeholder="+250 788 123 456"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    required
                  />
                </label>
                <label className="auth-field">
                  <span className="auth-field-label">Assigned role</span>
                  <select
                    className="auth-input auth-select"
                    value={form.role}
                    onChange={(e) => set('role', e.target.value)}
                  >
                    {ASSIGNED_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="submit"
                className="auth-primary-btn"
                style={{ width: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
              >
                <Send size={16} />
                Send invitation link
              </button>
            </form>
          )}
        </div>

        <RecentProvisionedPanel />
      </div>
    </div>
  )
}
