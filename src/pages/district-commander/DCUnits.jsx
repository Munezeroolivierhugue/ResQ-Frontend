import { Fragment, useState } from 'react'
import { AlertTriangle, StickyNote } from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import DCPageHeader from '../../components/district-commander/DCPageHeader'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'
import { DC_UNITS, getPerformanceScoreStyle } from '../../data/mockDistrictCommanderData'

export default function DCUnits() {
  const district = getDistrictCommanderDistrict()
  const [units, setUnits] = useState(() => DC_UNITS.map((u) => ({ ...u })))
  const [noteFor, setNoteFor] = useState(null)
  const [draftNote, setDraftNote] = useState('')

  const attention = units.filter((u) => u.score < 70)

  const saveNote = (id) => {
    setUnits((list) => list.map((u) => (u.id === id ? { ...u, note: draftNote } : u)))
    setNoteFor(null)
    setDraftNote('')
  }

  return (
    <div className="portal-page flex flex-col gap-6">
      <DCPageHeader title="Unit Performance" subtitle={`All units assigned to ${district} District.`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Total Units" value="18" />
        <MetricCard label="Avg Performance Score" value="84%" />
        <MetricCard
          label="Units Needing Attention"
          value={String(attention.length)}
          hintTone={attention.length > 0 ? 'critical' : 'positive'}
          className={attention.length > 0 ? 'border border-(--status-critical)' : ''}
        />
      </div>

      <div className="dispatcher-surface table-scroll">
        <table className="w-full min-w-[960px] text-left border-collapse text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-(--text-muted) border-b border-(--border-subtle)">
              <th className="py-2 px-3">Unit ID</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Incidents Handled</th>
              <th className="py-2 px-3">Avg Response Time</th>
              <th className="py-2 px-3">AI Acceptance</th>
              <th className="py-2 px-3">Performance Score</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => {
              const scoreStyle = getPerformanceScoreStyle(u.score)
              return (
                <Fragment key={u.id}>
                  <tr className="border-b border-(--border-subtle) group">
                    <td className="py-3 px-3 font-mono font-bold text-(--accent)">{u.id}</td>
                    <td className="py-3 px-3">{u.type}</td>
                    <td className="py-3 px-3 font-mono">{u.incidents}</td>
                    <td className="py-3 px-3 font-mono">{u.avgResponse}</td>
                    <td className="py-3 px-3 font-mono">{u.aiRate}%</td>
                    <td className="py-3 px-3">
                      <span
                        className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold font-mono"
                        style={scoreStyle}
                      >
                        {u.score}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-(--text-secondary)">{u.status}</td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        className="opacity-60 group-hover:opacity-100 text-(--text-muted) hover:text-(--accent) bg-transparent border-none cursor-pointer"
                        onClick={() => {
                          setNoteFor(u.id)
                          setDraftNote(u.note || '')
                        }}
                        aria-label="Add note"
                      >
                        <StickyNote size={16} />
                      </button>
                    </td>
                  </tr>
                  {noteFor === u.id && (
                    <tr>
                      <td colSpan={8} className="px-3 pb-3 bg-(--bg-elevated)/40">
                        <textarea
                          className="dispatcher-input dispatcher-textarea w-full mb-2"
                          rows={2}
                          value={draftNote}
                          onChange={(e) => setDraftNote(e.target.value)}
                          placeholder="Supervisor note..."
                        />
                        <div className="flex gap-2">
                          <button type="button" className="dispatcher-btn-primary text-[11px] py-1.5 px-3" onClick={() => saveNote(u.id)}>
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
        <div
          className="dispatcher-surface p-4"
          style={{ borderLeft: '4px solid var(--status-critical)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} style={{ color: 'var(--status-critical)' }} />
            <h2 className="text-[14px] font-bold m-0 text-(--text-primary)">Units Requiring Attention</h2>
          </div>
          <ul className="m-0 pl-4 text-[12px] text-(--text-secondary) space-y-2">
            {attention.map((u) => (
              <li key={u.id}>
                <span className="font-mono font-bold text-(--accent)">{u.id}</span> — Below performance threshold
                {u.score < 70 ? ' — consider retraining or review' : ''}
                {u.note ? ` · Note: ${u.note}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
