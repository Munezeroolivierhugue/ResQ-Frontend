import { useState } from 'react'
import { Plus, Pencil, Share2, Calendar, Clock, FileText, Users, X } from 'lucide-react'
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
          <div className="dispatcher-surface p-5 rounded-xl border border-(--border) flex flex-wrap gap-6 items-end">
            <label className="flex flex-col gap-2 flex-[2] min-w-[200px]">
              <span className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-wider">Search Reports</span>
              <input className="dispatcher-input h-10 text-[13px]" placeholder="Search by type, district, keyword..." />
            </label>
            <label className="flex flex-col gap-2 flex-1 min-w-[120px]">
              <span className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-wider">Report Type</span>
              <select className="dispatcher-input h-10 text-[13px]">
                <option>All Types</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 flex-1 min-w-[120px]">
              <span className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-wider">Date Range</span>
              <select className="dispatcher-input h-10 text-[13px]">
                <option>All Dates</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 flex-1 min-w-[120px]">
              <span className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-wider">Author</span>
              <select className="dispatcher-input h-10 text-[13px]">
                <option>All Authors</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 flex-1 min-w-[120px]">
              <span className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-wider">District</span>
              <select className="dispatcher-input h-10 text-[13px]">
                <option>All Districts</option>
              </select>
            </label>
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
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="dispatcher-surface p-6 w-full max-w-[560px] rounded-2xl shadow-2xl flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-[18px] font-bold m-0 text-(--text-primary)">Create Schedule</h3>
                <p className="text-[12px] text-(--text-secondary) m-0 mt-1">Automate report delivery to stakeholders</p>
              </div>
              <button 
                type="button" 
                className="text-(--text-muted) hover:text-(--text-primary) bg-transparent border-none cursor-pointer p-1 rounded-lg hover:bg-(--bg-elevated) transition-colors"
                onClick={() => setShowScheduleModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Configuration Section */}
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-(--text-secondary) uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} className="text-(--accent)" /> Schedule Name
                  </span>
                  <input className="dispatcher-input h-10 w-full text-[13px]" placeholder="e.g., Weekly Executive Summary" />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-(--text-secondary) uppercase tracking-wider flex items-center gap-1.5">
                    Report Configuration
                  </span>
                  <select className="dispatcher-input h-10 w-full text-[13px]">
                    <option>May Response Time Summary</option>
                    <option>District Comparison Q1 2026</option>
                    <option>Dispatch Model Audit</option>
                  </select>
                </label>
              </div>

              {/* Timing Section */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-(--text-secondary) uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-(--accent)" /> Frequency
                  </span>
                  <select className="dispatcher-input h-10 w-full text-[13px]">
                    <option>Weekly</option>
                    <option>Daily</option>
                    <option>Monthly</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-(--text-secondary) uppercase tracking-wider flex items-center gap-1.5">
                    Delivery Day
                  </span>
                  <select className="dispatcher-input h-10 w-full text-[13px]">
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                  <span className="text-[12px] font-bold text-(--text-secondary) uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14} className="text-(--accent)" /> Time (EAT)
                  </span>
                  <input type="time" className="dispatcher-input h-10 w-full text-[13px]" defaultValue="07:00" />
                </label>
              </div>

              {/* Delivery Section */}
              <div className="pt-1">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-(--text-secondary) uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-(--accent)" /> Recipients
                  </span>
                  <input className="dispatcher-input h-10 w-full text-[13px]" placeholder="Enter emails, roles, or groups..." />
                  <span className="text-[11px] text-(--text-muted) mt-0.5">Separate multiple recipients with commas.</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8 justify-end">
              <button 
                type="button" 
                className="dispatcher-btn-ghost h-10 px-5 text-[13px]" 
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="dispatcher-btn-primary h-10 px-6 text-[13px]" 
                onClick={() => setShowScheduleModal(false)}
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
