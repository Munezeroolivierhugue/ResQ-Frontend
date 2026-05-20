import { AlertTriangle, Phone, Mic, Pause, PhoneOff, PhoneIncoming } from 'lucide-react'
import { IntakePanel } from './IntakeUi'
import FieldLabel from '../ui/FieldLabel'

export default function LiveEmergencyBanner({ call }) {
  return (
    <IntakePanel className="border-(--status-critical) overflow-hidden">
      <div
        className="px-4 py-2 flex items-center gap-2 border-b border-(--border-subtle)"
        style={{ background: 'var(--status-critical-bg)' }}
      >
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ background: 'var(--status-critical)' }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ background: 'var(--status-critical)' }}
          />
        </span>
        <AlertTriangle size={14} style={{ color: 'var(--status-critical)' }} />
        <span
          className="text-[11px] font-bold tracking-[0.12em] uppercase"
          style={{ color: 'var(--status-critical)', fontFamily: 'var(--font-display)' }}
        >
          Live emergency call
        </span>
        <span className="ml-auto text-[10px] font-bold text-(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }}>
          {call.sessionId}
        </span>
      </div>

      <div className="p-4 md:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-4">
          {[
            { label: 'Caller number', value: call.callerNumber, mono: true },
            { label: 'Caller identity', value: call.callerIdentity },
            { label: 'Call duration', value: call.duration, mono: true },
            { label: 'Call status', value: call.status },
            { label: 'District', value: call.district },
            { label: 'Risk level', value: call.riskLevel },
          ].map((item) => (
            <div key={item.label}>
              <FieldLabel className="mb-0.5">{item.label}</FieldLabel>
              <div
                className="text-[13px] font-semibold text-(--text-primary)"
                style={item.mono ? { fontFamily: 'var(--font-mono)' } : undefined}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-none text-[11px] font-bold uppercase tracking-wide cursor-pointer"
            style={{
              background: 'var(--accent)',
              color: 'var(--text-on-accent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <PhoneIncoming size={14} />
            Accept call
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-(--border) bg-(--bg-input) text-(--text-primary) text-[11px] font-semibold cursor-pointer hover:bg-(--bg-elevated)"
          >
            <Mic size={14} />
            Mute
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-(--border) bg-(--bg-input) text-(--text-primary) text-[11px] font-semibold cursor-pointer hover:bg-(--bg-elevated)"
          >
            <Pause size={14} />
            Hold
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-[11px] font-semibold cursor-pointer hover:opacity-90"
            style={{
              borderColor: 'var(--status-critical)',
              color: 'var(--status-critical)',
              background: 'var(--status-critical-bg)',
            }}
          >
            <PhoneOff size={14} />
            End call
          </button>
          <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-[11px] text-(--text-muted)">
            <Phone size={12} className="text-(--status-low)" />
            Line connected · auto-intake active
          </span>
        </div>
      </div>
    </IntakePanel>
  )
}
