import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Check } from 'lucide-react'
import MetricCard from '../../components/dispatcher/MetricCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import VerticalTimeline from '../../components/dispatcher/VerticalTimeline'
import { useOpsManagerStore } from '../../store/opsManagerStore'
import {
  OPS_SHIFT_REPORT_INCIDENTS,
  OPS_RESOURCE_EVENTS,
  OPS_SHIFT_HANDOVER,
} from '../../data/mockOpsManagerData'
import OpsManagerDistrictLabel from '../../components/ops-manager/OpsManagerDistrictLabel'
import { getOpsManagerDistrict } from '../../utils/opsManagerDistrict'

export default function OpsManagerShift() {
  const [tab, setTab] = useState('performance')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const { markHandoverRead } = useOpsManagerStore()

  return (
    <div className="portal-page">
      <div className="mb-4">
        <h1 className="dispatcher-page-title m-0">Shift Performance</h1>
        <OpsManagerDistrictLabel />
      </div>
      <div className="flex gap-2 mb-6 border-b border-(--border) pb-2">
        {['performance', 'handover'].map((t) => (
          <button
            key={t}
            type="button"
            className="text-[13px] font-semibold px-4 py-2 border-none bg-transparent cursor-pointer border-b-2 -mb-[10px]"
            style={{
              borderColor: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
            }}
            onClick={() => setTab(t)}
          >
            {t === 'performance' ? 'Shift Performance Report' : 'Incoming Handover'}
          </button>
        ))}
      </div>

      {tab === 'performance' && (
        <>
          <div className="flex flex-wrap justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-(--text-primary) m-0" style={{ fontFamily: 'var(--font-display)' }}>
                Shift Performance Report
              </h2>
              <p className="dispatcher-page-subtitle m-0 mt-1">Auto-generated from shift data. Review and submit to District Commander.</p>
            </div>
            <span className="text-[11px] font-mono text-(--text-muted) self-start">
              Shift: 08:00 – 16:00 · May 25 2026 · District: {getOpsManagerDistrict()}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <MetricCard label="Total Incidents" value="247" hint="✓" hintTone="positive" />
            <MetricCard label="Avg Response Time" value="7.2m" hint="✓ at target" hintTone="positive" />
            <MetricCard label="Coverage Score" value="93%" hint="✓ above 90%" hintTone="positive" />
            <MetricCard label="Dispatch Accuracy" value="88%" hint="⚠ watch" hintTone="warning" />
            <MetricCard label="Escalations Managed" value="4" />
            <MetricCard label="AI Acceptance Rate" value="86%" hint="✓" hintTone="positive" />
          </div>

          <div className="dispatcher-surface p-4 mb-6 table-scroll">
            <SectionTitle title="Significant Incidents" className="mb-3" />
            <table className="w-full text-[13px] min-w-[640px]">
              <thead>
                <tr className="text-[11px] text-(--text-muted) uppercase border-b border-(--border)">
                  <th className="text-left p-2">Incident ID</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Severity</th>
                  <th className="text-left p-2">Duration</th>
                  <th className="text-left p-2">Units</th>
                  <th className="text-left p-2">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {OPS_SHIFT_REPORT_INCIDENTS.map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      className="border-b border-(--border-subtle) cursor-pointer hover:bg-(--bg-elevated)"
                      onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                    >
                      <td className="p-2 font-mono text-(--accent)">{row.id}</td>
                      <td className="p-2">{row.type}</td>
                      <td className="p-2"><StatusBadge label={row.severity} variant={row.severity === 'CRITICAL' ? 'critical' : 'handover'} /></td>
                      <td className="p-2">{row.duration}</td>
                      <td className="p-2">{row.units}</td>
                      <td className="p-2 text-(--text-secondary)">{row.outcome}</td>
                    </tr>
                    {expandedId === row.id && (
                      <tr>
                        <td colSpan={6} className="p-3 text-[12px] text-(--text-secondary) bg-(--bg-input)">
                          Timeline: logged → units dispatched → {row.outcome}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dispatcher-surface p-4 mb-6">
            <SectionTitle title="Resource Events" className="mb-3" />
            <VerticalTimeline
              events={OPS_RESOURCE_EVENTS.map((e, i) => ({
                id: i,
                time: e.time,
                title: e.title,
                description: e.description,
              }))}
            />
          </div>

          <div className="dispatcher-surface p-4 mb-6">
            <label className="dispatcher-field">
              <span className="field-label">Your notes for District Commander</span>
              <textarea
                className="dispatcher-input dispatcher-textarea"
                rows={5}
                placeholder="What went well, challenges encountered, resource recommendations for next shift..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div className="text-[11px] text-(--text-muted) text-right">{notes.length} characters</div>
          </div>

          {!submitted ? (
            <div className="flex flex-wrap justify-between gap-3 pt-4 border-t border-(--border)">
              <button type="button" className="dispatcher-btn-ghost">Preview Report</button>
              <button type="button" className="dispatcher-btn-primary flex items-center gap-2" onClick={() => setSubmitted(true)}>
                <Send size={16} /> Submit to District Commander
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-lg flex items-start gap-3" style={{ background: 'var(--status-low-bg)', border: '1px solid var(--status-low)' }}>
              <Check size={22} style={{ color: 'var(--status-low)' }} />
              <div>
                <div className="font-bold text-(--text-primary)">Report submitted to District Commander</div>
                <p className="text-[13px] text-(--text-secondary) m-0 mt-1">Handover summary prepared for incoming Operations Manager.</p>
              </div>
            </div>
          )}
          {!submitted && (
            <p className="text-[11px] text-(--text-muted) mt-2">
              Submission will also prepare handover summary for the incoming Operations Manager.
            </p>
          )}
        </>
      )}

      {tab === 'handover' && (
        <div className="dispatcher-surface p-6 max-w-4xl">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-(--accent) font-bold mb-4">
            Shift Handover Briefing
          </div>
          <p className="text-[13px] text-(--text-secondary) m-0">{OPS_SHIFT_HANDOVER.outgoing}</p>
          <p className="text-[11px] font-mono text-(--text-muted) mt-1">Generated: {OPS_SHIFT_HANDOVER.generated}</p>

          <HandoverSection title="Active Incidents Inherited">
            <table className="w-full text-[12px] mt-2">
              <thead><tr className="text-(--text-muted)"><th className="text-left p-1">ID</th><th className="text-left p-1">Type</th><th className="text-left p-1">Status</th><th className="text-left p-1">Units</th></tr></thead>
              <tbody>
                {OPS_SHIFT_HANDOVER.activeIncidents.map((r) => (
                  <tr key={r.id} className="border-t border-(--border-subtle)">
                    <td className="p-1 font-mono text-(--accent)">{r.id}</td>
                    <td className="p-1">{r.type}</td>
                    <td className="p-1">{r.status}</td>
                    <td className="p-1">{r.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </HandoverSection>

          <HandoverSection title="Unit Issues">
            <ul className="m-0 pl-4 text-[13px] text-(--text-secondary)">{OPS_SHIFT_HANDOVER.unitIssues.map((u) => <li key={u}>{u}</li>)}</ul>
          </HandoverSection>

          <HandoverSection title="Unresolved Escalations">
            <ul className="m-0 pl-4 text-[13px] text-(--text-secondary)">{OPS_SHIFT_HANDOVER.unresolvedEscalations.map((u) => <li key={u}>{u}</li>)}</ul>
          </HandoverSection>

          <HandoverSection title="AI Recommendations Pending">
            <ul className="m-0 pl-4 text-[13px] text-(--text-secondary)">{OPS_SHIFT_HANDOVER.pendingAi.map((u) => <li key={u}>{u}</li>)}</ul>
          </HandoverSection>

          <HandoverSection title="Outgoing Notes">
            <blockquote className="dispatcher-quote m-0 mt-2">{OPS_SHIFT_HANDOVER.notes}</blockquote>
          </HandoverSection>

          <HandoverSection title="Shift Stats">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 text-[12px]">
              <div><span className="text-(--text-muted)">Incidents</span><div className="font-bold">{OPS_SHIFT_HANDOVER.stats.incidents}</div></div>
              <div><span className="text-(--text-muted)">Avg response</span><div className="font-bold">{OPS_SHIFT_HANDOVER.stats.avgResponse}</div></div>
              <div><span className="text-(--text-muted)">Coverage</span><div className="font-bold">{OPS_SHIFT_HANDOVER.stats.coverage}</div></div>
              <div><span className="text-(--text-muted)">Escalations</span><div className="font-bold">{OPS_SHIFT_HANDOVER.stats.escalations}</div></div>
            </div>
          </HandoverSection>

          <button type="button" className="dispatcher-btn-outline mt-6" onClick={markHandoverRead}>
            Mark as Read
          </button>
          <Link to="/ops-manager/dashboard" className="block text-[12px] text-(--accent) mt-3 no-underline">
            Return to Command Overview
          </Link>
        </div>
      )}
    </div>
  )
}

function HandoverSection({ title, children }) {
  return (
    <div className="mt-6">
      <div className="dispatcher-section-title">
        <span className="dispatcher-section-accent" aria-hidden />
        <span className="panel-title">{title}</span>
      </div>
      {children}
    </div>
  )
}
