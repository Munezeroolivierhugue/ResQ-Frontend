import { useState, useEffect } from 'react'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { listModels, getOverrideAnalysis } from '../../api/reporting'

const MODEL_BORDER = {
  ACTIVE: '#22c55e',
  RETRAINING: '#f59e0b',
  INACTIVE: '#94a3b8',
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AnalystModels() {
  const [models, setModels] = useState([])
  const [overrides, setOverrides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([listModels(), getOverrideAnalysis()])
      .then(([modelsRes, overridesRes]) => {
        if (modelsRes.status === 'fulfilled') {
          setModels(modelsRes.value.map((m) => {
            const raw = m.accuracy
            const accuracy = raw != null ? Math.round((raw > 1 ? raw : raw * 100) * 10) / 10 : null
            const algorithm = m.algorithm ?? '—'
            // Short name for the card ("GradientBoostingRegressor"), full
            // detail ("...(MAE=0.92 vs baseline=0.92...)") kept for a tooltip
            // only — showing the whole string inline was overflowing the card.
            const algorithmShort = algorithm.split('(')[0].trim()
            const unsupervised = algorithm.includes('IsolationForest')
            return {
              model_id: m.modelId,
              name: m.modelName,
              algorithm,
              algorithm_short: algorithmShort,
              unsupervised,
              accuracy,
              status: m.status ?? 'UNKNOWN',
              training_data_size: m.trainingDataSize,
              last_trained: m.lastTrained,
            }
          }))
        }
        if (overridesRes.status === 'fulfilled') setOverrides(overridesRes.value)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      <AnalystPageHeader
        title="AI Model Performance Monitor"
        subtitle="Real accuracy, training data, and override outcomes for RESQ's AI models."
        badge="AI Models"
      />

      {loading && <p className="text-[13px] text-(--text-muted)">Loading…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {models.map((m) => (
          <div
            key={m.model_id}
            className="dispatcher-surface p-5 flex flex-col"
            style={{ borderTop: `3px solid ${MODEL_BORDER[m.status] ?? '#94a3b8'}` }}
          >
            <div className="flex justify-between gap-2 mb-3">
              <span className="font-bold text-[14px]">{m.name}</span>
              <StatusBadge label={m.status} variant={m.status === 'ACTIVE' ? 'resolved' : 'handover'} />
            </div>
            <div
              className={m.accuracy != null ? 'font-mono text-[28px] font-bold mb-3' : 'font-mono text-[13px] font-semibold mb-3'}
              style={{ color: MODEL_BORDER[m.status] ?? '#94a3b8' }}
            >
              {m.accuracy != null ? `${m.accuracy}%` : m.unsupervised ? 'Unsupervised — no accuracy metric' : 'Not yet trained'}
            </div>
            <div className="flex justify-between gap-3 text-[12px] py-1.5 border-b border-(--border-subtle)">
              <span className="text-(--text-secondary) shrink-0">Algorithm</span>
              <span className="font-mono font-semibold text-right truncate min-w-0" title={m.algorithm}>{m.algorithm_short}</span>
            </div>
            {[
              ['Training data', m.training_data_size != null ? `${m.training_data_size.toLocaleString()} incidents` : '—'],
              ['Last trained', fmtDate(m.last_trained)],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-[12px] py-1.5 border-b border-(--border-subtle) last:border-0">
                <span className="text-(--text-secondary)">{label}</span>
                <span className="font-mono font-semibold">{val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="dispatcher-surface overflow-x-auto p-0">
        <div className="p-4 border-b border-(--border)">
          <h3 className="text-[13px] font-semibold m-0">Override Outcome Analysis</h3>
          <p className="text-[12px] text-(--text-muted) m-0 mt-1">
            Real dispatcher overrides, grouped by reason — each override's real incident response time compared against the real average for AI-recommended dispatches.
          </p>
        </div>
        <table className="w-full text-[12px] min-w-[640px]">
          <thead>
            <tr className="text-(--text-secondary) font-bold border-b border-(--border)">
              <th className="text-left p-3">Override Reason</th>
              <th className="p-3 text-center">Count</th>
              <th className="p-3 text-center">Avg Response (overridden)</th>
              <th className="p-3 text-center">Avg Response (AI baseline)</th>
              <th className="p-3 text-center">Better / Worse</th>
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
                <td className="p-3 text-center font-mono">{row.count}</td>
                <td className="p-3 text-center font-mono">{row.avg_response_overridden != null ? `${row.avg_response_overridden}m` : '—'}</td>
                <td className="p-3 text-center font-mono">{row.avg_response_baseline != null ? `${row.avg_response_baseline}m` : '—'}</td>
                <td className="p-3 text-center font-mono">
                  <span style={{ color: 'var(--status-low)' }}>{row.better_count}</span>
                  {' / '}
                  <span style={{ color: 'var(--status-critical)' }}>{row.worse_count}</span>
                </td>
                <td className="p-3 text-(--text-secondary)">{row.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dispatcher-surface overflow-x-auto p-0">
        <div className="p-4 border-b border-(--border)">
          <h3 className="text-[13px] font-semibold m-0">Model Drift & Retraining</h3>
          <p className="text-[12px] text-(--text-muted) m-0 mt-1">Real status per model — not a single blanket answer, since each model's situation is different.</p>
        </div>
        <table className="w-full text-[12px] min-w-[640px]">
          <thead>
            <tr className="text-(--text-secondary) font-bold border-b border-(--border)">
              <th className="text-left p-3">Model</th>
              <th className="text-left p-3">Retraining</th>
              <th className="text-left p-3">Drift Tracking</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-(--border-subtle)">
              <td className="p-3 font-medium">Dispatch Brain / Coverage Watcher</td>
              <td className="p-3 text-(--text-muted)" colSpan={2}>Not applicable — rule-based scoring by design, not a trained model.</td>
            </tr>
            <tr className="border-b border-(--border-subtle)">
              <td className="p-3 font-medium">Prediction Engine</td>
              <td className="p-3 text-(--text-secondary)">Manual only — re-run the training script when more real data exists.</td>
              <td className="p-3 text-(--text-secondary)">Not yet — needs real predictions tracked against real outcomes over time, which needs more live incident volume than exists today.</td>
            </tr>
            <tr className="border-b border-(--border-subtle) last:border-0">
              <td className="p-3 font-medium">Pattern Analyst</td>
              <td className="p-3" style={{ color: 'var(--status-low)' }}>Automatic — retrains fresh on every real incident, every request.</td>
              <td className="p-3 text-(--text-secondary)">Not yet — needs an Analyst review/dismiss action per flag to confirm which anomalies were real, which doesn't exist yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
