import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Send,
  Copy,
  CheckCircle,
  Users,
  User,
  Mail,
  Phone,
  Shield,
  MapPin,
  ExternalLink,
  UserPlus,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react'
import { ASSIGNED_ROLES, mockInvitedUsers } from '../../data/mockAuthData'
import FieldLabel from '../../components/ui/FieldLabel'

const RECENT_LIMIT = 5

const ROLES_REQUIRING_DISTRICT = ['ops_manager', 'district_commander', 'emergency_planner']

const RWANDA_DISTRICT_GROUPS = [
  {
    label: '── Kigali City ──',
    districts: ['Nyarugenge', 'Kicukiro', 'Gasabo'],
  },
  {
    label: '── Northern Province ──',
    districts: ['Musanze', 'Burera', 'Gakenke', 'Rulindo', 'Gicumbi'],
  },
  {
    label: '── Southern Province ──',
    districts: ['Huye', 'Nyamagabe', 'Gisagara', 'Nyaruguru', 'Muhanga', 'Kamonyi', 'Ruhango', 'Nyanza'],
  },
  {
    label: '── Eastern Province ──',
    districts: ['Rwamagana', 'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare'],
  },
  {
    label: '── Western Province ──',
    districts: ['Rubavu', 'Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rusizi', 'Rutsiro'],
  },
]

