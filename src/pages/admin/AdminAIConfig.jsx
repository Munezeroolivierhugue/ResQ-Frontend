import { useState } from 'react'
import { RefreshCw, Save } from 'lucide-react'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ConfirmDangerModal from '../../components/admin/ConfirmDangerModal'

function SliderField({ label, value, onChange, min, max, step, unit, helper }) {
  return (
    <label className="dispatcher-field">
      <span className="text-[12px] font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 admin-range-slider"
          style={{ accentColor: 'var(--accent)' }}
        />
        <span className="font-mono text-[13px] font-bold text-(--accent) min-w-[80px] text-right">
          {value}{unit}
        </span>
      </div>
      {helper && <span className="text-[11px] text-(--text-muted)">{helper}</span>}
    </label>
  )
}

function ModelCard({ title, status, statusVariant, accuracy, accuracyColor, stats, children, retrainDisabled }) {
  return (
    <div className="dispatcher-surface p-5 mb-4">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold">{title}</span>
          <StatusBadge label={status} variant={statusVariant} />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] px-2 py-0.5 rounded" style={{ background: 'var(--accent-ghost)', color: 'var(--accent)' }}>
            {accuracy} accuracy
          </span>
          <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 inline-flex items-center gap-1" disabled={retrainDisabled}>
            <RefreshCw size={12} />
            Retrain Now
          </button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-4">{children}</div>
        <div className="lg:w-[40%] rounded-lg p-4" style={{ background: 'var(--bg-elevated)' }}>
          {stats.map(([l, v]) => (
            <div key={l} className="flex justify-between text-[12px] py-1.5 border-b border-(--border-subtle) last:border-0">
              <span className="text-(--text-secondary)">{l}</span>
              <span className="font-mono font-semibold" style={{ color: l.includes('accuracy') ? accuracyColor : undefined }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminAIConfig() {
  const [reopt, setReopt] = useState(15)
  const [confidence, setConfidence] = useState(75)
  const [traffic, setTraffic] = useState(70)
  const [risk, setRisk] = useState(35)
  const [cluster, setCluster] = useState(6)
  const [sigma, setSigma] = useState(2.5)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <AdminPageHeader
        title="AI Model Configuration"
        subtitle="Settings for all RESQ AI models."
        actions={
          <>
            <button type="button" className="dispatcher-btn-ghost inline-flex items-center gap-2" onClick={() => setConfirmReset(true)}>
              <RefreshCw size={14} />
              Reset to Defaults
            </button>
            <button type="button" className="dispatcher-btn-primary inline-flex items-center gap-2">
              <Save size={14} />
              Save All Settings
            </button>
          </>
        }
      />

      <ModelCard
        title="DISPATCH BRAIN"
        status="MONITORING"
        statusVariant="handover"
        accuracy="86%"
        accuracyColor="var(--status-medium)"
        retrainDisabled={false}
        stats={[
          ['Current accuracy', '86%'],
          ['Last trained', 'May 14, 2026'],
          ['Training records', '48,291'],
          ['Predictions today', '847'],
        ]}
      >
        <label className="dispatcher-field">
          <span className="text-[12px] font-medium">Optimization Algorithm</span>
          <select className="dispatcher-input h-10" defaultValue="Hybrid (Recommended)">
            <option>Linear Programming</option>
            <option>Genetic Algorithm</option>
            <option>Reinforcement Learning</option>
            <option>Hybrid (Recommended)</option>
          </select>
        </label>
        <SliderField label="Reoptimization Interval" value={reopt} onChange={setReopt} min={5} max={60} step={5} unit=" min" helper={`Every ${reopt} minutes`} />
        <SliderField label="Minimum Confidence Threshold" value={confidence} onChange={setConfidence} min={50} max={95} step={5} unit="%" helper="Recommendations below this score not shown to dispatchers" />
        <label className="dispatcher-field">
          <span className="text-[12px] font-medium">Maximum Units Shown</span>
          <input type="number" className="dispatcher-input h-10 w-20" defaultValue={3} min={1} max={5} />
        </label>
        <SliderField label="Traffic Data Influence" value={traffic} onChange={setTraffic} min={0} max={100} step={10} unit="%" />
      </ModelCard>

      <ModelCard
        title="PREDICTION ENGINE"
        status="HEALTHY"
        statusVariant="resolved"
        accuracy="91%"
        accuracyColor="var(--status-low)"
        retrainDisabled
        stats={[
          ['Current accuracy', '91%'],
          ['Last trained', 'May 10, 2026'],
          ['Training records', '156,782'],
          ['Predictions today', '1,204'],
        ]}
      >
        <label className="dispatcher-field">
          <span className="text-[12px] font-medium">Prediction Window</span>
          <select className="dispatcher-input h-10" defaultValue="4h">
            <option>1h</option><option>2h</option><option>4h</option><option>8h</option><option>12h</option><option>24h</option>
          </select>
        </label>
        <SliderField label="Minimum Risk Threshold" value={risk} onChange={setRisk} min={10} max={80} step={5} unit="%" />
        <label className="dispatcher-field">
          <span className="text-[12px] font-medium">Historical Data Window</span>
          <select className="dispatcher-input h-10" defaultValue="6 months">
            <option>30 days</option><option>90 days</option><option>6 months</option><option>1 year</option><option>2 years</option>
          </select>
        </label>
        {['Include weather factors', 'Include event calendar', 'Include time-of-day patterns', 'Include school calendar', 'Include market day patterns'].map((t, i) => (
          <label key={t} className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" defaultChecked={i !== 3} />
            {t}
          </label>
        ))}
      </ModelCard>

      <ModelCard
        title="COVERAGE WATCHER"
        status="HEALTHY"
        statusVariant="resolved"
        accuracy="94%"
        accuracyColor="var(--status-low)"
        retrainDisabled
        stats={[
          ['Current accuracy', '94%'],
          ['Last trained', 'April 28, 2026'],
          ['Training records', '89,440'],
          ['Predictions today', '288'],
        ]}
      >
        <div className="font-semibold text-[12px] mb-2">Response Radius by Unit Type</div>
        <div className="grid grid-cols-2 gap-3">
          {[['Patrol Car', 3.5], ['Motorcycle', 2], ['Police Van', 5], ['Ambulance', 4]].map(([l, v]) => (
            <label key={l} className="text-[12px]">
              {l}
              <input type="number" className="dispatcher-input h-9 w-20 mt-1" defaultValue={v} step={0.5} />
              <span className="text-(--text-muted) ml-1">km</span>
            </label>
          ))}
        </div>
        <SliderField label="Minimum Coverage Threshold" value={90} onChange={() => {}} min={70} max={99} step={1} unit="%" />
        <label className="dispatcher-field">
          <span className="text-[12px] font-medium">Reanalysis Interval</span>
          <select className="dispatcher-input h-10" defaultValue="10 min">
            <option>5 min</option><option>10 min</option><option>15 min</option><option>30 min</option>
          </select>
        </label>
      </ModelCard>

      <ModelCard
        title="PATTERN ANALYST"
        status="HEALTHY"
        statusVariant="resolved"
        accuracy="89%"
        accuracyColor="var(--status-low)"
        retrainDisabled
        stats={[
          ['Current accuracy', '89%'],
          ['Last trained', 'May 10, 2026'],
          ['Training records', '156,782'],
          ['Detections today', '4'],
        ]}
      >
        <SliderField label="Clustering Sensitivity" value={cluster} onChange={setCluster} min={1} max={10} step={1} unit="" helper="Higher = detects more subtle clusters" />
        <SliderField label="Flag anomalies above σ" value={sigma} onChange={setSigma} min={1.5} max={4} step={0.5} unit="σ" />
        <label className="dispatcher-field">
          <span className="text-[12px] font-medium">Min incidents before flagging hotspot</span>
          <input type="number" className="dispatcher-input h-10 w-20" defaultValue={15} min={5} max={50} />
        </label>
        <label className="dispatcher-field">
          <span className="text-[12px] font-medium">Lookback Window</span>
          <select className="dispatcher-input h-10" defaultValue="14 days">
            <option>7 days</option><option>14 days</option><option>30 days</option><option>60 days</option>
          </select>
        </label>
      </ModelCard>

      <ConfirmDangerModal
        open={confirmReset}
        title="Reset all AI settings?"
        message="This will restore default configuration for all four models. Active deployments may behave differently until settings are saved again."
        confirmLabel="Reset to Defaults"
        onConfirm={() => setConfirmReset(false)}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  )
}
