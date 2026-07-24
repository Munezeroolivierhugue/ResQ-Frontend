import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Settings, Database, Save, Megaphone, AlertTriangle, Info, ShieldAlert, ChevronDown, Check, Pencil, X, RotateCcw } from 'lucide-react'
import SettingsNavLayout from '../../components/settings/SettingsNavLayout'
import { SettingsGroup } from '../../components/settings/SettingsToggle'
import { getSystemSettings, saveSystemSettings } from '../../api/admin'
import { listAnnouncements, createAnnouncement } from '../../api/announcements'
import { listUsers } from '../../api/users'
import { listRetentionPolicies, updateRetentionPolicy } from '../../api/retention'
import { listBackups, runBackupNow, restoreBackup } from '../../api/backups'
import ConfirmDangerModal from '../../components/admin/ConfirmDangerModal'

const ROLE_OPTIONS = [
  { value: 'DISPATCHER', label: 'Dispatcher' },
  { value: 'FIELD_RESPONDER', label: 'Field Responder' },
  { value: 'OPERATIONS_MANAGER', label: 'Operations Manager' },
  { value: 'DISTRICT_COMMANDER', label: 'District Commander' },
  { value: 'EMERGENCY_PLANNER', label: 'Emergency Planner' },
  { value: 'ANALYST', label: 'Analyst' },
]

const SEVERITY_TONE = {
  INFO:     { color: 'var(--status-info)',     bg: 'var(--status-info-bg)',     Icon: Info },
  WARNING:  { color: 'var(--status-medium)',   bg: 'var(--status-medium-bg)',   Icon: AlertTriangle },
  CRITICAL: { color: 'var(--status-critical)', bg: 'var(--status-critical-bg)', Icon: ShieldAlert },
}

