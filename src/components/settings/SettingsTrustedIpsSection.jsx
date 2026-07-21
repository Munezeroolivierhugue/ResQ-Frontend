import { useEffect, useState } from 'react'
import { ShieldCheck, Plus, Trash2, MapPin } from 'lucide-react'
import { listTrustedIps, addTrustedIp, removeTrustedIp } from '../../api/trustedIps'

/**
 * Lets any authenticated user (any role) view and manage the IP addresses
 * their account will accept logins from. Logging in from an IP not on this
 * list — once at least one is on file — locks the account until an admin or
 * (for district roles) their District Commander unlocks it.
 */
export default function SettingsTrustedIpsSection({ onSuccess }) {
  const [ips, setIps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [manualIp, setManualIp] = useState('')
  const [manualLabel, setManualLabel] = useState('')
  const [removingId, setRemovingId] = useState(null)

  function refresh() {
    setLoading(true)
    listTrustedIps()
      .then((data) => setIps(data))
      .catch(() => setError('Could not load trusted IPs.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { Promise.resolve().then(() => refresh()) }, [])

  async function handleAddCurrent() {
    setAdding(true)
    setError('')
    try {
      await addTrustedIp()
      refresh()
      onSuccess?.()
    } catch {
      setError('Could not add your current IP. Try again.')
    } finally {
      setAdding(false)
    }
  }

  async function handleAddManual(e) {
    e.preventDefault()
    if (!manualIp.trim()) return
    setAdding(true)
    setError('')
    try {
      await addTrustedIp({ ipAddress: manualIp.trim(), label: manualLabel.trim() || undefined })
      setManualIp('')
      setManualLabel('')
      refresh()
      onSuccess?.()
    } catch {
      setError('Could not add that IP address. Check the format and try again.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(id) {
    setRemovingId(id)
    try {
      await removeTrustedIp(id)
      setIps((prev) => prev.filter((ip) => ip.id !== id))
      onSuccess?.()
    } catch {
      setError('Could not remove that trusted IP.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="mt-8">
      <div className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-3" style={{ fontFamily: 'var(--font-display)' }}>
        Trusted IP Addresses
      </div>
      <div
        className="flex gap-3 p-3 rounded-lg mb-4 text-[13px] text-(--text-secondary)"
        style={{ background: 'var(--accent-ghost)', border: '1px solid var(--border)' }}
      >
        <ShieldCheck size={18} className="text-(--accent) shrink-0 mt-0.5" />
        <p className="m-0 leading-relaxed">
          Logging in from an IP address that isn&apos;t on this list will lock your account until an
          administrator (or your District Commander) unlocks it. Add this device&apos;s IP now so future
          logins from here are never blocked.
        </p>
      </div>

      {error && (
        <p className="text-[12px] mb-3" style={{ color: 'var(--status-critical)' }}>{error}</p>
      )}

      <button
        type="button"
        className="dispatcher-btn-primary flex items-center gap-2 mb-4"
        disabled={adding}
        onClick={handleAddCurrent}
      >
        <MapPin size={16} />
        {adding ? 'Adding…' : 'Add my current IP'}
      </button>

      <form onSubmit={handleAddManual} className="flex flex-wrap items-end gap-2 mb-5">
        <label className="settings-form-field dispatcher-field flex-1 min-w-[160px]">
          <span className="field-label">IP address (pre-authorize)</span>
          <input
            type="text"
            className="dispatcher-input w-full h-9 px-3"
            placeholder="e.g. 196.12.45.67"
            value={manualIp}
            onChange={(e) => setManualIp(e.target.value)}
          />
        </label>
        <label className="settings-form-field dispatcher-field flex-1 min-w-[160px]">
          <span className="field-label">Label (optional)</span>
          <input
            type="text"
            className="dispatcher-input w-full h-9 px-3"
            placeholder="e.g. Home network"
            value={manualLabel}
            onChange={(e) => setManualLabel(e.target.value)}
          />
        </label>
        <button type="submit" className="dispatcher-btn-outline flex items-center gap-1.5 h-9" disabled={adding || !manualIp.trim()}>
          <Plus size={14} /> Add
        </button>
      </form>

      {loading ? (
        <div className="text-[12px] text-(--text-muted) py-2">Loading trusted IPs…</div>
      ) : ips.length === 0 ? (
        <p className="text-[12px] text-(--text-secondary)">No trusted IPs on file yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {ips.map((ip) => (
            <div key={ip.id} className="flex items-center gap-3 p-3 rounded-lg border border-(--border) bg-(--bg-input)">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-mono font-semibold">{ip.ip_address}</div>
                <div className="text-[12px] text-(--text-secondary)">
                  {ip.label || 'No label'} · Added {ip.added_at ? new Date(ip.added_at).toLocaleDateString() : '—'}
                </div>
              </div>
              <button
                type="button"
                className="text-[12px] font-semibold bg-transparent border-none cursor-pointer inline-flex items-center gap-1"
                style={{ color: 'var(--status-critical)' }}
                disabled={removingId === ip.id}
                onClick={() => handleRemove(ip.id)}
              >
                <Trash2 size={13} />
                {removingId === ip.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
