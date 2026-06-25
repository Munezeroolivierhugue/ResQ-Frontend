import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, LogOut, AlertCircle, Clock, CheckCircle2, Radio } from 'lucide-react'
import { FR_OFFICER, FR_OUTSTANDING_REPORTS, FR_SHIFT_HISTORY } from '../../data/mockFieldResponderData'
import { useFieldResponderStore } from '../../store/fieldResponderStore'

const STATS = [
  ['14', 'Incidents'],
  ['6.8m', 'Avg response'],
  ['94 km', 'Distance'],
  ['14', 'Reports filed'],
  ['87', 'Performance'],
  ['100%', 'GPS uptime'],
]

const SHIFT_TIMELINE = [
  { time: '08:00', label: 'Shift started · GPS active', done: true },
  { time: '09:15', label: 'INC-2387 · Theft · Nyamirambo', done: true },
  { time: '11:42', label: 'INC-2398 · Traffic · Remera', done: true },
  { time: '14:18', label: 'INC-2403 · Armed Robbery · Kimironko', done: true },
  { time: '16:00', label: 'Scheduled shift end', done: false },
]

export default function FRShiftEnd() {
  const navigate = useNavigate()
  const endShift = useFieldResponderStore((s) => s.endShift)
  const showToast = useFieldResponderStore((s) => s.showToast)
  const hasActiveAssignment = useFieldResponderStore((s) => s.hasActiveAssignment)
  const assignmentStage = useFieldResponderStore((s) => s.assignmentStage)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const outstanding = FR_OUTSTANDING_REPORTS
  const reportBlocked = outstanding.length > 0
  const assignmentBlocked = hasActiveAssignment && assignmentStage !== 'incident_clear'
  const blocked = reportBlocked || assignmentBlocked

  const confirmEnd = () => {
    endShift()
    showToast(`Shift ended · See you next time, ${FR_OFFICER.name.split(' ')[0]}`, 'success')
    setConfirmOpen(false)
    navigate('/field-responder/shift-start')
  }

  return (
    <div className="fr-page fr-page--fill">
      <div className="fr-page-fill-body">
        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="fr-card-header">
            <Moon size={16} className="text-(--accent)" />
            <span className="font-semibold text-[13px]">Shift Summary — Ready to End</span>
          </div>
          <div className="fr-perf-grid">
            {STATS.map(([val, label]) => (
              <div key={label} className="fr-perf-tile">
                <div className="fr-perf-value font-mono">{val}</div>
                <div className="fr-perf-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="fr-card-header">
            <Clock size={16} className="text-(--accent)" />
            <span className="font-semibold text-[13px]">Shift Timeline</span>
          </div>
          <div className="fr-divider" />
          <ul className="fr-shift-timeline">
            {SHIFT_TIMELINE.map((item) => (
              <li key={item.time} className={`fr-shift-timeline-item${item.done ? ' fr-shift-timeline-item--done' : ''}`}>
                <span className="fr-shift-timeline-time font-mono">{item.time}</span>
                <span className="fr-shift-timeline-label">{item.label}</span>
                {item.done && <CheckCircle2 size={14} className="fr-shift-timeline-check" aria-hidden />}
              </li>
            ))}
          </ul>
        </div>

        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="fr-card-header">
            <Radio size={16} className="text-(--accent)" />
            <span className="font-semibold text-[13px]">Handoff Notes</span>
          </div>
          <p className="text-[12px] text-(--text-secondary) m-0 mt-2 leading-relaxed">
            All incidents cleared. INC-2403 report filed. Unit P-12 fuel at 60% — next shift should refuel.
            No equipment issues to report.
          </p>
        </div>

        <div className="dispatcher-surface fr-card fr-card--tight">
          <div className="font-semibold text-[13px] mb-2">Recent Incidents</div>
          {FR_SHIFT_HISTORY.slice(0, 3).map((inc) => (
            <div key={inc.id} className="fr-shift-inc-row">
              <span className="font-mono text-[11px] text-(--accent)">{inc.id}</span>
              <span className="text-[12px] text-(--text-secondary) flex-1 truncate">{inc.type}</span>
              <span className="font-mono text-[11px] text-(--text-muted)">{inc.time}</span>
            </div>
          ))}
        </div>

        {assignmentBlocked && (
          <div className="fr-outstanding">
            <AlertCircle size={20} className="text-(--status-critical)" />
            <div className="font-semibold text-[13px] text-(--status-critical)">Active Assignment</div>
            <p className="text-[12px] text-(--status-critical) m-0 mt-2">
              Cannot end shift with active assignment. Complete or transfer the current incident first.
            </p>
          </div>
        )}

        {reportBlocked && (
          <div className="fr-outstanding">
            <AlertCircle size={20} className="text-(--status-critical)" />
            <div className="font-semibold text-[13px] text-(--status-critical)">Outstanding Reports</div>
            {outstanding.map((r) => (
              <div key={r.id} className="text-[12px] mt-2">
                {r.id} · {r.type} ·{' '}
                <button type="button" className="text-(--accent) bg-transparent border-none">
                  Complete now →
                </button>
              </div>
            ))}
            <p className="text-[12px] text-(--status-critical) m-0 mt-2">
              Complete all reports before ending shift.
            </p>
          </div>
        )}
      </div>

      <div className="fr-page-fill-footer">
        <button
          type="button"
          className={`fr-end-shift-btn${blocked ? ' fr-end-shift-btn--disabled' : ''}`}
          disabled={reportBlocked}
          onClick={() => {
            if (assignmentBlocked) {
              showToast('Cannot end shift with active assignment. Complete or transfer the current incident first.', 'critical')
              return
            }
            setConfirmOpen(true)
          }}
        >
          <LogOut size={20} />
          END SHIFT
        </button>
      </div>

      {confirmOpen && (
        <div className="fr-sheet-root" role="presentation">
          <button type="button" className="fr-sheet-backdrop" aria-label="Close" onClick={() => setConfirmOpen(false)} />
          <div className="fr-confirm-modal dispatcher-surface">
            <h3 className="text-[16px] font-bold m-0 mb-2">End your shift?</h3>
            <p className="text-[13px] text-(--text-secondary) m-0 mb-4">
              You will go offline and disappear from the dispatcher map.
            </p>
            <div className="flex gap-2">
              <button type="button" className="dispatcher-btn-ghost flex-1 fr-touch-input" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button type="button" className="fr-confirm-end flex-1" onClick={confirmEnd}>
                Confirm End Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