// Closed-by-default multi-select dropdown for role targeting — replaces a
// permanently-visible row of pill buttons with the same open/close +
// outside-click pattern used by FilterDropdown elsewhere in admin.
function RoleMultiSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function toggle(role) {
    onChange(value.includes(role) ? value.filter((r) => r !== role) : [...value, role])
  }

  const label = value.length === 0
    ? 'Select roles…'
    : value.length === ROLE_OPTIONS.length
      ? 'All roles'
      : ROLE_OPTIONS.filter((r) => value.includes(r.value)).map((r) => r.label).join(', ')

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="aiu-input flex items-center justify-between gap-2 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate text-left">{label}</span>
        <ChevronDown size={14} className="text-(--text-muted) shrink-0" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>
      {open && (
        <div
          className="absolute top-[calc(100%+4px)] left-0 z-50 w-full rounded-lg border overflow-hidden"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-dropdown)' }}
        >
          <div className="max-h-56 overflow-y-auto py-1">
            {ROLE_OPTIONS.map((r) => {
              const selected = value.includes(r.value)
              return (
                <button
                  key={r.value}
                  type="button"
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-left cursor-pointer hover:bg-(--bg-elevated)"
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}
                  onClick={() => toggle(r.value)}
                >
                  <span className="truncate">{r.label}</span>
                  {selected && <Check size={14} style={{ color: 'var(--accent)' }} className="shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function todayStr() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

const NAV = [
  { id: 'general',       label: 'General',        icon: Settings  },
  { id: 'retention',     label: 'Data Retention', icon: Database  },
  { id: 'backup',        label: 'Backup',         icon: Save      },
  { id: 'announcements', label: 'Announcements',  icon: Megaphone },
]

// Renders a retention_days integer as a friendly "N years"/"N days" label.
function formatDays(days) {
  if (days == null) return '—'
  if (days % 365 === 0 && days >= 365) return `${days / 365} year${days === 365 ? '' : 's'}`
  return `${days} day${days === 1 ? '' : 's'}`
}

export default function AdminSystemSettings() {
  const { section: sectionParam } = useParams()
  const section = sectionParam || 'general'
  const [priority, setPriority] = useState('WARNING')
  const [responseTarget, setResponseTarget] = useState(12)
  const [coverageTarget, setCoverageTarget] = useState(90)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  // Announcement composer state
  const [announcements, setAnnouncements] = useState([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState('ALL')
  const [targetRoles, setTargetRoles] = useState([])
  const [targetUserIds, setTargetUserIds] = useState([])
  const [fromDate, setFromDate] = useState(todayStr())
  const [toDate, setToDate] = useState(todayStr())
  const [posting, setPosting] = useState(false)
  const [postMsg, setPostMsg] = useState(null)

  // Retention policy state
  const [retentionPolicies, setRetentionPolicies] = useState([])
  const [retentionLoading, setRetentionLoading] = useState(true)
  const [retentionError, setRetentionError] = useState(null)
  const [editingType, setEditingType] = useState(null)
  const [editDays, setEditDays] = useState('')
  const [editBasis, setEditBasis] = useState('')
  const [savingPolicy, setSavingPolicy] = useState(false)

  // Backup state
  const [backups, setBackups] = useState([])
  const [backupsLoading, setBackupsLoading] = useState(true)
  const [backupError, setBackupError] = useState(null)
  const [runningBackup, setRunningBackup] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState(null)

  function refreshRetention() {
    setRetentionLoading(true)
    setRetentionError(null)
    listRetentionPolicies()
      .then(setRetentionPolicies)
      .catch(() => setRetentionError('Failed to load retention policies.'))
      .finally(() => setRetentionLoading(false))
  }

  function refreshBackups() {
    setBackupsLoading(true)
    setBackupError(null)
    listBackups()
      .then(setBackups)
      .catch(() => setBackupError('Failed to load backups.'))
      .finally(() => setBackupsLoading(false))
  }

  function startEditPolicy(p) {
    setEditingType(p.data_type)
    setEditDays(String(p.retention_days))
    setEditBasis(p.legal_basis ?? '')
  }

  function cancelEditPolicy() {
    setEditingType(null)
    setEditDays('')
    setEditBasis('')
  }

  async function saveEditPolicy(dataType) {
    setSavingPolicy(true)
    try {
      const updated = await updateRetentionPolicy(dataType, {
        retentionDays: Number(editDays),
        legalBasis: editBasis,
      })
      setRetentionPolicies((prev) => prev.map((p) => (p.data_type === dataType ? updated : p)))
      cancelEditPolicy()
    } catch (err) {
      setRetentionError(err?.response?.data?.message ?? 'Failed to update policy.')
    } finally {
      setSavingPolicy(false)
    }
  }

  async function handleRunBackup() {
    setRunningBackup(true)
    setBackupError(null)
    try {
      await runBackupNow('MANUAL')
      refreshBackups()
    } catch (err) {
      setBackupError(err?.response?.data?.message ?? 'Backup failed — pg_dump may not be available on this server.')
    } finally {
      setRunningBackup(false)
    }
  }

  async function handleConfirmRestore() {
    if (!restoreTarget) return
    setRestoring(true)
    setRestoreError(null)
    try {
      await restoreBackup(restoreTarget.backup_id)
      setRestoreTarget(null)
    } catch (err) {
      setRestoreError(err?.response?.data?.message ?? 'Restore failed.')
    } finally {
      setRestoring(false)
    }
  }

  function refreshAnnouncements() {
    setAnnouncementsLoading(true)
    listAnnouncements().then(setAnnouncements).catch(() => {}).finally(() => setAnnouncementsLoading(false))
  }

  function refreshAnnouncementsDeferred() {
    Promise.resolve().then(refreshAnnouncements)
  }

  useEffect(() => {
    getSystemSettings()
      .then((s) => {
        if (s?.responseTimeTargetMinutes != null) setResponseTarget(s.responseTimeTargetMinutes)
        if (s?.coverageScoreTarget != null) setCoverageTarget(s.coverageScoreTarget)
      })
      .catch(() => {})
    refreshAnnouncementsDeferred()
    listUsers().then(setUsers).catch(() => {})
  }, [])

  useEffect(() => {
    if (section === 'retention') Promise.resolve().then(refreshRetention)
    if (section === 'backup') Promise.resolve().then(refreshBackups)
  }, [section])

  const today = todayStr()
  const activeAnnouncements = useMemo(
    () => announcements.filter((a) => a.to_date >= today),
    [announcements, today]
  )

  function toggleUser(userId) {
    setTargetUserIds((prev) => prev.includes(userId) ? prev.filter((u) => u !== userId) : [...prev, userId])
  }

  async function handlePostAnnouncement() {
    if (!message.trim()) { setPostMsg({ ok: false, text: 'Message is required.' }); return }
    if (targetType === 'ROLES' && targetRoles.length === 0) { setPostMsg({ ok: false, text: 'Select at least one role.' }); return }
    if (targetType === 'USERS' && targetUserIds.length === 0) { setPostMsg({ ok: false, text: 'Select at least one user.' }); return }
    if (toDate < fromDate) { setPostMsg({ ok: false, text: '"To" date must not be before "From" date.' }); return }
    setPosting(true)
    setPostMsg(null)
    try {
      const created = await createAnnouncement({
        message: message.trim(), severity: priority, targetType, targetRoles, targetUserIds, fromDate, toDate,
      })
      setPostMsg({ ok: true, text: `Sent to ${created.recipient_count} user${created.recipient_count === 1 ? '' : 's'}.` })
      setMessage('')
      setTargetRoles([])
      setTargetUserIds([])
      refreshAnnouncements()
    } catch (err) {
      setPostMsg({ ok: false, text: err?.response?.data?.message ?? 'Failed to post announcement.' })
    } finally {
      setPosting(false)
      setTimeout(() => setPostMsg(null), 5000)
    }
  }

  const handleSaveGeneral = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      await saveSystemSettings({ responseTimeTargetMinutes: responseTarget, coverageScoreTarget: coverageTarget })
      setSaveMsg({ ok: true, text: 'Settings saved.' })
    } catch {
      setSaveMsg({ ok: false, text: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 4000)
    }
  }

  if (!NAV.some((n) => n.id === section)) {
    return <Navigate to="/admin/settings/general" replace />
  }

  return (
    <SettingsNavLayout
      breadcrumbParent="System Administration"
      portalLabel="Global configuration and data management."
      basePath="/admin/settings"
      navItems={NAV}
    >
      {section === 'general' && (
        <SettingsGroup title="General System Settings">
          <label className="aiu-field">
            <span className="aiu-field-label">National Response Time Target (minutes)</span>
            <div className="aiu-input-wrap max-w-[140px]">
              <input type="number" className="aiu-input"
                value={responseTarget}
                min={1} max={60}
                onChange={(e) => setResponseTarget(Number(e.target.value))} />
            </div>
            <p className="aiu-field-hint">Current target: {responseTarget} min. Changes are saved to the database.</p>
          </label>
          <label className="aiu-field">
            <span className="aiu-field-label">Minimum Coverage Score Target (%)</span>
            <div className="aiu-input-wrap max-w-[140px]">
              <input type="number" className="aiu-input"
                value={coverageTarget}
                min={0} max={100}
                onChange={(e) => setCoverageTarget(Number(e.target.value))} />
            </div>
            <p className="aiu-field-hint">Current target: {coverageTarget}%.</p>
          </label>
          {saveMsg && (
            <p className="text-[12px]" style={{ color: saveMsg.ok ? 'var(--status-low)' : 'var(--status-critical)' }}>
              {saveMsg.text}
            </p>
          )}
          <button type="button" className="dispatcher-btn-primary w-full max-w-xs"
            disabled={saving} onClick={handleSaveGeneral}>
            {saving ? 'Saving…' : 'Save General Settings'}
          </button>
        </SettingsGroup>
      )}

      {section === 'retention' && (
        <SettingsGroup title="Data Retention Policies">
          {retentionError && (
            <div className="rounded-lg p-3 mb-4 text-[12px]" style={{ background: 'var(--status-critical-bg)', border: '1px solid var(--status-critical)', color: 'var(--text-primary)' }}>
              {retentionError}
            </div>
          )}
          <div className="dispatcher-surface overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-(--text-muted) border-b border-(--border)">
                  <th className="text-left p-3">Data Type</th>
                  <th className="p-3">Retention</th>
                  <th className="text-left p-3">Legal Basis</th>
                  <th className="p-3">Last Review</th>
                  <th className="p-3">Enforcement</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {retentionLoading && (
                  <tr><td colSpan={6} className="p-3 text-center text-(--text-muted)">Loading…</td></tr>
                )}
                {!retentionLoading && retentionPolicies.map((r) => {
                  const isEditing = editingType === r.data_type
                  return (
                    <tr key={r.data_type} className="border-b border-(--border-subtle)">
                      <td className="p-3 font-medium">{r.label}</td>
                      <td className="p-3 font-mono text-center">
                        {isEditing ? (
                          <input type="number" min={1} className="aiu-input text-center" style={{ width: 90 }}
                            value={editDays} onChange={(e) => setEditDays(e.target.value)} />
                        ) : formatDays(r.retention_days)}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input type="text" className="aiu-input" value={editBasis}
                            onChange={(e) => setEditBasis(e.target.value)} />
                        ) : r.legal_basis}
                      </td>
                      <td className="p-3 text-(--text-muted) text-center">{r.last_reviewed_at ?? '—'}</td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{
                          background: r.enforced ? 'var(--status-low-bg)' : 'var(--status-medium-bg)',
                          color: r.enforced ? 'var(--status-low)' : 'var(--status-medium)',
                        }}>
                          {r.enforced ? 'ENFORCED DAILY' : 'NOT ENFORCED'}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {isEditing ? (
                          <span className="inline-flex gap-1">
                            <button type="button" className="dispatcher-btn-primary text-[11px] h-7 px-2"
                              disabled={savingPolicy} onClick={() => saveEditPolicy(r.data_type)}>
                              {savingPolicy ? '…' : 'Save'}
                            </button>
                            <button type="button" className="dispatcher-btn-ghost text-[11px] h-7 px-2"
                              disabled={savingPolicy} onClick={cancelEditPolicy}>
                              <X size={12} />
                            </button>
                          </span>
                        ) : (
                          <button type="button" className="dispatcher-btn-ghost text-[11px] h-7 px-2 inline-flex items-center gap-1"
                            onClick={() => startEditPolicy(r)}>
                            <Pencil size={12} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-(--text-muted) mt-3 m-0">
            "Enforced daily" data types are purged automatically by a scheduled job once rows pass the retention window.
            "Not enforced" data types (incident records, field reports, user activity logs) have no safe automated
            purge implemented yet — their retention window is policy only until cascading-delete logic is built for them.
          </p>
        </SettingsGroup>
      )}

      {section === 'backup' && (
        <SettingsGroup title="Backup Management">
          {backupError && (
            <div className="rounded-lg p-3 mb-4 text-[12px]" style={{ background: 'var(--status-critical-bg)', border: '1px solid var(--status-critical)', color: 'var(--text-primary)' }}>
              {backupError}
            </div>
          )}
          <div className="rounded-lg p-3 mb-4 text-[12px]" style={{ background: 'var(--status-info-bg)', border: '1px solid var(--status-info)', color: 'var(--text-primary)' }}>
            Backups run for real via <code>pg_dump</code> to a local <code>backups/</code> directory, and a daily automatic
            backup is scheduled server-side. Restore runs <code>psql</code> against the live database and is irreversible.
          </div>

          {backupsLoading && <p className="text-[12px] text-(--text-muted)">Loading…</p>}
          {!backupsLoading && backups.length === 0 && (
            <div className="text-center py-8 rounded-lg mb-3" style={{ background: 'var(--bg-elevated)' }}>
              <Database size={24} className="text-(--text-muted) mx-auto mb-2" />
              <p className="text-[13px] text-(--text-muted) m-0">No backups yet</p>
            </div>
          )}
          {!backupsLoading && backups.map((b) => (
            <div key={b.backup_id} className="dispatcher-surface p-4 mb-3">
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-[13px]">{b.type}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'var(--status-low-bg)', color: 'var(--status-low)' }}>COMPLETE</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12px] font-mono text-(--text-secondary) mb-3">
                <span>Created: {b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</span>
                <span>Size: {b.size_mb ?? '—'} MB</span>
                <span className="col-span-2 truncate">Location: {b.location}</span>
              </div>
              <div className="flex gap-2">
                <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 flex-1"
                  onClick={() => { setRestoreError(null); setRestoreTarget(b) }}>
                  <RotateCcw size={12} className="inline mr-1" /> Restore →
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="dispatcher-btn-primary w-full inline-flex items-center justify-center gap-2 mt-2"
            disabled={runningBackup} onClick={handleRunBackup}>
            <Database size={16} />
            {runningBackup ? 'Running backup…' : 'Run Full Backup Now'}
          </button>

          <ConfirmDangerModal
            open={!!restoreTarget}
            title="Restore database from backup?"
            message={restoreTarget
              ? `This will overwrite the live database with the contents of the backup created ${restoreTarget.created_at ? new Date(restoreTarget.created_at).toLocaleString() : ''}. This action is irreversible.${restoreError ? ` Error: ${restoreError}` : ''}`
              : ''}
            confirmLabel={restoring ? 'Restoring…' : 'Restore'}
            onConfirm={handleConfirmRestore}
            onCancel={() => { if (!restoring) setRestoreTarget(null) }}
          />
        </SettingsGroup>
      )}

      {section === 'announcements' && (
        <SettingsGroup title="System Announcements">
          <p className="text-[12px] text-(--text-muted) m-0 mb-4">
            Sent as a real pop-up alert to the users you choose, for the date range you set — reappears each day within that range until dismissed for that day.
          </p>

          <div className="mb-4">
            {announcementsLoading && <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>}
            {!announcementsLoading && activeAnnouncements.length === 0 && (
              <div className="text-center py-8 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <Megaphone size={24} className="text-(--text-muted) mx-auto mb-2" />
                <p className="text-[13px] text-(--text-muted) m-0">No active announcements</p>
              </div>
            )}
            {!announcementsLoading && activeAnnouncements.map((a) => {
              const tone = SEVERITY_TONE[a.severity] ?? SEVERITY_TONE.INFO
              const Icon = tone.Icon
              return (
                <div key={a.announcement_id} className="rounded-lg p-3 mb-2 flex gap-2 items-start"
                  style={{ background: tone.bg, border: `1px solid ${tone.color}` }}>
                  <Icon size={15} style={{ color: tone.color }} className="shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-(--text-primary) m-0">{a.message}</p>
                    <p className="text-[11px] text-(--text-muted) m-0 mt-1">
                      {a.from_date} → {a.to_date} · {a.recipient_count} recipient{a.recipient_count === 1 ? '' : 's'} · by {a.created_by_name}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <label className="aiu-field">
            <span className="aiu-field-label">Severity</span>
            <div className="aiu-input-wrap">
              <select className="aiu-input aiu-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </label>

          <div className="flex gap-2">
            <label className="aiu-field flex-1">
              <span className="aiu-field-label">From</span>
              <div className="aiu-input-wrap">
                <input type="date" className="aiu-input" value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)} />
              </div>
            </label>
            <label className="aiu-field flex-1">
              <span className="aiu-field-label">To</span>
              <div className="aiu-input-wrap">
                <input type="date" className="aiu-input" value={toDate} min={fromDate}
                  onChange={(e) => setToDate(e.target.value)} />
              </div>
            </label>
          </div>

          <label className="aiu-field">
            <span className="aiu-field-label">Send to</span>
            <div className="aiu-input-wrap">
              <select className="aiu-input aiu-select" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
                <option value="ALL">All Users</option>
                <option value="ROLES">Specific Roles</option>
                <option value="USERS">Specific Users</option>
              </select>
            </div>
          </label>

          {targetType === 'ROLES' && (
            <label className="aiu-field">
              <span className="aiu-field-label">Roles</span>
              <RoleMultiSelect value={targetRoles} onChange={setTargetRoles} />
            </label>
          )}

          {targetType === 'USERS' && (
            <label className="aiu-field">
              <span className="aiu-field-label">Users</span>
              <div className="max-h-40 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
                {users.map((u) => (
                  <label key={u.user_id} className="flex items-center gap-2 px-3 py-2 text-[12px] border-b border-(--border-subtle) last:border-0 cursor-pointer">
                    <input type="checkbox" checked={targetUserIds.includes(u.user_id)} onChange={() => toggleUser(u.user_id)} />
                    <span className="flex-1">{u.full_name}</span>
                    <span className="text-(--text-muted)">{u.role}</span>
                  </label>
                ))}
              </div>
            </label>
          )}

          <label className="aiu-field">
            <span className="aiu-field-label">Message *</span>
            <div className="aiu-input-wrap">
              <textarea
                className="aiu-input w-full"
                style={{ height: 'auto', minHeight: 90, padding: '0.6rem 0.85rem', resize: 'vertical' }}
                placeholder="e.g. Scheduled maintenance tonight 02:00–04:00..."
                value={message} onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </label>

          <div
            className="mt-3 p-3 rounded-lg text-[12px] flex gap-2 items-start"
            style={{ background: SEVERITY_TONE[priority].bg, border: `1px solid ${SEVERITY_TONE[priority].color}` }}
          >
            {(() => { const Icon = SEVERITY_TONE[priority].Icon; return <Icon size={14} style={{ color: SEVERITY_TONE[priority].color }} className="shrink-0 mt-0.5" /> })()}
            <span>Preview: this pop-up will appear with {priority} styling to the selected recipients, every day from {fromDate} to {toDate}.</span>
          </div>

          {postMsg && (
            <p className="text-[12px] mt-2" style={{ color: postMsg.ok ? 'var(--status-low)' : 'var(--status-critical)' }}>
              {postMsg.text}
            </p>
          )}

          <button type="button" className="dispatcher-btn-primary w-full mt-3" disabled={posting} onClick={handlePostAnnouncement}>
            {posting ? 'Sending…' : 'Post Announcement'}
          </button>
        </SettingsGroup>
      )}
    </SettingsNavLayout>
  )
}
