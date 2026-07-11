import { useState, useEffect, useMemo } from 'react'
import { Shield, Mail, Lock, Plus, ChevronLeft, ChevronRight } from 'lucide-react'


const SESSION_PAGE_SIZE = 10
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ConfirmDangerModal from '../../components/admin/ConfirmDangerModal'
import { adminRoleBadge } from '../../data/mockAdminData'
import {
  listSecurityEvents,
  listSessions,
  revokeSession,
  revokeAllSessions,
  sendMfaReminder,
  sendMfaReminderAll,
  getSystemSettings,
  saveSystemSettings,
} from '../../api/admin'
import { listUsers } from '../../api/users'

const ROLE_LABELS = {
  DISPATCHER: 'Dispatcher',
  FIELD_RESPONDER: 'Field Responder',
  OPERATIONS_MANAGER: 'Ops Manager',
  DISTRICT_COMMANDER: 'District Commander',
  EMERGENCY_PLANNER: 'Emergency Planner',
  ANALYST: 'Analyst',
  SUPER_ADMIN: 'Super Admin',
}

const PASSWORD_MAX_AGE_OPTIONS = [30, 60, 90, 180, 365]

export default function AdminSecurity() {
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionPage, setSessionPage] = useState(1)
  const [revokeId, setRevokeId] = useState(null)
  const [revoking, setRevoking] = useState(false)
  const [toast, setToast] = useState(null)
  const [securityEvents, setSecurityEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState(null)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [sendingReminder, setSendingReminder] = useState(null)

  // Password policy state
  const [policy, setPolicy] = useState({
    minPasswordLength: 12,
    maxFailedAttempts: 5,
    complexityRequired: true,
    passwordMaxAgeDays: 90,
  })
  const [savingPolicy, setSavingPolicy] = useState(false)

  // IP Allowlist state
  const [ipAllowlistEnabled, setIpAllowlistEnabled] = useState(false)
  const [ipRanges, setIpRanges] = useState([])
  const [newRange, setNewRange] = useState('')
  const [newRangeLabel, setNewRangeLabel] = useState('')
  const [showAddRange, setShowAddRange] = useState(false)
  const [savingIp, setSavingIp] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)

  useEffect(() => {
    listSecurityEvents()
      .then((events) => setSecurityEvents(events))
      .catch(() => setEventsError('Failed to load security events'))
      .finally(() => setEventsLoading(false))
    listSessions()
      .then((s) => setSessions(s))
      .catch(() => {})
      .finally(() => setSessionsLoading(false))
    listUsers()
      .then((u) => setUsers(u))
      .catch(() => {})
      .finally(() => setUsersLoading(false))
    getSystemSettings()
      .then((s) => {
        setPolicy({
          minPasswordLength: s.minPasswordLength ?? 12,
          maxFailedAttempts: s.maxFailedAttempts ?? 5,
          complexityRequired: s.complexityRequired ?? true,
          passwordMaxAgeDays: s.passwordMaxAgeDays ?? 90,
        })
        setIpAllowlistEnabled(s.ipAllowlistEnabled ?? false)
        setIpRanges(s.ipRanges ?? [])
      })
      .catch(() => {})
      .finally(() => setSettingsLoading(false))
  }, [])

  const mfaRoles = useMemo(() => {
    const map = {}
    users.forEach((u) => {
      const label = ROLE_LABELS[u.role] ?? u.role
      if (!map[label]) map[label] = { role: label, enabled: 0, total: 0 }
      map[label].total++
      if (u.mfa_enabled) map[label].enabled++
    })
    return Object.values(map).sort((a, b) => a.role.localeCompare(b.role))
  }, [users])

  const nonCompliantUsers = useMemo(
    () => users.filter((u) => !u.mfa_enabled && u.status === 'ACTIVE'),
    [users],
  )

  const totalSessionPages = Math.max(1, Math.ceil(sessions.length / SESSION_PAGE_SIZE))
  const pagedSessions = useMemo(
    () => sessions.slice((sessionPage - 1) * SESSION_PAGE_SIZE, sessionPage * SESSION_PAGE_SIZE),
    [sessions, sessionPage],
  )

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSendReminder(userId) {
    setSendingReminder(userId)
    try {
      await sendMfaReminder(userId)
      showToast('MFA setup reminder sent')
    } catch {
      showToast('Failed to send reminder')
    } finally {
      setSendingReminder(null)
    }
  }

  async function handleSendReminderAll() {
    setSendingReminder('all')
    try {
      const result = await sendMfaReminderAll()
      showToast(`Reminders sent to ${result.sent} user${result.sent !== 1 ? 's' : ''}`)
    } catch {
      showToast('Failed to send reminders')
    } finally {
      setSendingReminder(null)
    }
  }

  async function handleConfirmRevoke() {
    setRevoking(true)
    try {
      if (revokeId === 'all') {
        await revokeAllSessions()
        setSessions((prev) => prev.filter((s) => s.self))
        setSessionPage(1)
        showToast('All other sessions revoked')
      } else {
        await revokeSession(revokeId)
        setSessions((prev) => prev.filter((s) => s.session_id !== revokeId))
        showToast('Session revoked')
      }
    } catch {
      showToast('Failed to revoke session — try again')
    } finally {
      setRevoking(false)
      setRevokeId(null)
    }
  }

  async function handleSavePolicy() {
    setSavingPolicy(true)
    try {
      await saveSystemSettings(policy)
      showToast('Password policy saved')
    } catch {
      showToast('Failed to save policy')
    } finally {
      setSavingPolicy(false)
    }
  }

  async function handleToggleAllowlist(enabled) {
    setIpAllowlistEnabled(enabled)
    try {
      await saveSystemSettings({ ipAllowlistEnabled: enabled })
      showToast(`IP Allowlist ${enabled ? 'enabled' : 'disabled'}`)
    } catch {
      showToast('Failed to update allowlist setting')
      setIpAllowlistEnabled(!enabled)
    }
  }

  async function handleAddRange() {
    if (!newRange.trim()) return
    const updated = [...ipRanges, { range: newRange.trim(), label: newRangeLabel.trim() || newRange.trim() }]
    setSavingIp(true)
    try {
      await saveSystemSettings({ ipRanges: updated })
      setIpRanges(updated)
      setNewRange('')
      setNewRangeLabel('')
      setShowAddRange(false)
      showToast('IP range added')
    } catch {
      showToast('Failed to add IP range')
    } finally {
      setSavingIp(false)
    }
  }

  async function handleRemoveRange(rangeValue) {
    const updated = ipRanges.filter((r) => r.range !== rangeValue)
    setSavingIp(true)
    try {
      await saveSystemSettings({ ipRanges: updated })
      setIpRanges(updated)
      showToast('IP range removed')
    } catch {
      showToast('Failed to remove IP range')
    } finally {
      setSavingIp(false)
    }
  }

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] dispatcher-surface px-4 py-2.5 text-[13px] font-medium shadow-lg" style={{ borderLeft: '3px solid var(--accent)' }}>
          {toast}
        </div>
      )}

      <AdminPageHeader title="Security Management" subtitle="MFA compliance, sessions, and security policies." eyebrow="Super Admin Portal" badge="2 Open Alerts" />

      {eventsError && (
        <div className="text-[12px] px-3 py-2 rounded" style={{ background: 'var(--status-medium-bg)', color: 'var(--status-medium)' }}>
          {eventsError}
        </div>
      )}

      {eventsLoading && (
        <div className="text-[12px] text-(--text-muted) px-1">Loading security events…</div>
      )}

      {!eventsLoading && !eventsError && securityEvents.length === 0 && (
        <div className="text-[12px] text-(--text-secondary) px-1">No security events recorded.</div>
      )}

      {!eventsLoading && securityEvents.length > 0 && (
        <div className="dispatcher-surface p-4">
          <div className="font-semibold text-[13px] mb-3">Recent Security Events</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] min-w-[640px]">
              <thead>
                <tr className="text-(--text-muted) border-b border-(--border)">
                  <th className="text-left p-2">Event ID</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Source</th>
                  <th className="p-2">IP Address</th>
                  <th className="p-2">Occurred At</th>
                  <th className="p-2">Severity</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {securityEvents.map((ev) => (
                  <tr key={ev.event_id} className="border-b border-(--border-subtle)">
                    <td className="p-2 font-mono text-(--text-muted)">{ev.event_id}</td>
                    <td className="p-2 font-medium">{ev.event_type}</td>
                    <td className="p-2 text-(--text-secondary)">{ev.source}</td>
                    <td className="p-2 font-mono text-center">{ev.ip_address}</td>
                    <td className="p-2 font-mono text-center text-(--text-muted)">{ev.occurred_at}</td>
                    <td className="p-2 text-center">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                        background: ev.severity === 'CRITICAL' ? 'var(--status-critical-bg)' : 'var(--status-medium-bg)',
                        color: ev.severity === 'CRITICAL' ? 'var(--status-critical)' : 'var(--status-medium)',
                      }}>{ev.severity}</span>
                    </td>
                    <td className="p-2 text-center">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                        background: ev.status === 'OPEN' ? 'var(--status-critical-bg)' : 'var(--bg-elevated)',
                        color: ev.status === 'OPEN' ? 'var(--status-critical)' : 'var(--text-muted)',
                      }}>{ev.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="dispatcher-surface p-4">
        <div className="flex flex-wrap justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: 'var(--accent)' }} />
            <span className="font-semibold text-[14px]">MFA Compliance by Role</span>
          </div>
          <button
            type="button"
            className="dispatcher-btn-ghost text-[11px] h-8 inline-flex items-center gap-1"
            disabled={sendingReminder === 'all' || nonCompliantUsers.length === 0}
            onClick={handleSendReminderAll}
          >
            <Mail size={12} />
            {sendingReminder === 'all' ? 'Sending…' : `Send Reminder to All Non-Compliant (${nonCompliantUsers.length})`}
          </button>
        </div>
        {usersLoading ? (
          <div className="text-[12px] text-(--text-muted) py-4">Loading compliance data…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {mfaRoles.map((r) => {
                const pct = r.total === 0 ? 100 : Math.round((r.enabled / r.total) * 100)
                const met = pct === 100
                return (
                  <div key={r.role}>
                    <div className="flex justify-between text-[13px] font-medium mb-1">
                      <span>{r.role}</span>
                      <span className="font-mono text-[12px]">{r.enabled}/{r.total} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-(--border) overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: met ? 'var(--accent)' : 'var(--status-critical)' }} />
                    </div>
                    <span className="text-[10px] font-mono mt-1 inline-block" style={{ color: met ? 'var(--status-low)' : 'var(--status-critical)' }}>
                      {met ? '✓ 100% REQUIRED' : '100% REQUIRED'}
                    </span>
                  </div>
                )
              })}
            </div>
            {nonCompliantUsers.length === 0 ? (
              <p className="text-[12px] text-center py-4" style={{ color: 'var(--status-low)' }}>
                ✓ All active users have MFA enabled
              </p>
            ) : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-(--text-muted) border-b border-(--border)">
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Role</th>
                    <th className="text-left py-2">Email</th>
                    <th className="py-2">MFA</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {nonCompliantUsers.map((u) => (
                    <tr key={u.user_id} className="border-b border-(--border-subtle)">
                      <td className="py-2 font-medium">{u.full_name}</td>
                      <td className="py-2 text-(--text-secondary)">{ROLE_LABELS[u.role] ?? u.role}</td>
                      <td className="py-2 font-mono text-(--text-muted)">{u.email}</td>
                      <td className="py-2 text-center font-bold text-[10px]" style={{ color: 'var(--status-critical)' }}>NOT ENABLED</td>
                      <td className="py-2 text-center">
                        <button
                          type="button"
                          className="dispatcher-btn-ghost text-[10px] h-7"
                          disabled={sendingReminder === u.user_id}
                          onClick={() => handleSendReminder(u.user_id)}
                        >
                          {sendingReminder === u.user_id ? 'Sending…' : 'Send Setup Reminder'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="dispatcher-surface p-4 flex-1 min-w-0">
          <div className="flex flex-wrap justify-between gap-2 mb-4">
            <span className="font-semibold text-[13px]">
              Active Sessions{sessionsLoading ? '' : ` — ${sessions.length} online`}
            </span>
            <button
              type="button"
              className="text-[11px] font-bold px-3 py-1 rounded border cursor-pointer"
              style={{ borderColor: 'var(--status-critical)', color: 'var(--status-critical)' }}
              onClick={() => setRevokeId('all')}
            >
              Revoke All Sessions
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] min-w-[640px]">
              <thead>
                <tr className="text-(--text-muted) border-b border-(--border)">
                  <th className="text-left p-2">User</th>
                  <th className="p-2">Role</th>
                  <th className="text-left p-2">Device</th>
                  <th className="p-2">IP Address</th>
                  <th className="p-2">Login</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessionsLoading && (
                  <tr><td colSpan={6} className="p-6 text-center text-(--text-muted)">Loading sessions…</td></tr>
                )}
                {!sessionsLoading && sessions.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-(--text-muted)">No active sessions in the last 24 h</td></tr>
                )}
                {pagedSessions.map((s) => {
                  const rb = adminRoleBadge(s.user_role)
                  return (
                    <tr key={s.session_id} className="border-b border-(--border-subtle)">
                      <td className="p-2 font-medium">{s.user_name}</td>
                      <td className="p-2">
                        <span className="text-[10px] font-bold px-1.5 rounded" style={{ background: rb.bg, color: rb.color }}>{rb.label}</span>
                      </td>
                      <td className="p-2">
                        {(() => {
                          const [browser, os] = (s.device ?? '').split(' · ')
                          return (
                            <div className="flex flex-col gap-0.5">
                              {browser && (
                                <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{browser}</span>
                              )}
                              {os && (
                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{os}</span>
                              )}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="p-2 font-mono">{s.ip_address}</td>
                      <td className="p-2 font-mono text-(--text-muted)">{s.start_time ? new Date(s.start_time).toLocaleString() : '—'}</td>
                      <td className="p-2">
                        {s.self ? (
                          <span className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>This device</span>
                        ) : (
                          <button
                            type="button"
                            className="dispatcher-btn-ghost text-[10px] h-7 hover:border-(--status-critical) hover:text-(--status-critical)"
                            onClick={() => setRevokeId(s.session_id)}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!sessionsLoading && totalSessionPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-(--border-subtle) mt-2">
              <span className="text-[11px] text-(--text-muted)">
                Page {sessionPage} of {totalSessionPages} · {sessions.length} sessions
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="dispatcher-btn-ghost text-[11px] h-7 px-3 inline-flex items-center gap-1"
                  disabled={sessionPage === 1}
                  onClick={() => setSessionPage((p) => p - 1)}
                >
                  <ChevronLeft size={12} /> Prev
                </button>
                <button
                  type="button"
                  className="dispatcher-btn-ghost text-[11px] h-7 px-3 inline-flex items-center gap-1"
                  disabled={sessionPage === totalSessionPages}
                  onClick={() => setSessionPage((p) => p + 1)}
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:w-[45%] shrink-0">
          {/* Password Policy */}
          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0 mb-3">Password Policy</h3>
            {settingsLoading ? (
              <div className="text-[12px] text-(--text-muted) py-2">Loading…</div>
            ) : (
              <>
                <label className="flex justify-between items-center text-[12px] mb-2">
                  <span>Minimum length</span>
                  <input
                    type="number"
                    className="dispatcher-input h-9 w-16"
                    value={policy.minPasswordLength}
                    min={8}
                    max={32}
                    onChange={(e) => setPolicy((p) => ({ ...p, minPasswordLength: Number(e.target.value) }))}
                  />
                </label>
                <label className="flex justify-between items-center text-[12px] mb-2">
                  <span>Failed attempts before lockout</span>
                  <input
                    type="number"
                    className="dispatcher-input h-9 w-16"
                    value={policy.maxFailedAttempts}
                    min={3}
                    max={10}
                    onChange={(e) => setPolicy((p) => ({ ...p, maxFailedAttempts: Number(e.target.value) }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-[12px] mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policy.complexityRequired}
                    onChange={(e) => setPolicy((p) => ({ ...p, complexityRequired: e.target.checked }))}
                  />
                  Complexity required (uppercase, numbers, symbols)
                </label>
                <select
                  className="dispatcher-input h-9 w-full text-[12px] mb-3"
                  value={policy.passwordMaxAgeDays}
                  onChange={(e) => setPolicy((p) => ({ ...p, passwordMaxAgeDays: Number(e.target.value) }))}
                >
                  {PASSWORD_MAX_AGE_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d} days maximum age</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="dispatcher-btn-primary w-full text-[12px]"
                  disabled={savingPolicy}
                  onClick={handleSavePolicy}
                >
                  {savingPolicy ? 'Saving…' : 'Save Policy'}
                </button>
              </>
            )}
          </div>

          {/* IP Allowlist */}
          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0">IP Allowlist</h3>
            <p className="text-[12px] text-(--text-muted) m-0 mb-2">Restrict access to these network ranges only</p>
            {settingsLoading ? (
              <div className="text-[12px] text-(--text-muted) py-2">Loading…</div>
            ) : (
              <>
                <label className="flex items-center gap-2 text-[12px] mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ipAllowlistEnabled}
                    onChange={(e) => handleToggleAllowlist(e.target.checked)}
                  />
                  Allowlist enforced: {ipAllowlistEnabled ? 'ON' : 'OFF'}
                </label>
                {ipRanges.map((ip) => (
                  <div key={ip.range} className="flex justify-between items-center py-2 border-b border-(--border-subtle) text-[12px]">
                    <span className="font-mono">{ip.range}</span>
                    <span className="text-(--text-secondary)">{ip.label}</span>
                    <button
                      type="button"
                      className="bg-transparent border-none cursor-pointer text-[14px] leading-none"
                      style={{ color: 'var(--status-critical)' }}
                      onClick={() => handleRemoveRange(ip.range)}
                      disabled={savingIp}
                    >×</button>
                  </div>
                ))}
                {showAddRange ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <input
                      className="dispatcher-input h-9 text-[12px]"
                      placeholder="CIDR range e.g. 197.243.0.0/16"
                      value={newRange}
                      onChange={(e) => setNewRange(e.target.value)}
                    />
                    <input
                      className="dispatcher-input h-9 text-[12px]"
                      placeholder="Label e.g. RNP Kigali HQ"
                      value={newRangeLabel}
                      onChange={(e) => setNewRangeLabel(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="dispatcher-btn-primary flex-1 text-[11px] h-8"
                        onClick={handleAddRange}
                        disabled={savingIp || !newRange.trim()}
                      >
                        {savingIp ? 'Saving…' : 'Add Range'}
                      </button>
                      <button
                        type="button"
                        className="dispatcher-btn-ghost text-[11px] h-8 px-3"
                        onClick={() => { setShowAddRange(false); setNewRange(''); setNewRangeLabel('') }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="dispatcher-btn-ghost text-[11px] h-8 mt-2 w-full inline-flex items-center justify-center gap-1"
                    onClick={() => setShowAddRange(true)}
                  >
                    <Plus size={12} /> Add IP Range
                  </button>
                )}
              </>
            )}
          </div>

          {/* Encryption Status */}
          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0 mb-3">Encryption Status</h3>
            {[
              { label: 'Data at Rest', detail: 'AES-256 Encrypted · All databases' },
              { label: 'Data in Transit', detail: 'TLS 1.3 · All API connections' },
            ].map((e) => (
              <div key={e.label} className="flex gap-2 items-start text-[12px] mb-2">
                <Lock size={14} style={{ color: 'var(--status-low)' }} />
                <div>
                  <div className="font-medium">{e.label}</div>
                  <div className="text-(--text-secondary)">{e.detail}</div>
                </div>
              </div>
            ))}
            <p className="font-mono text-[11px] text-(--text-muted) m-0">Last audit: May 1, 2026</p>
          </div>
        </div>
      </div>

      <ConfirmDangerModal
        open={revokeId !== null}
        title={revokeId === 'all' ? 'Revoke all sessions?' : 'Revoke this session?'}
        message={
          revokeId === 'all'
            ? 'This will log out ALL other users immediately. Use only for security emergencies.'
            : 'The user will be logged out immediately and must sign in again.'
        }
        confirmLabel={revokeId === 'all' ? 'Revoke All' : 'Revoke Session'}
        onConfirm={handleConfirmRevoke}
        onCancel={() => !revoking && setRevokeId(null)}
      />
    </div>
  )
}
