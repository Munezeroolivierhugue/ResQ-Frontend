import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import DriftGauge from '../../components/analyst/DriftGauge'
import SettingsToast from '../../components/settings/SettingsToast'
import { getCurrentUser } from '../../utils/authSession'
import { mockAuditLogs } from '../../data/mockAuditLogs'
import { listModels } from '../../api/reporting'
import {
  ANALYST_DISPATCH_ACCURACY,
  ANALYST_OVERRIDE_ROWS,
  ANALYST_RETRAIN_LOG,
} from '../../data/mockAnalystData'

function driftColor(pct) {
  if (pct == null || isNaN(pct)) return 'var(--status-low)'
  if (pct < 5) return 'var(--status-low)'
  if (pct <= 10) return 'var(--status-medium)'
  return 'var(--status-critical)'
}

// Per-model enrichment metadata (index-stable so API order maps correctly)
const MODEL_META = [
  {
    border: '#22c55e',
    accuracyColor: '#22c55e',
    trend: '↑ 2.1%',
    training_data_size: '12,847 incidents',
    predictions_today: 34,
    acceptance: '94%',
    drift_pct: 1.8,
    driftLabel: 'Stable',
    retrainDisabled: false,
  },
  {
    border: '#f59e0b',
    accuracyColor: '#f59e0b',
    trend: '→ 0.3%',
    training_data_size: '8,211 incidents',
    predictions_today: 28,
    acceptance: '86%',
    drift_pct: 4.2,
    driftLabel: 'Watch',
    retrainDisabled: false,
  },
  {
    border: '#22c55e',
    accuracyColor: '#22c55e',
    trend: '↑ 1.4%',
    training_data_size: '15,390 incidents',
    predictions_today: 41,
    acceptance: '91%',
    drift_pct: 2.1,
    driftLabel: 'Stable',
    retrainDisabled: false,
  },
  {
    border: '#ef4444',
    accuracyColor: '#ef4444',
    trend: '↓ 3.2%',
    training_data_size: '6,882 incidents',
    predictions_today: 19,
    acceptance: '79%',
    drift_pct: 6.8,
    driftLabel: 'Alert',
    retrainDisabled: false,
  },
]

const FALLBACK_MODELS = [
  { model_id: 'dispatch-brain-v1',    name: 'Dispatch Brain',    version: 'RandomForest',    accuracy: 94.2, accuracy_pct: '94.2', status: 'ACTIVE', statusVariant: 'success', ...MODEL_META[0] },
  { model_id: 'prediction-engine-v1', name: 'Prediction Engine', version: 'GradientBoosting', accuracy: 88.5, accuracy_pct: '88.5', status: 'ACTIVE', statusVariant: 'success', ...MODEL_META[1] },
  { model_id: 'coverage-watcher-v1',  name: 'Coverage Watcher',  version: 'RuleHeuristic',   accuracy: 91.7, accuracy_pct: '91.7', status: 'ACTIVE', statusVariant: 'success', ...MODEL_META[2] },
  { model_id: 'pattern-analyst-v1',   name: 'Pattern Analyst',   version: 'IsolationForest', accuracy: 82.3, accuracy_pct: '82.3', status: 'ACTIVE', statusVariant: 'success', ...MODEL_META[3] },
]

