import { ChevronRight, Clock, UserCheck, CalendarDays, Plus, Pencil, Circle } from 'lucide-react'
import { mockShiftOfficers } from '../../data/mockData'

const SHIFTS = [
  { officer: 'Jean Bosco',   start: 6,  end: 14, color: '#D4FF1E' },
  { officer: 'Marie Claire', start: 6,  end: 14, color: '#D4FF1E' },
  { officer: 'Patrick',      start: 0,  end: 24, color: '#2196C8' },
  { officer: 'Diane',        start: 14, end: 22, color: '#F07820' },
  { officer: 'Eric',         start: 22, end: 30, color: '#879D1F' },
]

const LEGEND = [
  { color: '#D4FF1E', label: 'Day Shift (06–14)' },
  { color: '#F07820', label: 'Evening Shift (14–22)' },
  { color: '#879D1F', label: 'Night Shift (22–06)' },
  { color: '#2196C8', label: '24h Supervisor' },
]

function ShiftBlock({ start, end, color }) {
  const left  = (start / 24) * 100
  const width = ((Math.min(end, 24) - start) / 24) * 100
  return (
    <div className="absolute h-7 rounded-md flex items-center pl-2 top-1/2 -translate-y-1/2"
      style={{ left: `${left}%`, width: `${width}%`, background: color + '28', border: `1px solid ${color}70` }}>
      <span className="text-[10px] font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color, fontFamily: 'var(--font-mono)' }}>
        {String(start).padStart(2, '0')}:00 – {String(Math.min(end, 24)).padStart(2, '0')}:00
      </span>
    </div>
  )
}

export default function ShiftManagement() {
  const currentHour = new Date().getHours()

  return (
    <div className="p-6">

      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] text-(--text-muted)">Dispatcher</span>
          <ChevronRight size={12} className="text-(--text-muted)" />
          <span className="text-[12px] text-(--text-secondary)">Shift Management</span>
        </div>
        <h1 className="text-[26px] font-bold m-0 tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>SHIFT MANAGEMENT</h1>
      </div>

      <div className="grid grid-cols-2 gap-5">

        <div>
          <div className="bg-(--bg-surface) border border-(--border) rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3.5">
              <Clock size={15} color="var(--accent)" />
              <span className="text-[13px] font-bold tracking-[0.06em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>Current Shift</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Start Time',   value: '06:00',            mono: true },
                { label: 'End Time',     value: '14:00',            mono: true },
                { label: 'Supervisor',   value: 'Patrick Habimana', mono: false },
                { label: 'Active Units', value: '4',                mono: true },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-[10px] text-(--text-muted) mb-0.75 font-semibold tracking-[0.06em] uppercase">{item.label}</div>
                  <div className="text-sm font-semibold text-(--text-primary)" style={{ fontFamily: item.mono ? 'var(--font-mono)' : 'var(--font-body)' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-(--bg-surface) border border-(--border) rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-(--border) flex items-center gap-2">
              <UserCheck size={15} color="var(--accent)" />
              <span className="text-[13px] font-bold tracking-[0.04em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>Officers on Shift</span>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-(--bg-base)">
                  {['Officer', 'Role', 'Status', 'Incidents', 'Break'].map(col => (
                    <th key={col} className="px-3.5 py-2 text-left field-label border-b border-(--border)">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockShiftOfficers.map(off => (
                  <tr key={off.id} className="border-b border-(--border-subtle) hover:bg-(--bg-elevated) transition-colors">
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-(--accent-ghost) border border-(--accent) flex items-center justify-center text-[10px] font-bold text-(--accent) shrink-0 tracking-[0.04em]" style={{ fontFamily: 'var(--font-display)' }}>
                          {off.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13px] font-medium">{off.name}</span>
                      </div>
                    </td>
                    <td className="px-3.5 text-[12px] text-(--text-secondary)">{off.role}</td>
                    <td className="px-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full inline-block"
                          style={{
                            background: off.status === 'active' ? 'var(--status-low)' : 'var(--status-offline)',
                            ...(off.status === 'active' ? { animation: 'pulse 2s infinite' } : {}),
                          }} />
                        <span className="text-[12px] text-(--text-secondary) capitalize">{off.status}</span>
                      </div>
                    </td>
                    <td className="px-3.5 text-[13px] font-semibold text-(--text-primary)" style={{ fontFamily: 'var(--font-mono)' }}>{off.incidents}</td>
                    <td className="px-3.5">
                      {off.onBreak
                        ? <span className="inline-flex items-center px-2.25 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.07em] bg-(--status-medium-bg) text-(--status-medium)" style={{ fontFamily: 'var(--font-body)' }}>ON BREAK</span>
                        : <span className="text-[12px] text-(--text-muted)">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-(--bg-surface) border border-(--border) rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={15} color="var(--accent)" />
            <span className="text-[13px] font-bold tracking-[0.06em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>Shift Planner — 24h View</span>
          </div>

          <div className="flex mb-2 pl-25">
            {[0, 4, 8, 12, 16, 20, 24].map(h => (
              <div key={h} className="text-[10px] text-(--text-muted)" style={{ flex: h === 24 ? 0 : 1, fontFamily: 'var(--font-mono)' }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div className="relative">
            {SHIFTS.map((shift, i) => (
              <div key={i} className="flex items-center mb-2 h-11">
                <div className="w-25 text-[12px] text-(--text-secondary) shrink-0 pr-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  {shift.officer}
                </div>
                <div className="flex-1 relative h-full bg-(--bg-elevated) rounded-md">
                  <ShiftBlock start={shift.start} end={shift.end} color={shift.color} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-(--status-critical) opacity-80 z-[2] rounded-sm"
                    style={{ left: `${(currentHour / 24) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3.5 mt-4 flex-wrap">
            {LEGEND.map(l => (
              <div key={l.label} className="flex items-center gap-1.25">
                <Circle size={10} fill={l.color} color={l.color} />
                <span className="text-[11px] text-(--text-secondary)" style={{ fontFamily: 'var(--font-body)' }}>{l.label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-(--accent) text-(--text-on-accent) font-bold text-[13px] tracking-[0.04em] uppercase rounded-lg border-none cursor-pointer hover:bg-(--accent-dim) transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
              <Plus size={14} /> Assign Shift
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-transparent border border-(--border) text-(--text-primary) font-semibold text-[13px] rounded-lg cursor-pointer hover:bg-(--bg-elevated) hover:border-(--accent) transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
              <Pencil size={14} /> Edit Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
