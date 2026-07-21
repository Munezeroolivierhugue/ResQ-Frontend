import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Send, Check, ArrowLeft } from 'lucide-react'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { getCurrentUser } from '../../utils/authSession'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import api from '../../lib/apiClient'

const ALLOWED_ROLES = [
  { value: 'FIELD_RESPONDER',    label: 'Field Responder' },
  { value: 'OPERATIONS_MANAGER', label: 'Operations Manager' },
]

function validate(form) {
  const errs = {}
  if (!form.fullName.trim())                errs.fullName = 'Full name is required'
  if (!form.email.trim())                   errs.email    = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address'
  if (!form.role)                           errs.role     = 'Select a role'
  return errs
}

export default function DCCreateUser() {
  const currentUser = getCurrentUser()
  const districtId   = currentUser?.district_id || null
  const districtName = getDistrictCommanderDistrict() || 'Your District'

  const [form, setForm]     = useState({ fullName: '', email: '', phone: '', role: 'FIELD_RESPONDER' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [serverError, setServerError] = useState(null)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
    setServerError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setServerError(null)
    try {
      await api.post('/api/users/district-provision', {
        fullName:   form.fullName.trim(),
        email:      form.email.trim(),
        phone:      form.phone.trim() || null,
        role:       form.role,
        districtId: districtId || undefined,
      })
      setSuccess({ name: form.fullName.trim(), email: form.email.trim(), role: form.role })
      setForm({ fullName: '', email: '', phone: '', role: 'FIELD_RESPONDER' })
    } catch (err) {
      const msg = err?.response?.data?.message
      if (msg?.includes('EMAIL_TAKEN') || msg?.includes('already registered')) {
        setErrors(e => ({ ...e, email: 'This email is already registered in the system' }))
      } else {
        setServerError(msg || 'Failed to create user. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="portal-page flex flex-col gap-6 max-w-2xl">
      <Link to="/district-commander/users" className="text-[12px] font-semibold inline-flex items-center gap-1.5 no-underline text-(--text-secondary) hover:text-(--accent)">
        <ArrowLeft size={14} />
        Back to Users
      </Link>

      <DCPageHeader
        title="Invite User"
        eyebrow="District Commander"
        subtitle={`Provision Field Responders and Operations Managers for ${districtName}.`}
      />

      {success && (
        <div className="dispatcher-surface p-4 flex items-start gap-3"
          style={{ background: 'var(--status-low-bg)', border: '1px solid var(--status-low)' }}>
          <Check size={20} style={{ color: 'var(--status-low)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div className="font-bold text-[13px]" style={{ color: 'var(--status-low)' }}>
              User provisioned successfully
            </div>
            <p className="text-[12px] text-(--text-secondary) m-0 mt-1">
              An invitation link has been sent to <strong>{success.email}</strong>. Once{' '}
              <strong>{success.name}</strong> clicks the link they can set their password and log in as{' '}
              <strong>{ALLOWED_ROLES.find(r => r.value === success.role)?.label}</strong>.
            </p>
            <div className="flex gap-4 mt-2">
              <button type="button"
                className="text-[12px] font-semibold bg-transparent border-0 p-0 cursor-pointer"
                style={{ color: 'var(--accent)' }}
                onClick={() => setSuccess(null)}>
                + Add another user
              </button>
              <Link to="/district-commander/users" className="text-[12px] font-semibold no-underline" style={{ color: 'var(--accent)' }}>
                View all users →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="dispatcher-surface p-6">
        <div className="flex items-center gap-2 mb-5">
          <UserPlus size={16} style={{ color: 'var(--accent)' }} />
          <span className="font-semibold text-[14px]">New User Details</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* District (read-only) */}
          <div className="dispatcher-field">
            <span className="field-label">District (auto-assigned)</span>
            <div className="dispatcher-input text-[12px] flex items-center h-9 px-3 cursor-not-allowed opacity-60">
              {districtName}
            </div>
          </div>

          {/* Role */}
          <div className="dispatcher-field">
            <label className="field-label" htmlFor="dc-role">Role *</label>
            <select
              id="dc-role"
              className="dispatcher-input text-[13px] h-9 px-3"
              value={form.role}
              onChange={e => set('role', e.target.value)}
            >
              {ALLOWED_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.role && <span className="text-[11px]" style={{ color: 'var(--status-critical)' }}>{errors.role}</span>}
          </div>

          {/* Full Name */}
          <div className="dispatcher-field">
            <label className="field-label" htmlFor="dc-name">Full Name *</label>
            <input
              id="dc-name"
              className="dispatcher-input text-[13px] h-9 px-3"
              placeholder="e.g. Jean Paul Habimana"
              value={form.fullName}
              onChange={e => set('fullName', e.target.value)}
            />
            {errors.fullName && <span className="text-[11px]" style={{ color: 'var(--status-critical)' }}>{errors.fullName}</span>}
          </div>

          {/* Email */}
          <div className="dispatcher-field">
            <label className="field-label" htmlFor="dc-email">Email Address *</label>
            <input
              id="dc-email"
              type="email"
              className="dispatcher-input text-[13px] h-9 px-3"
              placeholder="e.g. j.habimana@rnp.gov.rw"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
            {errors.email && <span className="text-[11px]" style={{ color: 'var(--status-critical)' }}>{errors.email}</span>}
          </div>

          {/* Phone */}
          <div className="dispatcher-field">
            <label className="field-label" htmlFor="dc-phone">Phone Number (optional)</label>
            <input
              id="dc-phone"
              type="tel"
              className="dispatcher-input text-[13px] h-9 px-3"
              placeholder="+250 788 000 000"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
            />
          </div>

          {serverError && (
            <div className="text-[12px] px-3 py-2 rounded"
              style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}>
              {serverError}
            </div>
          )}

          <div className="pt-2 border-t border-(--border-subtle) flex gap-3 items-center">
            <button type="submit" disabled={submitting}
              className="dispatcher-btn-primary inline-flex items-center gap-2 text-[13px]">
              {submitting ? 'Sending invitation…' : <><Send size={14} />Send Invitation</>}
            </button>
            <p className="text-[11px] text-(--text-muted) m-0">
              A secure invitation link will be emailed to the user. They must click it to activate their account.
            </p>
          </div>
        </form>
      </div>

      <div className="dispatcher-surface p-4 text-[12px] text-(--text-secondary)">
        <strong className="text-(--text-primary)">Note:</strong> As District Commander you can provision{' '}
        <strong>Field Responders</strong> and <strong>Operations Managers</strong> for{' '}
        <strong>{districtName}</strong> only. To create other roles, contact the Super Admin.
      </div>
    </div>
  )
}