function roleRequiresDistrict(role) {
  return ROLES_REQUIRING_DISTRICT.includes(role)
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getAvatarColor(name) {
  const colors = [
    '#2196C8', '#879D1F', '#9B4DCA', '#E8354A',
    '#F07820', '#3DAA6A', '#D4A017', '#5A6478',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function RecentProvisionedPanel() {
  const recent = [...mockInvitedUsers]
    .sort((a, b) => (b.invitedAt > a.invitedAt ? 1 : -1))
    .slice(0, RECENT_LIMIT)

  if (recent.length === 0) {
    return (
      <aside className="aiu-panel">
        <div className="aiu-panel-header">
          <Users size={16} className="aiu-panel-header-icon" />
          <h2 className="aiu-panel-title">Recently Provisioned</h2>
        </div>
        <div className="aiu-empty">
          <div className="aiu-empty-icon-wrap">
            <Users size={28} aria-hidden />
          </div>
          <p className="aiu-empty-text">No users provisioned yet.</p>
          <p className="aiu-empty-sub">Invited users will appear here after dispatch.</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="aiu-panel">
      <div className="aiu-panel-header">
        <Users size={16} className="aiu-panel-header-icon" />
        <h2 className="aiu-panel-title">Recently Provisioned</h2>
        <span className="aiu-panel-count">{recent.length}</span>
      </div>
      <div className="aiu-recent-list">
        {recent.map((u) => {
          const roleLabel = ASSIGNED_ROLES.find((r) => r.value === u.role)?.label || u.role
          const isActive = u.status === 'active'
          const color = getAvatarColor(u.fullName)
          return (
            <div key={u.id} className="aiu-recent-row">
              <div
                className="aiu-avatar"
                style={{ background: color + '22', color }}
              >
                {getInitials(u.fullName)}
              </div>
              <div className="aiu-recent-info">
                <p className="aiu-recent-name">{u.fullName}</p>
                <p className="aiu-recent-email">{u.email}</p>
              </div>
              <div className="aiu-recent-badges">
                <span className="aiu-role-badge">{roleLabel}</span>
                <span className={`aiu-status-badge aiu-status-badge--${u.status}`}>
                  {isActive ? 'Active' : 'Pending'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <Link to="/admin/users" className="aiu-view-all">
        View all provisioned users
        <ArrowRight size={13} />
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
    district: '',
  })
  const [sent, setSent] = useState(null)
  const [copied, setCopied] = useState(false)
  const [districtError, setDistrictError] = useState('')

  const showDistrictField = roleRequiresDistrict(form.role)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleRoleChange = (role) => {
    setDistrictError('')
    setForm((f) => ({
      ...f,
      role,
      district: roleRequiresDistrict(role) ? f.district : '',
    }))
  }

  const inviteLink = sent
    ? `${window.location.origin}/register?invite=1&email=${encodeURIComponent(sent.email)}`
    : ''

  const handleSubmit = (e) => {
    e.preventDefault()
    if (showDistrictField && !form.district) {
      setDistrictError('Please assign a district for this role.')
      return
    }
    const payload = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      role: form.role,
      ...(showDistrictField ? { district: form.district } : {}),
    }
    console.log('Invitation payload:', payload)
    sessionStorage.setItem('resq-invite-email', form.email)
    sessionStorage.setItem('resq-invite-name', form.fullName)
    sessionStorage.setItem('resq-invite-phone', form.phone)
    sessionStorage.setItem('resq-invite-role', form.role)
    sessionStorage.setItem('resq-demo-role', form.role)
    if (payload.district) {
      sessionStorage.setItem('resq-invite-district', payload.district)
    } else {
      sessionStorage.removeItem('resq-invite-district')
    }
    setSent(payload)
  }

  const copyLink = () => {
    navigator.clipboard?.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const roleLabel = ASSIGNED_ROLES.find((r) => r.value === form.role)?.label || form.role

  return (
    <div className="portal-page aiu-root">
      {/* ── Page header ── */}
      <div className="aiu-page-header">
        <div className="aiu-page-header-icon">
          <UserPlus size={20} />
        </div>
        <div>
          <h1 className="aiu-page-title">Create User &amp; Send Invitation</h1>
          <p className="aiu-page-sub">
            Super admin provisions accounts. Users complete registration via the invitation link.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* ── Top: Form / Success ── */}
        <div className="w-full">
          {sent ? (
            /* ── Success state ── */
            <div className="aiu-success-card">
              <div className="aiu-success-glow" />
              <div className="aiu-success-top">
                <div className="aiu-success-icon">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <div className="aiu-success-title">Invitation Dispatched!</div>
                  <p className="aiu-success-desc">
                    An invitation link has been generated for{' '}
                    <strong>{sent.fullName}</strong>.
                  </p>
                </div>
              </div>

              <div className="aiu-success-meta">
                <div className="aiu-success-meta-row">
                  <Mail size={13} className="aiu-success-meta-icon" />
                  <span>{sent.email}</span>
                </div>
                {sent.district && (
                  <div className="aiu-success-meta-row">
                    <MapPin size={13} className="aiu-success-meta-icon" />
                    <span>District: {sent.district}</span>
                  </div>
                )}
                <div className="aiu-success-meta-row">
                  <Shield size={13} className="aiu-success-meta-icon" />
                  <span>{roleLabel}</span>
                </div>
              </div>

              <div className="aiu-link-section">
                <FieldLabel className="aiu-link-label">Mock Invitation Link</FieldLabel>
                <div className="aiu-link-row">
                  <input
                    readOnly
                    value={inviteLink}
                    className="aiu-link-input"
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className={`aiu-copy-btn ${copied ? 'aiu-copy-btn--copied' : ''}`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="aiu-success-actions">
                <Link
                  to={`/register?invite=1&email=${encodeURIComponent(sent.email)}`}
                  className="aiu-open-reg-link"
                >
                  Open registration as invited user
                  <ExternalLink size={13} />
                </Link>
                <button
                  type="button"
                  onClick={() => { setSent(null); setCopied(false) }}
                  className="aiu-invite-another-btn"
                >
                  <Sparkles size={14} />
                  Invite another user
                </button>
              </div>
            </div>
          ) : (
            /* ── Invitation form ── */
            <form onSubmit={handleSubmit} className="aiu-form-card">
              <div className="aiu-form-card-header">
                <span className="aiu-form-card-eyebrow">New Account Provisioning</span>
                <h2 className="aiu-form-card-title">User Details</h2>
              </div>

              <div className="aiu-form-grid">
                {/* Full name */}
                <label className="aiu-field">
                  <span className="aiu-field-label">Full Name</span>
                  <div className="aiu-input-wrap">
                    <User size={15} className="aiu-input-icon" />
                    <input
                      className="aiu-input aiu-input--icon"
                      placeholder="Jean Bosco Nkurunziza"
                      value={form.fullName}
                      onChange={(e) => set('fullName', e.target.value)}
                      required
                    />
                  </div>
                </label>

                {/* Email */}
                <label className="aiu-field">
                  <span className="aiu-field-label">Professional Email</span>
                  <div className="aiu-input-wrap">
                    <Mail size={15} className="aiu-input-icon" />
                    <input
                      type="email"
                      className="aiu-input aiu-input--icon"
                      placeholder="j.bosco@rnp.gov.rw"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      required
                    />
                  </div>
                </label>

                {/* Phone */}
                <label className="aiu-field">
                  <span className="aiu-field-label">Phone Number</span>
                  <div className="aiu-input-wrap">
                    <Phone size={15} className="aiu-input-icon" />
                    <input
                      type="tel"
                      className="aiu-input aiu-input--icon"
                      placeholder="+250 788 123 456"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      required
                    />
                  </div>
                </label>

                {/* Role */}
                <label className="aiu-field">
                  <span className="aiu-field-label">Assigned Role</span>
                  <div className="aiu-input-wrap">
                    <Shield size={15} className="aiu-input-icon" />
                    <select
                      className="aiu-input aiu-input--icon aiu-select"
                      value={form.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                    >
                      {ASSIGNED_ROLES.filter((r) => r.value !== 'admin' && r.value !== 'super_admin').map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>

              {/* District field — animated reveal */}
              <div
                aria-hidden={!showDistrictField}
                className="aiu-district-reveal"
                style={{
                  maxHeight: showDistrictField ? '140px' : 0,
                  opacity: showDistrictField ? 1 : 0,
                  marginTop: showDistrictField ? '1rem' : 0,
                  overflow: 'hidden',
                  transition: 'max-height 250ms ease, opacity 250ms ease, margin-top 250ms ease',
                }}
              >
                <label className="aiu-field">
                  <span className="aiu-field-label">Assigned District</span>
                  <div className="aiu-input-wrap">
                    <MapPin size={15} className="aiu-input-icon" />
                    <select
                      className="aiu-input aiu-input--icon aiu-select"
                      value={form.district}
                      onChange={(e) => {
                        setDistrictError('')
                        set('district', e.target.value)
                      }}
                      required={showDistrictField}
                    >
                      <option value="">Select district…</option>
                      {RWANDA_DISTRICT_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.districts.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <p className="aiu-field-hint">
                    This district will filter all data visible to this user after login.
                  </p>
                  {districtError && (
                    <p className="aiu-field-error">{districtError}</p>
                  )}
                </label>
              </div>

              <div className="aiu-form-footer">
                <button type="submit" className="aiu-submit-btn">
                  <Send size={16} />
                  Send Invitation Link
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Bottom: Recent provisioned ── */}
        <div className="w-full">
          <RecentProvisionedPanel />
        </div>
      </div>
    </div>
  )
}
