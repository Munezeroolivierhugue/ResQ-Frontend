import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, LogOut, AlertCircle } from 'lucide-react'
import { useFieldResponderStore } from '../../store/fieldResponderStore'
import { useToastStore } from '../../store/toastStore'
import { getCurrentUser } from '../../utils/authSession'
import { getMyStats } from '../../api/fieldResponderStats'

// This screen has no dedicated "shift timeline" / "handoff notes" endpoint
// on the backend (nothing in ShiftController or FieldReportController tracks
// a per-shift event log or free-text handoff notes for a responder), so that
// section was removed rather than kept showing fabricated entries — a
// follow-up would need a real backend table for that if this feature is
// wanted. The outstanding-reports queue also has no real source yet.
const outstanding = []

export default function FRShiftEnd() {
  const navigate = useNavigate()
  const endShift = useFieldResponderStore((s) => s.endShift)
  const pushToast = useToastStore((s) => s.pushToast)
  const hasActiveAssignment = useFieldResponderStore((s) => s.hasActiveAssignment)
  const assignmentStage = useFieldResponderStore((s) => s.assignmentStage)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [stats, setStats] = useState(null)
  const user = getCurrentUser()

  useEffect(() => {
    getMyStats().then(setStats).catch(() => {})
  }, [])

  const STATS = [
    [String(stats?.incidents_today ?? '—'), 'Incidents'],
    [stats?.avg_response_minutes_today != null ? `${stats.avg_response_minutes_today}m` : '—', 'Avg response'],
    [String(stats?.reports_filed_today ?? '—'), 'Reports filed'],
  ]

  const reportBlocked = outstanding.length > 0
  const assignmentBlocked = hasActiveAssignment && assignmentStage !== 'incident_clear'
  const blocked = reportBlocked || assignmentBlocked

  const confirmEnd = () => {
    endShift()
    pushToast({ variant: 'success', title: 'Shift Ended', message: `See you next time, ${(user?.full_name || 'Officer').split(' ')[0]}` })
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
              pushToast({ variant: 'error', title: 'Cannot End Shift', message: 'Cannot end shift with active assignment. Complete or transfer the current incident first.' })
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
