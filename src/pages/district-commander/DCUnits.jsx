import { Fragment, useState, useEffect } from 'react'
import { AlertTriangle, StickyNote } from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import { getPerformanceScoreStyle } from '../../data/mockDistrictCommanderData'
import { listVehicles } from '../../api/vehicles'
import { listUnitPerformance } from '../../api/reporting'

function fmtTime(minutes) {
  if (minutes == null) return '—'
  return `${Number(minutes).toFixed(1)}m`
}

function fmtPct(rate) {
  if (rate == null) return '—'
  return `${Math.round(rate * 100)}%`
}

function scoreFromPerf(perf) {
  if (!perf) return null
  if (perf.on_time_rate != null) return Math.round(perf.on_time_rate * 100)
  return null
}

export default function DCUnits() {
  const district = getDistrictCommanderDistrict()
  const districtId = sessionStorage.getItem('resq-district-id') || undefined

  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [noteFor, setNoteFor] = useState(null)
  const [draftNote, setDraftNote] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const params = districtId ? { districtId } : {}
    Promise.all([listVehicles(params), listUnitPerformance()])
      .then(([vehicles, performances]) => {
        const perfMap = {}
        for (const p of performances) {
          const vid = p.vehicle_id
          if (!perfMap[vid] || (p.computed_at ?? '') > (perfMap[vid].computed_at ?? '')) {
            perfMap[vid] = p
          }
        }
        setUnits(vehicles.map((v) => {
          const perf = perfMap[v.vehicle_id] ?? null
          return {
            ...v,
            perf,
            score: scoreFromPerf(perf),
            supervisor_note: '',
          }
        }))
      })
      .catch(() => setError('Failed to load unit data'))
      .finally(() => setLoading(false))
  }, [])

  const attention = units.filter((u) => u.score != null && u.score < 70)

  const saveNote = (vehicleId) => {
    setUnits((list) =>
      list.map((u) => u.vehicle_id === vehicleId ? { ...u, supervisor_note: draftNote } : u)
    )
    setNoteFor(null)
    setDraftNote('')
    setToast('Note saved locally (no backend persistence yet)')
    setTimeout(() => setToast(null), 2500)
  }

  const avgScore = units.filter((u) => u.score != null).length
    ? Math.round(units.filter((u) => u.score != null).reduce((a, u) => a + u.score, 0) / units.filter((u) => u.score != null).length)
    : null

  return (
    <div className="portal-page flex flex-col gap-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] dispatcher-surface px-4 py-2.5 text-[13px] font-medium shadow-lg" style={{ borderLeft: '3px solid var(--accent)' }}>
          {toast}
        </div>
      )}

      <DCPageHeader title="Unit Performance" eyebrow="District Commander" subtitle={district ? `All units assigned to ${district} District.` : 'All units in your district.'} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Total Units" value={loading ? '—' : String(units.length)} />
        <MetricCard label="Avg Performance Score" value={loading ? '—' : (avgScore != null ? `${avgScore}%` : '—')} />
        <MetricCard
          label="Units Needing Attention"
          value={loading ? '—' : String(attention.length)}
          hintTone={attention.length > 0 ? 'critical' : 'positive'}
          className={attention.length > 0 ? 'border border-(--status-critical)' : ''}
        />
      </div>

      <div className="dispatcher-surface table-scroll">
        <table className="w-full min-w-[960px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-(--text-muted) border-b border-(--border-subtle)">
              <th className="py-2 px-3">Plate</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Agency</th>
              <th className="py-2 px-3">Incidents</th>
              <th className="py-2 px-3">Avg Response</th>
              <th className="py-2 px-3">On-Time Rate</th>
              <th className="py-2 px-3">Performance</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="py-6 text-center text-[13px] text-(--text-muted)">Loading units…</td></tr>
            )}
            {error && !loading && (
              <tr><td colSpan={9} className="py-6 text-center text-[13px]" style={{ color: 'var(--status-critical)' }}>{error}</td></tr>
            )}
            {!loading && !error && units.length === 0 && (
              <tr><td colSpan={9} className="py-6 text-center text-[13px] text-(--text-muted)">No units found for this district.</td></tr>
            )}
            {!loading && !error && units.map((u) => {
              const scoreStyle = u.score != null ? getPerformanceScoreStyle(u.score) : {}
              return (
                <Fragment key={u.vehicle_id}>
                  <tr className="border-b border-(--border-subtle) group">
                    <td className="py-3 px-3 font-mono font-bold text-(--accent)">{u.plate_number}</td>
                    <td className="py-3 px-3">{u.vehicle_type}</td>
                    <td className="py-3 px-3 text-(--text-secondary)">{u.agency_name ?? '—'}</td>
                    <td className="py-3 px-3 font-mono">{u.perf?.incidents_resolved ?? '—'}</td>
                    <td className="py-3 px-3 font-mono">{fmtTime(u.perf?.avg_response_time)}</td>
                    <td className="py-3 px-3 font-mono">{fmtPct(u.perf?.on_time_rate)}</td>
                    <td className="py-3 px-3">
                      {u.score != null ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold font-mono" style={scoreStyle}>
                          {u.score}%
                        </span>
                      ) : (
                        <span className="text-(--text-muted) text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-(--text-secondary) capitalize">{u.status}</td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        className="opacity-60 group-hover:opacity-100 text-(--text-muted) hover:text-(--accent) bg-transparent border-none cursor-pointer"
                        onClick={() => {
                          setNoteFor(u.vehicle_id)
                          setDraftNote(u.supervisor_note || '')
                        }}
                        aria-label="Add note"
                      >
                        <StickyNote size={16} />
                      </button>
                    </td>
                  </tr>
                  {noteFor === u.vehicle_id && (
                    <tr>
                      <td colSpan={9} className="px-3 pb-3 bg-(--bg-elevated)/40">
                        <textarea
                          className="dispatcher-input dispatcher-textarea w-full mb-2"
                          rows={2}
                          value={draftNote}
                          onChange={(e) => setDraftNote(e.target.value)}
                          placeholder="Supervisor note..."
                        />
                        <div className="flex gap-2">
                          <button type="button" className="dispatcher-btn-primary text-[11px] py-1.5 px-3" onClick={() => saveNote(u.vehicle_id)}>
                            Save Note
                          </button>
                          <button type="button" className="dispatcher-btn-ghost text-[11px]" onClick={() => setNoteFor(null)}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {attention.length > 0 && (
        <div className="dispatcher-surface p-4" style={{ borderLeft: '4px solid var(--status-critical)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} style={{ color: 'var(--status-critical)' }} />
            <h2 className="text-[14px] font-bold m-0 text-(--text-primary)">Units Requiring Attention</h2>
          </div>
          <ul className="m-0 pl-4 text-[12px] text-(--text-secondary) space-y-2">
            {attention.map((u) => (
              <li key={u.vehicle_id}>
                <span className="font-mono font-bold text-(--accent)">{u.plate_number}</span> — Below performance threshold (score: {u.score}%)
                {u.supervisor_note ? ` · Note: ${u.supervisor_note}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
