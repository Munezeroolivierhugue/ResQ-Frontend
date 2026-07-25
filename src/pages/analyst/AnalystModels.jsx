import { useState, useEffect } from 'react'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { listModels, getOverrideAnalysis } from '../../api/reporting'

// Static service descriptions for the academic-defense framing requested —
// purpose/decision-method/oversight copy, not metrics. The only thing pulled
// from the real API per card is operational status (ACTIVE/INACTIVE), so the
// badge still reflects real backend state rather than being hardcoded.
const ML_SERVICES = [
  {
    key: 'Prediction Engine',
    name: 'Prediction Engine',
    algorithm: 'Gradient Boosting Regressor',
    purpose: 'Predict future emergency demand',
    fields: [
      ['Prediction Window', 'Next 30 minutes'],
      ['Decision Support', 'Enabled'],
    ],
  },
  {
    key: 'Pattern Analyst',
    name: 'Pattern Analyst',
    algorithm: 'Isolation Forest',
    purpose: 'Detect abnormal incident patterns',
    fields: [
      ['Monitoring', 'Live'],
      ['Decision Support', 'Enabled'],
    ],
  },
]

const RULE_SERVICES = [
  {
    key: 'Dispatch Brain',
    name: 'Dispatch Brain',
    type: 'Expert Rule Engine',
    purpose: 'Recommend dispatch priority and unit selection',
    fields: [
      ['Decision Method', 'Deterministic Rules'],
      ['Human Approval', 'Required'],
    ],
  },
  {
    key: 'Coverage Watcher',
    name: 'Coverage Watcher',
    type: 'Rule-Based Engine',
    purpose: 'Detect coverage gaps',
    fields: [
      ['Decision Method', 'Coverage Rules'],
      ['Live Monitoring', 'Enabled'],
    ],
  },
]

const OVERVIEW_ROWS = [
  { service: 'Prediction Engine', technology: 'Machine Learning', purpose: 'Predict incident demand', method: 'Gradient Boosting', oversight: 'Required' },
  { service: 'Pattern Analyst', technology: 'Machine Learning', purpose: 'Detect anomalies', method: 'Isolation Forest', oversight: 'Required' },
  { service: 'Dispatch Brain', technology: 'Rule Engine', purpose: 'Recommend dispatch', method: 'Deterministic Rules', oversight: 'Required' },
  { service: 'Coverage Watcher', technology: 'Rule Engine', purpose: 'Detect coverage gaps', method: 'Coverage Rules', oversight: 'Required' },
]

