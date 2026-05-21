import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, FileText, Rocket, BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/dispatcher/PageHeader'
import SurfaceCard from '../../components/dispatcher/SurfaceCard'
import MetricCard from '../../components/dispatcher/MetricCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import DataTable from '../../components/dispatcher/DataTable'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { FormTextarea } from '../../components/dispatcher/FormControls'
import { mockShiftHandover } from '../../data/mockShiftHandoverData'

export default function ShiftHandover() {
  const navigate = useNavigate()
  const data = mockShiftHandover
  const [sort, setSort] = useState('recent')
  const [officerNote, setOfficerNote] = useState('')

  const columns = [
    { key: 'id', label: 'Call ID', render: (row) => (
      <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>#{row.id}</span>
    ) },
    { key: 'type', label: 'Type', render: (row) => {
      const Icon = row.typeIcon
      return (
        <span className="inline-flex items-center gap-2">
          <Icon size={14} className="text-(--accent) shrink-0" />
          {row.type}
        </span>
      )
    } },
    { key: 'timestamp', label: 'Timestamp', render: (row) => (
      <span style={{ fontFamily: 'var(--font-mono)' }}>{row.timestamp}</span>
    ) },
    { key: 'location', label: 'Location' },
    { key: 'outcome', label: 'Outcome' },
    { key: 'status', label: 'Status', render: (row) => (
      <StatusBadge
        label={row.status === 'resolved' ? 'Resolved' : 'In handover'}
        variant={row.status === 'resolved' ? 'resolved' : 'handover'}
      />
    ) },
  ]

  return (
    <div className="p-6 dispatcher-page">
      <PageHeader
        breadcrumbCurrent="Shift handover"
        title="Shift handover summary"
        subtitle={`Comprehensive performance report for ${data.period}. Generated on ${data.generatedAt}.`}
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
        {data.metrics.map((m) => (
          <MetricCard
            key={m.id}
            icon={m.icon}
            label={m.label}
            value={m.value}
            hint={m.hint}
            hintTone={m.hintTone}
            className={m.id === 'peak' ? 'dispatcher-metric-card--peak' : ''}
          >
            {m.id === 'peak' && (
              <div className="dispatcher-peak-bars" aria-hidden>
                {data.peakBars.map((h, i) => (
                  <span
                    key={i}
                    className="dispatcher-peak-bar"
                    style={{ height: `${h}%`, opacity: h === Math.max(...data.peakBars) ? 1 : 0.45 }}
                  />
                ))}
              </div>
            )}
          </MetricCard>
        ))}
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
        <DataTable
          columns={columns}
          rows={data.incidents}
          footer={
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-(--text-muted)">
                Showing {data.incidents.length} of {data.totalRecords} shift records
              </span>
              <div className="flex gap-1">
                <button type="button" className="dispatcher-btn-icon" aria-label="Previous page">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" className="dispatcher-btn-icon" aria-label="Next page">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          }
        />
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
                Sr. Dispatcher {data.dispatcher.name}
              </div>
              <div className="text-[11px] text-(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }}>
                ID: {data.dispatcher.id}
              </div>
            </div>
            {data.dispatcher.verified && (
              <BadgeCheck size={18} className="text-(--status-low) ml-auto shrink-0" />
            )}
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
