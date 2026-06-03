import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Send, X, ChartLine } from 'lucide-react'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import { PLANNER_DEFAULT_INSTRUCTIONS, PLANNER_PLANS, RWANDA_DISTRICTS, planStatusVariant } from '../../data/mockPlannerData'

const EMPTY_INSTRUCTION = { unit: '', from: '', to: '', at: '' }
const BASE_COVERAGE = 82

function projectedFromInstructions(instructions) {
  const filled = instructions.filter((i) => i.unit.trim() && i.to.trim())
  const boost = filled.reduce((sum, _, idx) => sum + (3 + (idx % 3)), 0)
  return Math.min(98, BASE_COVERAGE + boost)
}

export default function PlannerDeployment() {
  const [searchParams] = useSearchParams()
  const zoneHint = searchParams.get('zone')
  const [instructions, setInstructions] = useState(() =>
    PLANNER_DEFAULT_INSTRUCTIONS.map((i) => ({ ...i }))
  )
  const [planFilter, setPlanFilter] = useState('All')
  const [planName, setPlanName] = useState(zoneHint ? `${zoneHint} Response Plan` : '')

  const projected = useMemo(() => projectedFromInstructions(instructions), [instructions])
  const improvement = projected - BASE_COVERAGE

  const filteredPlans =
    planFilter === 'All' ? PLANNER_PLANS : PLANNER_PLANS.filter((p) => p.status === planFilter.toUpperCase())

  const addInstruction = () => setInstructions((rows) => [...rows, { ...EMPTY_INSTRUCTION }])
  const removeInstruction = (idx) => setInstructions((rows) => rows.filter((_, i) => i !== idx))
  const updateInstruction = (idx, field, value) =>
    setInstructions((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <PlannerPageHeader
        title="Deployment Planning"
        subtitle="Create and manage evidence-based unit positioning plans."
      />

      <div className="portal-split-45-55 gap-4">
        <div className="dispatcher-surface p-4">
          <SectionTitle title="Create Deployment Plan" />
          <div className="flex flex-col gap-3 mt-4">
            <label className="text-[12px] font-medium text-(--text-secondary)">
              Plan name *
              <input
                className="dispatcher-input h-10 w-full mt-1 text-[13px]"
                placeholder="e.g. Friday PM Kimihurura Surge Plan"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </label>
            <label className="text-[12px] font-medium text-(--text-secondary)">
              District *
              <select className="dispatcher-input h-10 w-full mt-1 text-[13px]">
                {RWANDA_DISTRICTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-[12px] font-medium text-(--text-secondary)">
                Active from *
                <input type="date" className="dispatcher-input h-10 w-full mt-1" />
              </label>
              <label className="text-[12px] font-medium text-(--text-secondary)">
                Active until *
                <div className="flex gap-2 mt-1">
                  <input type="date" className="dispatcher-input h-10 flex-1" />
                  <input type="time" className="dispatcher-input h-10 w-28" />
                </div>
              </label>
            </div>

            <div className="text-[13px] font-semibold mt-2 mb-1">Unit Positioning Instructions</div>
            {instructions.map((row, idx) => (
              <div key={idx} className="relative rounded-lg p-3 mb-2" style={{ background: 'var(--bg-elevated)' }}>
                <button
                  type="button"
                  className="absolute top-2 right-2 p-1 rounded border-0 cursor-pointer"
                  style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}
                  onClick={() => removeInstruction(idx)}
                  aria-label="Remove instruction"
                >
                  <X size={16} />
                </button>
                <div className="grid grid-cols-2 gap-2 mb-2 pr-8">
                  <input
                    className="dispatcher-input h-9 text-[12px]"
                    placeholder="Unit ID"
                    value={row.unit}
                    onChange={(e) => updateInstruction(idx, 'unit', e.target.value)}
                  />
                  <input
                    className="dispatcher-input h-9 text-[12px]"
                    placeholder="Current location"
                    value={row.from}
                    onChange={(e) => updateInstruction(idx, 'from', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="dispatcher-input h-9 text-[12px]"
                    placeholder="Target standby point"
                    value={row.to}
                    onChange={(e) => updateInstruction(idx, 'to', e.target.value)}
                  />
                  <input
                    className="dispatcher-input h-9 text-[12px]"
                    placeholder="Move time"
                    value={row.at}
                    onChange={(e) => updateInstruction(idx, 'at', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button type="button" className="dispatcher-btn-ghost w-full h-10 flex items-center justify-center gap-1" onClick={addInstruction}>
              <Plus size={16} />
              Add Instruction
            </button>

            <label className="text-[12px] font-medium text-(--text-secondary)">
              Planning notes
              <textarea
                className="dispatcher-textarea w-full mt-1 min-h-[80px] text-[13px]"
                placeholder="Rationale for this plan, data sources used..."
              />
            </label>

            <div className="flex flex-wrap gap-2 mt-2">
              <button type="button" className="dispatcher-btn-ghost">Save as Draft</button>
              <button type="button" className="dispatcher-btn-primary inline-flex items-center gap-1.5">
                <Send size={16} />
                Submit to Operations Manager
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="dispatcher-surface p-4">
            <div className="flex items-center gap-2 mb-4">
              <ChartLine size={18} className="text-(--accent)" />
              <h3 className="text-[13px] font-semibold m-0">Coverage Simulator</h3>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded ml-auto"
                style={{ background: 'var(--accent-ghost)', color: 'var(--accent)' }}
              >
                AUTO-CALCULATES
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-mono uppercase text-(--text-muted)">Current Coverage</div>
                <div className="text-[28px] font-bold font-mono" style={{ color: 'var(--status-medium)' }}>
                  {BASE_COVERAGE}%
                </div>
                <div className="h-2 rounded-full bg-(--border) mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${BASE_COVERAGE}%`, background: 'var(--status-medium)' }} />
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase text-(--text-muted)">With This Plan</div>
                <div className="text-[28px] font-bold font-mono" style={{ color: 'var(--status-low)' }}>
                  {projected}%
                </div>
                <div className="h-2 rounded-full bg-(--border) mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${projected}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            </div>
            <div className="text-center text-[12px] font-semibold mt-2" style={{ color: 'var(--status-low)' }}>
              +{improvement}% improvement projected
            </div>
            {projected < 90 && (
              <div
                className="mt-3 p-2.5 rounded text-[12px]"
                style={{
                  background: 'var(--status-medium-bg)',
                  border: '1px solid var(--status-medium)',
                  color: 'var(--status-medium)',
                }}
              >
                Still below 90% target — consider adding more instructions
              </div>
            )}
          </div>

          <div className="dispatcher-surface p-4">
            <div className="flex flex-wrap justify-between gap-2 mb-3">
              <h3 className="text-[13px] font-semibold m-0">Plan Library</h3>
              <div className="flex flex-wrap gap-1">
                {['All', 'Draft', 'Pending', 'Approved', 'Rejected'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className="text-[10px] font-semibold px-2 py-1 rounded-full border cursor-pointer"
                    style={{
                      background: planFilter === f ? 'var(--accent-ghost)' : 'var(--bg-elevated)',
                      borderColor: planFilter === f ? 'var(--accent)' : 'var(--border)',
                      color: planFilter === f ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                    onClick={() => setPlanFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-wrap items-center gap-2 py-2.5 border-t border-(--border-subtle) text-[12px] hover:bg-(--bg-elevated) -mx-2 px-2 rounded"
              >
                <span className="font-mono text-(--accent) font-bold">{plan.id}</span>
                <span className="text-[13px] truncate flex-1 min-w-[120px]">{plan.name}</span>
                <span className="text-(--text-secondary)">{plan.district}</span>
                <span className="font-mono text-[11px] text-(--text-muted)">{plan.range}</span>
                <StatusBadge label={plan.status} variant={planStatusVariant(plan.status)} />
                <button type="button" className="dispatcher-btn-ghost text-[11px] py-1 px-2">
                  Open
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
