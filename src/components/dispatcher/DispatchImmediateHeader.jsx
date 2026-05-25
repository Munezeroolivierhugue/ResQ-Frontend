import { Check } from 'lucide-react'

export function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function DispatchImmediateHeader({ elapsed, incidentId, omNotified }) {
  return (
    <header className="shrink-0 border-b border-(--border) bg-(--bg-surface) px-5 py-4 flex flex-wrap items-center gap-4 justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="dispatch-immediate-critical-pulse" aria-hidden />
        <span
          className="text-[11px] font-bold tracking-[0.14em] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-critical)' }}
        >
          CRITICAL DISPATCH
        </span>
      </div>

      <div className="text-center flex-1 min-w-[200px]">
        <div
          className="text-[10px] text-(--text-muted) uppercase tracking-wider mb-0.5"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          INCIDENT ELAPSED TIME
        </div>
        <div
          className="text-[2rem] font-bold text-(--accent) tabular-nums leading-none"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {formatElapsed(elapsed)}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end">
        {incidentId && (
          <span
            className="text-[12px] font-bold text-(--accent) px-2 py-1 rounded bg-(--accent-ghost)"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {incidentId}
          </span>
        )}
        {omNotified && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded"
            style={{
              background: 'var(--status-low-bg)',
              color: 'var(--status-low)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <Check size={12} />
            OPERATIONS MANAGER NOTIFIED
          </span>
        )}
      </div>
    </header>
  )
}
