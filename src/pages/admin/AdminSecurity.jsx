import { useState, useEffect, useMemo } from 'react'
import { Shield, Mail, ChevronLeft, ChevronRight, Search, Lock, Unlock } from 'lucide-react'


const SESSION_PAGE_SIZE = 10
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ConfirmDangerModal from '../../components/admin/ConfirmDangerModal'
import {
  listSecurityEvents,
  listSessions,
  revokeSession,
  revokeAllSessions,
  sendMfaReminder,
  sendMfaReminderAll,
  listLockedUsers,
  unlockUser,
} from '../../api/admin'
import { listUsers } from '../../api/users'
import { useToastStore } from '../../store/toastStore'

const ROLE_LABELS = {
  DISPATCHER: 'Dispatcher',
  FIELD_RESPONDER: 'Field Responder',
  OPERATIONS_MANAGER: 'Ops Manager',
  DISTRICT_COMMANDER: 'District Commander',
  EMERGENCY_PLANNER: 'Emergency Planner',
  ANALYST: 'Analyst',
  SUPER_ADMIN: 'Super Admin',
}

export default function AdminSecurity() {
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionSearch, setSessionSearch] = useState('')
  const [sessionPage, setSessionPage] = useState(1)
  const [revokeId, setRevokeId] = useState(null)
  const [revoking, setRevoking] = useState(false)
  const pushToast = useToastStore((s) => s.pushToast)
  const [securityEvents, setSecurityEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState(null)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [sendingReminder, setSendingReminder] = useState(null)
  const [lockedUsers, setLockedUsers] = useState([])
  const [lockedLoading, setLockedLoading] = useState(true)
  const [unlockId, setUnlockId] = useState(null)
  const [unlocking, setUnlocking] = useState(false)

  function refreshLockedUsers() {
    setLockedLoading(true)
    listLockedUsers()
      .then((u) => setLockedUsers(u))
      .catch(() => {})
      .finally(() => setLockedLoading(false))
  }

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
    Promise.resolve().then(() => refreshLockedUsers())
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

  const openAlertCount = useMemo(
    () => securityEvents.filter((ev) => ev.status === 'OPEN').length,
    [securityEvents]
  )

  const nonCompliantUsers = useMemo(
    () => users.filter((u) => !u.mfa_enabled && u.status === 'ACTIVE'),
    [users],
  )

  const filteredSessions = useMemo(() => {
    const q = sessionSearch.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter((s) =>
      (s.user_name ?? '').toLowerCase().includes(q) ||
      (s.device ?? '').toLowerCase().includes(q) ||
      (s.ip_address ?? '').toLowerCase().includes(q)
    )
  }, [sessions, sessionSearch])

  const totalSessionPages = Math.max(1, Math.ceil(filteredSessions.length / SESSION_PAGE_SIZE))
  const pagedSessions = useMemo(
    () => filteredSessions.slice((sessionPage - 1) * SESSION_PAGE_SIZE, sessionPage * SESSION_PAGE_SIZE),
    [filteredSessions, sessionPage],
  )

  useEffect(() => { Promise.resolve().then(() => setSessionPage(1)) }, [sessionSearch])

  function showToast(msg, variant = 'success') {
    pushToast({ variant, title: variant === 'error' ? 'Error' : 'Security', message: msg })
  }

  async function handleSendReminder(userId) {
    setSendingReminder(userId)
    try {
      await sendMfaReminder(userId)
      showToast('MFA setup reminder sent')
    } catch {
      showToast('Failed to send reminder', 'error')
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
      showToast('Failed to send reminders', 'error')
    } finally {
      setSendingReminder(null)
    }
  }

  async function handleConfirmUnlock() {
    if (!unlockId) return
    setUnlocking(true)
    try {
      await unlockUser(unlockId)
      setLockedUsers((prev) => prev.filter((u) => u.user_id !== unlockId))
      showToast('Account unlocked')
    } catch {
      showToast('Failed to unlock account — try again', 'error')
    } finally {
      setUnlocking(false)
      setUnlockId(null)
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
      showToast('Failed to revoke session — try again', 'error')
    } finally {
      setRevoking(false)
      setRevokeId(null)
    }
  }


  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      <AdminPageHeader title="Security Management" subtitle="MFA compliance, sessions, and security policies." eyebrow="Super Admin Portal" badge={eventsLoading ? undefined : `${openAlertCount} Open Alert${openAlertCount !== 1 ? 's' : ''}`} />

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
                <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border)">
                  <th className="text-left p-2 font-bold">Event ID</th>
                  <th className="text-left p-2 font-bold">Type</th>
                  <th className="text-left p-2 font-bold">Source</th>
                  <th className="p-2 font-bold">IP Address</th>
                  <th className="p-2 font-bold">Occurred At</th>
                  <th className="p-2 font-bold">Severity</th>
                  <th className="p-2 font-bold">Status</th>
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
                  <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border)">
                    <th className="text-left py-2 font-bold">User</th>
                    <th className="text-left py-2 font-bold">Role</th>
                    <th className="text-left py-2 font-bold">Email</th>
                    <th className="py-2 font-bold">MFA</th>
                    <th className="py-2 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {nonCompliantUsers.map((u) => (
                    <tr key={u.user_id} className="border-b border-(--border-subtle)">
                      <td className="py-2">{u.full_name}</td>
                      <td className="py-2">{ROLE_LABELS[u.role] ?? u.role}</td>
                      <td className="py-2">{u.email}</td>
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

      <div className="dispatcher-surface p-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} style={{ color: 'var(--status-critical)' }} />
          <span className="font-semibold text-[14px]">
            Locked Accounts{lockedLoading ? '' : ` — ${lockedUsers.length}`}
          </span>
        </div>
        {lockedLoading ? (
          <div className="text-[12px] text-(--text-muted) py-4">Loading locked accounts…</div>
        ) : lockedUsers.length === 0 ? (
          <p className="text-[12px] text-center py-4" style={{ color: 'var(--status-low)' }}>
            ✓ No accounts are currently locked
          </p>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border)">
                <th className="text-left py-2 font-bold">User</th>
                <th className="text-left py-2 font-bold">Role</th>
                <th className="text-left py-2 font-bold">District</th>
                <th className="py-2 font-bold">Attempted IP</th>
                <th className="py-2 font-bold">Locked At</th>
                <th className="py-2 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {lockedUsers.map((u) => (
                <tr key={u.user_id} className="border-b border-(--border-subtle)">
                  <td className="py-2">
                    <div className="font-medium">{u.full_name}</div>
                    <div className="text-[11px] text-(--text-muted)">{u.email}</div>
                  </td>
                  <td className="py-2">{ROLE_LABELS[u.role] ?? u.role}</td>
                  <td className="py-2">{u.district_name ?? '—'}</td>
                  <td className="py-2 text-center font-mono">{u.attempted_ip ?? '—'}</td>
                  <td className="py-2 text-center font-mono text-(--text-muted)">
                    {u.locked_at ? new Date(u.locked_at).toLocaleString() : '—'}
                  </td>
                  <td className="py-2 text-center">
                    <button
                      type="button"
                      className="dispatcher-btn-ghost text-[10px] h-7 inline-flex items-center gap-1"
                      onClick={() => setUnlockId(u.user_id)}
                    >
                      <Unlock size={12} /> Unlock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-col gap-4">
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
          <div className="relative w-56 mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
            <input
              type="text"
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              placeholder="Search by user, device, or IP…"
              className="dispatcher-input h-8 w-full rounded-full pl-8 pr-3 text-[11px]"
              style={{ borderRadius: 9999 }}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] min-w-[640px]">
              <thead>
                <tr className="text-[12px] font-medium text-(--text-secondary) border-b border-(--border)">
                  <th className="text-left p-2 font-bold">User</th>
                  <th className="p-2 font-bold">Role</th>
                  <th className="text-left p-2 font-bold">Device IP</th>
                  <th className="p-2 font-bold">Login</th>
                  <th className="p-2 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessionsLoading && (
                  <tr><td colSpan={5} className="p-6 text-center text-(--text-muted)">Loading sessions…</td></tr>
                )}
                {!sessionsLoading && filteredSessions.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-(--text-muted)">
                    {sessions.length === 0 ? 'No active sessions in the last 24 h' : 'No sessions match your search.'}
                  </td></tr>
                )}
                {pagedSessions.map((s) => {
                  return (
                    <tr key={s.session_id} className="border-b border-(--border-subtle)">
                      <td className="p-2 font-medium">{s.user_name}</td>
                      <td className="p-2 text-center">{ROLE_LABELS[s.user_role] ?? s.user_role}</td>
                      <td className="p-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {s.ip_address || 'Unknown IP'}
                          </span>
                          {s.device && (
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.device}</span>
                          )}
                        </div>
                      </td>
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

      <ConfirmDangerModal
        open={unlockId !== null}
        title="Unlock this account?"
        message="The user will be able to log in again from the IP that triggered the lock — it will be added to their trusted IPs."
        confirmLabel="Unlock Account"
        onConfirm={handleConfirmUnlock}
        onCancel={() => !unlocking && setUnlockId(null)}
      />
    </div>
  )
}
