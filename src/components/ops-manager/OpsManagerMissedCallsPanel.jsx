import { Phone, PhoneMissed, PhoneCall, PhoneForwarded } from 'lucide-react'
import { OPS_MISSED_CALLS } from '../../data/mockOpsManagerData'

export default function OpsManagerMissedCallsPanel() {
  const calls = OPS_MISSED_CALLS
  const count = calls.length

  return (
    <div className="dispatcher-surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-(--border-subtle)">
        <div className="flex items-center gap-2 min-w-0">
          <PhoneMissed size={16} style={{ color: 'var(--status-critical)' }} aria-hidden />
          <span className="text-[14px] font-semibold text-(--text-primary)">Missed Calls</span>
          {count > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-bold"
              style={{
                background: 'var(--status-critical-bg)',
                color: 'var(--status-critical)',
              }}
            >
              {count}
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-(--text-muted)">Last 60 minutes</span>
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center justify-center text-center" style={{ padding: '1.25rem' }}>
          <PhoneForwarded size={20} style={{ color: 'var(--status-low)' }} aria-hidden />
          <p className="text-[12px] text-(--text-muted) m-0 mt-2">No missed calls in the last hour</p>
        </div>
      ) : (
        <div>
          {calls.map((call) => (
            <div
              key={call.id}
              className="flex flex-wrap items-center gap-3 border-b border-(--border-subtle) last:border-0"
              style={{ padding: '0.65rem 0.85rem' }}
            >
              <div className="flex items-center gap-2 min-w-[140px] flex-1">
                <Phone size={14} className="text-(--text-muted) shrink-0" aria-hidden />
                <span className="font-mono text-[12px] text-(--text-primary)">{call.phoneMasked}</span>
              </div>
              <div className="shrink-0">
                <div className="text-[10px] uppercase text-(--text-muted) tracking-wide">Called</div>
                <div className="font-mono text-[12px] text-(--text-secondary)">{call.calledAt}</div>
              </div>
              <div className="shrink-0">
                <div className="text-[10px] uppercase text-(--text-muted) tracking-wide">Waited</div>
                <div className="font-mono text-[12px] text-(--text-secondary)">{call.waited}</div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 shrink-0 cursor-pointer font-semibold transition-colors hover:bg-(--accent-ghost)"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  borderRadius: '6px',
                  padding: '0.3rem 0.65rem',
                  fontSize: '11px',
                }}
              >
                <PhoneCall size={12} aria-hidden />
                Call Back
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
