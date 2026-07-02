import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, FileText, Rocket, BadgeCheck, Siren, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/dispatcher/PageHeader'
import SurfaceCard from '../../components/dispatcher/SurfaceCard'
import MetricCard from '../../components/dispatcher/MetricCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import DataTable from '../../components/dispatcher/DataTable'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { FormTextarea } from '../../components/dispatcher/FormControls'
import { getMyShifts, saveShiftNotes } from '../../api/shifts'
import { listIncidents } from '../../api/incidents'
import { getCurrentUser } from '../../utils/authSession'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

export default function ShiftHandover() {
  const navigate = useNavigate()
  const [sort, setSort] = useState('recent')
  const [officerNote, setOfficerNote] = useState('')
  // 'idle' | 'saving' | 'saved' | 'error'
  const [noteState, setNoteState] = useState('idle')

  const handleSaveNotes = async () => {
    if (!shift?.shift_id || noteState === 'saving') return
    setNoteState('saving')
    try {
      await saveShiftNotes(shift.shift_id, officerNote)
      setNoteState('saved')
      setTimeout(() => setNoteState('idle'), 2500)
    } catch {
      setNoteState('error')
    }
  }
  const [shift, setShift] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const currentUser = getCurrentUser()

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([getMyShifts(), listIncidents()]).then(([shiftsResult, incsResult]) => {
      const shifts = shiftsResult.status === 'fulfilled' ? shiftsResult.value : []
      const incs   = incsResult.status === 'fulfilled'  ? incsResult.value  : []
      const latest = shifts.sort((a, b) => new Date(b.shift_start) - new Date(a.shift_start))[0] ?? null
      setShift(latest)
      if (latest?.handover_notes) setOfficerNote(latest.handover_notes)
      if (latest?.shift_start) {
        const start = new Date(latest.shift_start)
        const end = latest.shift_end ? new Date(latest.shift_end) : new Date()
        const shiftIncs = incs.filter(i => { const t = new Date(i.call_time); return t >= start && t <= end })
        setIncidents(shiftIncs)
      } else {
        // No shift record — default to today (midnight → now)
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        setIncidents(incs.filter(i => i.call_time && new Date(i.call_time) >= startOfDay))
      }
    }).finally(() => setLoading(false))
  }, [])

  const resolved = incidents.filter(i => ['RESOLVED', 'resolved', 'CLOSED', 'closed'].includes(i.status)).length
  const critical = incidents.filter(i => i.severity === 'critical').length
  const avgResp = (() => {
    const ms = incidents.filter(i => i.response_time_minutes != null)
    return ms.length ? Math.round(ms.reduce((s, i) => s + i.response_time_minutes, 0) / ms.length) : null
  })()

  const period = shift
    ? `${fmtDate(shift.shift_start)} — ${shift.shift_end ? fmtDate(shift.shift_end) : 'Ongoing'}`
    : 'Current shift'
  const generatedAt = fmtDate(new Date().toISOString())

  const columns = [
    { key: 'incident_ref', label: 'Incident ID', render: (row) => (
      <span className="font-semibold text-(--accent)" style={{ fontFamily: 'var(--font-mono)' }}>{row.incident_ref}</span>
    ) },
    { key: 'incident_type', label: 'Type', render: (row) => (
      <span className="inline-flex items-center gap-2">
        <Siren size={14} className="text-(--accent) shrink-0" />
        {row.incident_type}
      </span>
    ) },
    { key: 'call_time', label: 'Time', render: (row) => (
      <span style={{ fontFamily: 'var(--font-mono)' }}>{row.call_time ? new Date(row.call_time).toLocaleString() : '—'}</span>
    ) },
    { key: 'address', label: 'Location', render: (row) => row.district ?? row.address ?? '—' },
    { key: 'status', label: 'Status', render: (row) => (
      <StatusBadge
        label={row.status === 'RESOLVED' || row.status === 'resolved' ? 'Resolved' : row.status}
        variant={row.status === 'RESOLVED' || row.status === 'resolved' ? 'resolved' : 'handover'}
      />
    ) },
  ]

  const sortedIncidents = [...incidents].sort((a, b) => {
    if (sort === 'type') return (a.incident_type ?? '').localeCompare(b.incident_type ?? '')
    if (sort === 'status') return (a.status ?? '').localeCompare(b.status ?? '')
    return new Date(b.call_time ?? 0) - new Date(a.call_time ?? 0)
  })

  return (
    <div className="portal-page dispatcher-page">
      <PageHeader
        breadcrumbCurrent="Shift handover"
        title="Shift handover summary"
        subtitle={`Comprehensive performance report for ${period}. Generated on ${generatedAt}.`}
        badges={<span className="dispatcher-eyebrow">Post-shift analysis</span>}
        actions={
          <>
            <button type="button" className="dispatcher-btn-ghost">
              <Globe size={14} />
              Review past shifts
            </button>
            <button type="button" className="dispatcher-btn-primary">
              <FileText size={14} />
              Generate handover PDF
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <MetricCard icon={Siren} label="Total Incidents" value={loading ? '…' : incidents.length} hint="This shift" hintTone="neutral" />
        <MetricCard icon={CheckCircle} label="Resolved" value={loading ? '…' : resolved} hint={`${incidents.length ? Math.round((resolved / incidents.length) * 100) : 0}% of shift`} hintTone="positive" />
        <MetricCard icon={AlertTriangle} label="Critical" value={loading ? '…' : critical} hint="High-priority incidents" hintTone={critical > 0 ? 'critical' : 'neutral'} />
        <MetricCard icon={Clock} label="Avg Response" value={loading ? '…' : (avgResp != null ? `${avgResp}m` : 'N/A')} hint="Target: 10 min" hintTone={avgResp != null && avgResp <= 10 ? 'positive' : 'critical'} />
      </div>

      <SurfaceCard className="mb-5" padding="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-(--border)">
          <SectionTitle
            title="Detailed incident log"
            badge={
              <span className="dispatcher-live-dot">
                <span className="dispatcher-live-dot-pulse" />
                Real-time archive
              </span>
            }
            className="mb-0"
          />
          <label className="flex items-center gap-2 text-[12px] text-(--text-secondary)">
            <span className="field-label mb-0">Sort</span>
            <select
              className="dispatcher-input dispatcher-select h-9 min-w-[140px]"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Recent first</option>
              <option value="type">By type</option>
              <option value="status">By status</option>
            </select>
          </label>
        </div>
        {loading ? (
          <div className="py-12 text-center text-[13px] text-(--text-muted)">Loading shift data…</div>
        ) : (
          <DataTable
            columns={columns}
            rows={sortedIncidents}
            footer={
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-(--text-muted)">
                  {incidents.length} incident{incidents.length !== 1 ? 's' : ''} this shift
                </span>
              </div>
            }
          />
        )}
      </SurfaceCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SurfaceCard padding="p-5 md:p-6 flex flex-col">
          <SectionTitle title="Commanding officer notes" className="mb-4" />
          <FormTextarea
            label="Handover notes"
            value={officerNote}
            onChange={setOfficerNote}
            placeholder="Document shift intensity, AI overrides, protocol changes, and overall performance for the incoming commander…"
            rows={6}
            className="flex-1 mb-0"
          />
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-(--border-subtle)">
            <div>
              <div className="text-[13px] font-semibold text-(--text-primary)">
                {currentUser?.full_name ?? currentUser?.email ?? 'Dispatcher'}
              </div>
              <div className="text-[11px] text-(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }}>
                {shift ? `Shift: ${shift.shift_id}` : 'No shift data'}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {noteState === 'error' && (
                <span className="text-[11px] font-semibold" style={{ color: 'var(--status-critical)' }}>
                  Save failed — retry
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={!shift || noteState === 'saving'}
                className="dispatcher-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                title={!shift ? 'No shift record to attach notes to' : undefined}
              >
                {noteState === 'saving' ? 'Saving…' : noteState === 'saved' ? 'Saved ✓' : 'Save notes'}
              </button>
              <BadgeCheck size={18} className="text-(--status-low) shrink-0" />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard padding="p-5 md:p-6 flex flex-col">
          <div className="flex items-start gap-3 mb-3">
            <span className="dispatcher-handover-icon">
              <Rocket size={22} />
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-(--text-primary) m-0">Shift ready for handover</h3>
              <p className="text-[12px] text-(--text-secondary) m-0 mt-1 leading-relaxed">
                All critical events documented. Performance metrics synchronized with central command
                intelligence.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="dispatcher-btn-outline w-full mt-auto"
            onClick={() => navigate('/login')}
          >
            Finalize & logout
          </button>
        </SurfaceCard>
      </div>
    </div>
  )
}