export default function AnalystModels() {
  const [models, setModels] = useState([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    listModels()
      .then((data) => {
        const adapted = data.map((m, i) => {
          // Backend may return 0–1 decimal OR already a 0–100 percentage — normalise to percentage
          const raw = m.accuracy ?? 90.0
          const accuracy = Math.round((raw > 1 ? raw : raw * 100) * 10) / 10
          const meta = MODEL_META[i % MODEL_META.length]
          return {
            ...meta,
            model_id: m.modelId,
            name: m.modelName,
            version: m.algorithm ?? 'v1.0.0',
            accuracy,
            accuracy_pct: accuracy.toFixed(1),
            status: m.status,
            statusVariant: m.status === 'ACTIVE' ? 'success' : 'handover',
          }
        })
        setModels(adapted.length > 0 ? adapted : FALLBACK_MODELS)
      })
      .catch(() => setModels(FALLBACK_MODELS))
  }, [])

  function handleRetrain(model) {
    const currentUser = getCurrentUser()
    mockAuditLogs.push({
      log_id: Math.random().toString(36).slice(2, 10),
      user_id: currentUser?.user_id ?? null,
      timestamp: new Date().toISOString(),
      action: 'AI_MODEL_RETRAIN_QUEUED: ' + model.model_id,
      module: 'ANALYST',
      status: 'SUCCESS',
    })
    setModels((prev) =>
      prev.map((m) =>
        m.model_id === model.model_id ? { ...m, status: 'RETRAINING', statusVariant: 'handover' } : m
      )
    )
    setToast(`Retrain queued for ${model.name}.`)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      <AnalystPageHeader
        title="AI Model Performance Monitor"
        subtitle="Quality control for all RESQ AI models."
        badge="AI Models"
      />

      {/* Model cards — all 4 in one row on xl, 2 on md */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {models.map((m) => (
          <div
            key={m.model_id}
            className="dispatcher-surface p-5 flex flex-col"
            style={{ borderTop: `3px solid ${m.border}` }}
          >
            <div className="flex justify-between gap-2 mb-3">
              <span className="font-bold text-[14px]">{m.name}</span>
              <StatusBadge label={m.status} variant={m.statusVariant} />
            </div>
            <div className="font-mono text-[28px] font-bold mb-3" style={{ color: m.accuracyColor }}>
              {m.accuracy_pct}%
            </div>
            {[
              ['30-day trend',     m.trend],
              ['Training data',   m.training_data_size],
              ['Predictions today', String(m.predictions_today)],
              ['User acceptance', m.acceptance],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-[12px] py-1.5 border-b border-(--border-subtle)">
                <span className="text-(--text-secondary)">{label}</span>
                <span className="font-mono font-semibold">{val}</span>
              </div>
            ))}
            <button
              type="button"
              className="dispatcher-btn-ghost w-full mt-4 text-[12px] inline-flex items-center justify-center gap-1"
              disabled={m.retrainDisabled || m.status === 'RETRAINING'}
              onClick={() => !m.retrainDisabled && handleRetrain(m)}
            >
              <RefreshCw size={14} />
              {m.status === 'RETRAINING' ? 'Retraining...' : 'Retrain Now'}
            </button>
          </div>
        ))}
      </div>

      <div className="portal-split-60-40 gap-4">
        <div className="min-w-0 flex flex-col gap-4">
          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0 mb-3">Dispatch Model Accuracy — 30 Days</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={ANALYST_DISPATCH_ACCURACY}>
                <CartesianGrid stroke="var(--border-subtle)" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <ReferenceLine y={85} stroke="var(--status-critical)" strokeDasharray="4 4" label="Min 85%" />
                <Line type="monotone" dataKey="accuracy" stroke="var(--accent)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="ma7" stroke="var(--status-info)" dot={false} strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="dispatcher-surface overflow-x-auto p-0">
            <div className="p-4 border-b border-(--border)">
              <h3 className="text-[13px] font-semibold m-0">Override Outcome Analysis</h3>
              <p className="text-[12px] text-(--text-muted) m-0 mt-1">
                When dispatchers override AI — was the human decision better?
              </p>
            </div>
            <table className="w-full text-[12px] min-w-[640px]">
              <thead>
                <tr className="text-(--text-muted) border-b border-(--border)">
                  <th className="text-left p-3">Override Reason</th>
                  <th className="p-3 text-center">Count</th>
                  <th className="p-3 text-center">Better</th>
                  <th className="p-3 text-center">Worse</th>
                  <th className="text-left p-3">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {ANALYST_OVERRIDE_ROWS.map((row) => (
                  <tr
                    key={row.override_reason}
                    className="border-b border-(--border-subtle)"
                    style={{
                      background: row.highlight ? 'var(--status-medium-bg)' : undefined,
                      borderLeft: row.highlight ? '3px solid var(--status-critical)' : undefined,
                    }}
                  >
                    <td className="p-3 font-medium">
                      {row.override_reason}
                      {row.highlight && (
                        <span
                          className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}
                        >
                          ⚠ MODEL FIX NEEDED
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono">{row.count}</td>
                    <td className="p-3 text-center" style={{ color: 'var(--status-low)' }}>{row.better}</td>
                    <td className="p-3 text-center" style={{ color: 'var(--status-critical)' }}>{row.worse}</td>
                    <td className="p-3 text-(--text-secondary)">{row.rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="min-w-0 flex flex-col gap-4">
          <div className="dispatcher-surface p-4">
            <h3 className="text-[13px] font-semibold m-0">Model Drift Detection</h3>
            <p className="text-[12px] text-(--text-muted) m-0 mb-4">
              Drift = accuracy decline from real-world pattern changes
            </p>
            <div className="flex justify-around gap-4 flex-wrap">
              {models.map((m) => (
                <div key={m.model_id} className="text-center">
                  <DriftGauge pct={m.drift_pct} color={driftColor(m.drift_pct)} />
                  <div className="text-[12px] font-semibold mt-2">{m.name}</div>
                  <div className="text-[11px] font-semibold" style={{ color: driftColor(m.drift_pct) }}>
                    {m.driftLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dispatcher-surface overflow-x-auto">
            <h3 className="text-[13px] font-semibold m-0 p-4 pb-2">Retraining History</h3>
            <table className="w-full text-[12px] min-w-[400px]">
              <thead>
                <tr className="text-(--text-muted) border-b border-(--border)">
                  <th className="text-left p-3">Model</th>
                  <th className="p-3 text-center">Date</th>
                  <th className="p-3 text-center">Data</th>
                  <th className="p-3 text-center">Duration</th>
                  <th className="p-3 text-center">Change</th>
                </tr>
              </thead>
              <tbody>
                {ANALYST_RETRAIN_LOG.map((row) => (
                  <tr key={row.date + row.model} className="border-b border-(--border-subtle)">
                    <td className="p-3">{row.model}</td>
                    <td className="p-3 font-mono text-center">{row.date}</td>
                    <td className="p-3 text-center">{row.data}</td>
                    <td className="p-3 text-center">{row.duration}</td>
                    <td
                      className="p-3 font-mono font-bold text-center"
                      style={{ color: row.positive ? 'var(--status-low)' : 'var(--status-critical)' }}
                    >
                      {row.change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SettingsToast show={!!toast} message={toast} />
    </div>
  )
}
