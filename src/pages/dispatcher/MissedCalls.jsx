import { useState, useEffect } from 'react'
import { Phone, PhoneCall, PhoneMissed, Clock, X, CheckCircle } from 'lucide-react'
import { listMissedCalls, markCalledBack } from '../../api/missedCalls'

function maskPhone(num) {
  if (!num) return '—'
  const s = String(num)
  return s.slice(0, 7) + 'x xxx x' + s.slice(-2)
}

function adaptCall(m) {
  return {
    ...m,
    id: m.missed_call_id?.slice(0, 6).toUpperCase() ?? '—',
    phoneMasked: maskPhone(m.phone_number),
    calledAt: m.call_time ? new Date(m.call_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—',
    waited: m.wait_duration != null ? `${Math.floor(m.wait_duration / 60)}m ${m.wait_duration % 60}s` : '—',
  }
}

function WaitChip({ seconds }) {
  const over90 = seconds > 90
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded"
      style={{
        fontFamily: 'var(--font-display)',
        background: over90 ? 'var(--status-critical-bg)' : 'var(--status-warning-bg)',
        color: over90 ? 'var(--status-critical)' : 'var(--status-warning)',
      }}
    >
      <Clock size={10} />
      {Math.floor(seconds / 60)}m {seconds % 60}s
    </span>
  )
}

function StatusChip({ status }) {
  const isPending = status === 'pending'
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
      style={{
        fontFamily: 'var(--font-display)',
        background: isPending ? 'var(--status-critical-bg)' : 'var(--status-low-bg)',
        color: isPending ? 'var(--status-critical)' : 'var(--status-low)',
      }}
    >
      {isPending ? 'Pending' : 'Called back'}
    </span>
  )
}

function CallbackModal({ call, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl border border-(--border) overflow-hidden"
        style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--border)">
          <div className="flex items-center gap-2.5">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-ghost)', color: 'var(--accent)' }}
            >
              <PhoneCall size={14} />
            </span>
            <span
              className="text-[14px] font-bold text-(--text-primary)"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Confirm callback
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 rounded-lg border border-(--border) bg-transparent flex items-center justify-center cursor-pointer text-(--text-muted) hover:text-(--text-primary)"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-[13px] text-(--text-secondary) mb-3">
            You are about to log a callback to:
          </p>
          <div
            className="px-4 py-3 rounded-xl border border-(--border) bg-(--bg-input) mb-4"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <div className="text-[14px] font-bold text-(--text-primary)">{call.phoneMasked}</div>
            <div className="text-[11px] text-(--text-muted) mt-0.5">
              Missed at {call.calledAt} · waited {call.waited}
            </div>
          </div>
          <p className="text-[11px] text-(--text-muted) mb-4">
            This will mark the call as <strong>called_back</strong> and record your dispatcher ID and the current timestamp.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 dispatcher-btn-primary"
            >
              <PhoneCall size={14} />
              Confirm callback
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="dispatcher-btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MissedCalls() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('pending')
  const [callbackModal, setCallbackModal] = useState(null)
  const [justCallbacked, setJustCallbacked] = useState(new Set())

  useEffect(() => {
    listMissedCalls()
      .then((data) => setCalls(data.map(adaptCall)))
      .catch(() => setError('Failed to load missed calls'))
      .finally(() => setLoading(false))
  }, [])

  const pendingCount = calls.filter((c) => c.status === 'pending').length
  const displayed = tab === 'pending' ? calls.filter((c) => c.status === 'pending') : calls

  const handleCallback = async (id) => {
    try {
      const updated = await markCalledBack(id)
      setCalls((prev) => prev.map((c) => c.missed_call_id === id ? adaptCall(updated) : c))
      setJustCallbacked((prev) => new Set([...prev, id]))
    } catch { /* silent */ }
    setCallbackModal(null)
  }

  const confirmCallback = () => {
    handleCallback(callbackModal.missed_call_id)
  }

  return (
    <div className="portal-page dispatcher-page">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="dispatcher-eyebrow">Communications</span>
          <h1
            className="text-2xl font-bold m-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Missed Calls
          </h1>
        </div>
        {pendingCount > 0 && (
          <div
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold border"
            style={{
              background: 'var(--status-critical-bg)',
              color: 'var(--status-critical)',
              borderColor: 'color-mix(in srgb, var(--status-critical) 35%, transparent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <PhoneMissed size={14} />
            {pendingCount} call{pendingCount !== 1 ? 's' : ''} not yet returned
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg border border-(--border) bg-(--bg-surface) w-fit">
        {[
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'all', label: `All (${calls.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="px-4 py-1.5 rounded-md text-[12px] font-semibold border-none cursor-pointer transition-all"
            style={{
              fontFamily: 'var(--font-display)',
              background: tab === key ? 'var(--status-critical)' : 'transparent',
              color: tab === key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-(--bg-surface) border border-(--border) rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-(--text-muted)">
            <span className="text-[13px]">Loading missed calls…</span>
          </div>
        ) : error ? (
          <div className="py-16 flex flex-col items-center gap-3 text-(--text-muted)">
            <span className="text-[13px]" style={{ color: 'var(--status-critical)' }}>{error}</span>
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-(--text-muted)">
            <Phone size={28} style={{ color: 'var(--status-low)' }} />
            <span className="text-[13px]">No pending missed calls — all returned.</span>
          </div>
        ) : (
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-(--bg-base)">
                {['ID', 'Phone (masked)', 'Called At', 'Wait Time', 'Cascade', 'Status', 'Action'].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-2.5 text-left field-label border-b border-(--border) whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {displayed.map((call) => {
                const isNew = justCallbacked.has(call.missed_call_id)
                return (
                  <tr
                    key={call.missed_call_id}
                    className="border-b border-(--border-subtle) hover:bg-(--bg-elevated) transition-colors"
                    style={isNew ? { background: 'var(--status-low-bg)' } : {}}
                  >
                    <td
                      className="px-4 h-12 text-[12px] font-bold text-(--accent)"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {call.id}
                    </td>
                    <td
                      className="px-4 text-[13px] text-(--text-primary) font-medium"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {call.phoneMasked}
                    </td>
                    <td
                      className="px-4 text-[12px] text-(--text-secondary)"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {call.calledAt}
                    </td>
                    <td className="px-4">
                      <WaitChip seconds={call.wait_duration} />
                    </td>
                    <td className="px-4 text-[12px] text-(--text-secondary)">
                      {call.cascade_count === 0 ? (
                        <span className="text-(--text-muted)">Direct</span>
                      ) : (
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded"
                          style={{
                            background: 'var(--status-info-bg)',
                            color: 'var(--status-info)',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          +{call.cascade_count} re-route{call.cascade_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-4">
                      <StatusChip status={call.status} />
                    </td>
                    <td className="px-4">
                      {call.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => setCallbackModal(call)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-none cursor-pointer text-[11px] font-bold transition-opacity hover:opacity-80"
                          style={{
                            background: 'var(--accent)',
                            color: 'var(--text-on-accent)',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          <PhoneCall size={12} />
                          Callback
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-(--status-low)">
                          {isNew && <CheckCircle size={12} />}
                          {call.callback_time
                            ? new Date(call.callback_time).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Done'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[11px] text-(--text-muted) mt-3">
        Calls are masked per data-protection policy. Callback timestamps are logged against your dispatcher ID.
      </p>

      {callbackModal && (
        <CallbackModal
          call={callbackModal}
          onConfirm={confirmCallback}
          onCancel={() => setCallbackModal(null)}
        />
      )}
    </div>
  )
}