function ServiceCard({ service, status, techBadge }) {
  const isOperational = status === 'ACTIVE'
  return (
    <div className="dispatcher-surface p-5 flex flex-col" style={{ borderTop: `3px solid ${isOperational ? 'var(--status-low)' : 'var(--text-muted)'}` }}>
      <div className="flex justify-between items-start gap-2 mb-3">
        <span className="font-bold text-[14px]">{service.name}</span>
        <StatusBadge label={isOperational ? 'Operational' : 'Inactive'} variant={isOperational ? 'resolved' : 'neutral'} />
      </div>
      <div className="mb-3">{techBadge}</div>
      <div className="flex justify-between gap-3 text-[12px] py-1.5 border-b border-(--border-subtle)">
        <span className="text-(--text-secondary) shrink-0">{service.algorithm ? 'Algorithm' : 'Type'}</span>
        <span className="font-mono font-semibold text-right">{service.algorithm ?? service.type}</span>
      </div>
      <div className="flex justify-between gap-3 text-[12px] py-1.5 border-b border-(--border-subtle)">
        <span className="text-(--text-secondary) shrink-0">Purpose</span>
        <span className="font-medium text-right">{service.purpose}</span>
      </div>
      {service.fields.map(([label, val]) => (
        <div key={label} className="flex justify-between text-[12px] py-1.5 border-b border-(--border-subtle) last:border-0">
          <span className="text-(--text-secondary)">{label}</span>
          <span className="font-mono font-semibold">{val}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalystModels() {
  const [statusByName, setStatusByName] = useState({})
  const [overrides, setOverrides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([listModels(), getOverrideAnalysis()])
      .then(([modelsRes, overridesRes]) => {
        if (modelsRes.status === 'fulfilled') {
          const map = {}
          modelsRes.value.forEach((m) => { map[m.modelName] = m.status ?? 'UNKNOWN' })
          setStatusByName(map)
        }
        if (overridesRes.status === 'fulfilled') setOverrides(overridesRes.value)
      })
      .finally(() => setLoading(false))
  }, [])



  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      <AnalystPageHeader
        title="Decision Intelligence Monitor"
        subtitle="Monitor the operational health of RESQ's machine learning and rule-based decision services."
        badge="Decision Services"
      />

      {loading && <p className="text-[13px] text-(--text-muted)">Loading…</p>}

      <div>
        {/* <h3 className="text-[13px] font-semibold m-0 mb-3">Machine Learning Services</h3> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ML_SERVICES.map((s) => (
            <ServiceCard key={s.key} service={s} status={statusByName[s.name]}  />
          ))}
        </div>
      </div>

      <div>
        {/* <h3 className="text-[13px] font-semibold m-0 mb-3">Rule-Based Decision Services</h3> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {RULE_SERVICES.map((s) => (
            <ServiceCard key={s.key} service={s} status={statusByName[s.name]}  />
          ))}
        </div>
      </div>

      <div className="dispatcher-surface overflow-x-auto p-0">
        <div className="p-4 border-b border-(--border)">
          <h3 className="text-[13px] font-semibold m-0">Dispatcher Override Evaluation</h3>
          <p className="text-[12px] text-(--text-muted) m-0 mt-1">
            Not a prediction: "AI-Followed Avg Response" is the real average response time from dispatches where the
            AI recommendation was actually used (not overridden), in the same period — an observed comparison
            group, not a simulated or hypothetical result for the overridden cases. It's one system-wide figure,
            so it repeats across reasons by design.
          </p>
        </div>
        <table className="w-full text-[12px] min-w-[640px]">
          <thead>
            <tr className="text-(--text-secondary) font-bold border-b border-(--border)">
              <th className="text-left p-3">Override Reason</th>
              <th className="p-3 text-center">Cases</th>
              <th className="p-3 text-center">AI-Followed Avg Response</th>
              <th className="p-3 text-center">Overridden Avg Response</th>
              <th className="p-3 text-center">Outcome</th>
              <th className="text-left p-3">Observation</th>
            </tr>
          </thead>
          <tbody>
            {!loading && overrides.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-(--text-muted)">No dispatcher overrides recorded yet.</td></tr>
            )}
            {overrides.map((row) => (
              <tr key={row.reason} className="border-b border-(--border-subtle) last:border-0">
                <td className="p-3 font-medium">{row.reason}</td>
                <td className="p-3 text-center font-mono">
                  {row.count}
                  {(row.better_count + row.worse_count) !== row.count && (
                    <span className="text-(--text-muted)"> ({row.better_count + row.worse_count} timed)</span>
                  )}
                </td>
                <td className="p-3 text-center font-mono">{row.avg_response_baseline != null ? `${row.avg_response_baseline}m` : '—'}</td>
                <td className="p-3 text-center font-mono">{row.avg_response_overridden != null ? `${row.avg_response_overridden}m` : '—'}</td>
                <td className="p-3 text-center font-mono">
                  <span style={{ color: 'var(--status-low)' }}>{row.better_count} better</span>
                  {' / '}
                  <span style={{ color: 'var(--status-critical)' }}>{row.worse_count} worse</span>
                </td>
                <td className="p-3 text-(--text-secondary)">{row.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dispatcher-surface overflow-x-auto p-0">
        <div className="p-4 border-b border-(--border)">
          <h3 className="text-[13px] font-semibold m-0">Decision Service Overview</h3>
          <p className="text-[12px] text-(--text-muted) m-0 mt-1">How each decision-support service works and where human oversight applies.</p>
        </div>
        <table className="w-full text-[12px] min-w-[640px]">
          <thead>
            <tr className="text-(--text-secondary) font-bold border-b border-(--border)">
              <th className="text-left p-3">Service</th>
              {/* <th className="text-left p-3">Technology</th> */}
              <th className="text-left p-3">Purpose</th>
              <th className="text-left p-3">Decision Method</th>
              <th className="text-left p-3">Human Oversight</th>
            </tr>
          </thead>
          <tbody>
            {OVERVIEW_ROWS.map((r) => (
              <tr key={r.service} className="border-b border-(--border-subtle) last:border-0">
                <td className="p-3 font-medium">{r.service}</td>
                {/* <td className="p-3">
                  <StatusBadge label={r.technology} variant={r.technology === 'Machine Learning' ? 'info' : 'neutral'} />
                </td> */}
                <td className="p-3 text-(--text-secondary)">{r.purpose}</td>
                <td className="p-3 font-mono">{r.method}</td>
                <td className="p-3 text-(--text-secondary)">{r.oversight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
