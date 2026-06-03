import { useState } from 'react'
import { Plus, Pencil, Share2 } from 'lucide-react'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { ANALYST_LIBRARY_ROWS, ANALYST_SCHEDULES } from '../../data/mockAnalystData'

const TABS = ['Report Library', 'Scheduled Delivery']

export default function AnalystLibrary() {
  const [tab, setTab] = useState(TABS[0])
  const [annotate, setAnnotate] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <AnalystPageHeader
        title="Report Library & Scheduled Delivery"
        subtitle="All reports, schedules, and access management."
      />

      <div className="flex flex-wrap gap-2 border-b border-(--border) pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className="text-[12px] font-semibold px-4 py-2 cursor-pointer border-none bg-transparent"
            style={{
              color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
        {tab === TABS[1] && (
          <button
            type="button"
            className="dispatcher-btn-primary text-[12px] h-9 ml-auto inline-flex items-center gap-1"
            onClick={() => setShowScheduleModal(true)}
          >
            <Plus size={14} />
            Create New Schedule
          </button>
        )}
      </div>

      {tab === TABS[0] && (
        <>
          <div className="flex flex-wrap gap-2">
            <input className="dispatcher-input h-10 flex-1 min-w-[200px]" placeholder="Search by type, district, keyword..." />
            <select className="dispatcher-input h-10 w-36 text-[12px]"><option>Type</option></select>
            <select className="dispatcher-input h-10 w-36 text-[12px]"><option>Date range</option></select>
            <select className="dispatcher-input h-10 w-32 text-[12px]"><option>Author</option></select>
            <select className="dispatcher-input h-10 w-36 text-[12px]"><option>District</option></select>
          </div>

          <div className={`flex gap-4 ${annotate ? '' : ''}`}>
            <div className="dispatcher-surface overflow-x-auto flex-1 min-w-0">
              <table className="w-full text-[12px] min-w-[720px]">
                <thead>
                  <tr className="text-(--text-muted) border-b border-(--border)">
                    <th className="text-left p-3">Report Name</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">District</th>
                    <th className="p-3">Author</th>
                    <th className="p-3">Generated</th>
                    <th className="text-left p-3">Shared With</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ANALYST_LIBRARY_ROWS.map((row) => (
                    <tr key={row.name} className="border-b border-(--border-subtle) dispatcher-table-row">
                      <td className="p-3 font-medium">{row.name}</td>
                      <td className="p-3">{row.type}</td>
                      <td className="p-3">{row.district}</td>
                      <td className="p-3">{row.author}</td>
                      <td className="p-3 font-mono">{row.generated}</td>
                      <td className="p-3">{row.shared}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          <button type="button" className="dispatcher-btn-ghost text-[10px] h-7 px-2">Preview</button>
                          <button
                            type="button"
                            className="dispatcher-btn-ghost text-[10px] h-7 px-2 inline-flex items-center gap-0.5"
                            onClick={() => setAnnotate(row.name)}
                          >
                            <Pencil size={10} />
                            Annotate
                          </button>
                          <button type="button" className="dispatcher-btn-ghost text-[10px] h-7 px-2 inline-flex items-center gap-0.5">
                            <Share2 size={10} />
                            Share
                          </button>
                          <button type="button" className="text-[10px] h-7 px-2 bg-transparent border-none cursor-pointer text-(--text-muted) hover:text-(--status-critical)">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {annotate && (
              <div className="dispatcher-surface p-4 w-[280px] shrink-0">
                <h4 className="text-[13px] font-semibold m-0 mb-3">Add Annotation — {annotate}</h4>
                <textarea className="dispatcher-textarea min-h-[120px] w-full" placeholder="Add key findings, anomaly flags, or recommendations..." />
                <select className="dispatcher-input h-9 w-full mt-2 text-[12px]">
                  <option>Key Finding</option>
                  <option>Anomaly Flag</option>
                  <option>Recommendation</option>
                  <option>Context Note</option>
                </select>
                <button type="button" className="dispatcher-btn-primary w-full mt-3 text-[12px]">Save Annotation</button>
                <button type="button" className="dispatcher-btn-ghost w-full mt-2 text-[12px]" onClick={() => setAnnotate(null)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {tab === TABS[1] && (
        <div className="dispatcher-surface overflow-x-auto">
          <table className="w-full text-[12px] min-w-[720px]">
            <thead>
              <tr className="text-(--text-muted) border-b border-(--border)">
                <th className="text-left p-3">Schedule Name</th>
                <th className="text-left p-3">Report Type</th>
                <th className="text-left p-3">Frequency</th>
                <th className="p-3">Next Delivery</th>
                <th className="text-left p-3">Recipients</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ANALYST_SCHEDULES.map((row) => (
                <tr key={row.name} className="border-b border-(--border-subtle)">
                  <td className="p-3 font-medium">{row.name}</td>
                  <td className="p-3">{row.type}</td>
                  <td className="p-3">{row.frequency}</td>
                  <td className="p-3 font-mono">{row.next}</td>
                  <td className="p-3">{row.recipients}</td>
                  <td className="p-3">
                    <StatusBadge label={row.status} variant={row.status === 'ACTIVE' ? 'resolved' : 'handover'} />
                  </td>
                  <td className="p-3">
                    {row.status === 'ACTIVE' ? (
                      <>
                        <button type="button" className="dispatcher-btn-ghost text-[10px] h-7 px-2 mr-1">Edit</button>
                        <button type="button" className="dispatcher-btn-ghost text-[10px] h-7 px-2">Pause</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="dispatcher-btn-ghost text-[10px] h-7 px-2 mr-1">Resume</button>
                        <button type="button" className="text-[10px] h-7 px-2 text-(--status-critical) bg-transparent border-none cursor-pointer">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="dispatcher-surface p-6 w-full max-w-[520px]">
            <h3 className="text-[15px] font-bold m-0 mb-4">Create Schedule</h3>
            <div className="flex flex-col gap-3">
              <input className="dispatcher-input h-10" placeholder="Schedule name" />
              <select className="dispatcher-input h-10"><option>Report configuration</option></select>
              <select className="dispatcher-input h-10"><option>Weekly</option><option>Daily</option></select>
              <select className="dispatcher-input h-10"><option>Monday</option></select>
              <input type="time" className="dispatcher-input h-10" defaultValue="07:00" />
              <input className="dispatcher-input h-10" placeholder="Recipients (emails or roles)" />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button type="button" className="dispatcher-btn-ghost" onClick={() => setShowScheduleModal(false)}>Cancel</button>
              <button type="button" className="dispatcher-btn-primary" onClick={() => setShowScheduleModal(false)}>Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
