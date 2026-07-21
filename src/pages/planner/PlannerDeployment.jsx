import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Send, X, ChartLine, ChevronDown, ChevronUp } from 'lucide-react'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import { planStatusVariant } from '../../data/mockPlannerData'
import { getCurrentUser } from '../../utils/authSession'
import { listPlans, createPlan, updatePlanStatus, createInstruction, listInstructions, getDistrictCoverage } from '../../api/planning'
import { listDistricts } from '../../api/districts'
import { listVehicles } from '../../api/vehicles'
import { useToastStore } from '../../store/toastStore'

const EMPTY_INSTRUCTION = { vehicle_id: '', from_location: '', to_location: '', move_time: '' }
const PLAN_FILTERS = ['All', 'Draft', 'Submitted', 'Approved', 'Implemented']

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function fmtDate(iso) {
  if (!iso || iso === '—') return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function InstructionsPanel({ planId }) {
  const [instructions, setInstructions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listInstructions(planId)
      .then(setInstructions)
      .catch(() => setInstructions([]))
      .finally(() => setLoading(false))
  }, [planId])

  if (loading) return <p className="text-[11px] text-(--text-muted) m-0 py-2">Loading instructions…</p>
  if (instructions.length === 0) return <p className="text-[11px] text-(--text-muted) m-0 py-2">No positioning instructions on this plan.</p>

  return (
    <div className="flex flex-col gap-1.5 py-2">
      {instructions.map((i) => (
        <div key={i.instruction_id} className="text-[11px] text-(--text-secondary) flex flex-wrap gap-x-2">
          <span className="font-mono text-(--accent)">{i.vehicle_plate ?? '—'}</span>
          <span>{i.from_location || '—'} → {i.to_location || '—'}</span>
          {i.move_time && <span className="text-(--text-muted)">at {new Date(i.move_time).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</span>}
        </div>
      ))}
    </div>
  )
}

export default function PlannerDeployment() {
  const [searchParams] = useSearchParams()
  const zoneHint = searchParams.get('zone')

  const [districts, setDistricts] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [districtCoverage, setDistrictCoverage] = useState([])
  const [selectedDistrictId, setSelectedDistrictId] = useState('')

  const [instructions, setInstructions] = useState([{ ...EMPTY_INSTRUCTION }])
  const [planFilter, setPlanFilter] = useState('All')
  const [planName, setPlanName] = useState(zoneHint ? `${zoneHint} Response Plan` : '')
  const [activeFrom, setActiveFrom] = useState('')
  const [activeUntil, setActiveUntil] = useState('')
  const [activeUntilTime, setActiveUntilTime] = useState('')
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [openPlanId, setOpenPlanId] = useState(null)
  const pushToast = useToastStore((s) => s.pushToast)

  function showToast(msg, variant = 'success') {
    pushToast({ variant, title: variant === 'error' ? 'Error' : 'Deployment', message: msg })
  }

  useEffect(() => {
    listDistricts().then((d) => {
      setDistricts(d)
      const cu = getCurrentUser()
      setSelectedDistrictId(cu?.district_id || d[0]?.district_id || '')
    }).catch(() => {})
    getDistrictCoverage().then(setDistrictCoverage).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedDistrictId) { Promise.resolve().then(() => setVehicles([])); return }
    listVehicles({ districtId: selectedDistrictId }).then(setVehicles).catch(() => setVehicles([]))
  }, [selectedDistrictId])

  useEffect(() => {
    listPlans()
      .then((apiPlans) => {
        setPlans(apiPlans.map((p) => ({
          id: p.plan_id,
          shortId: p.plan_id ? p.plan_id.slice(0, 8).toUpperCase() : '—',
          plan_name: p.title ?? '(Untitled)',
          district: p.district_name ?? '—',
          active_from: p.active_from ?? '—',
          active_until: p.active_until ?? '—',
          status: p.status ?? 'DRAFT',
        })))
      })
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false))
  }, [])

  const selectedDistrict = districts.find((d) => d.district_id === selectedDistrictId)
  const coverageNow = districtCoverage.find((d) => d.district_id === selectedDistrictId)
  const filledInstructions = instructions.filter((i) => i.vehicle_id.trim() && i.to_location.trim())

  const filteredPlans =
    planFilter === 'All' ? plans : plans.filter((p) => p.status === planFilter.toUpperCase())

  const addInstruction = () => setInstructions((rows) => [...rows, { ...EMPTY_INSTRUCTION }])
  const removeInstruction = (idx) => setInstructions((rows) => rows.filter((_, i) => i !== idx))
  const updateInstruction = (idx, field, value) =>
    setInstructions((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))

  const savePlan = async (isDraft) => {
    if (saving) return
    if (!planName.trim()) { setSaveError('Plan name is required.'); return }
    setSaving(true)
    setSaveError(null)
    const activeUntilFull = activeUntil + (activeUntilTime ? 'T' + activeUntilTime : 'T00:00')
    try {
      // The backend's active_from/active_until are LocalDateTime — the raw
      // value from a plain <input type="date"> (e.g. "2026-07-17") has no
      // time component and fails JSON deserialization (400), so a
      // midnight time is appended here.
      const created = await createPlan({
        title: planName || '(Untitled Plan)',
        district_id: selectedDistrictId || null,
        active_from: activeFrom ? `${activeFrom}T00:00` : null,
        active_until: activeUntil ? activeUntilFull : null,
      })

      // Persist each real positioning instruction against the newly created
      // plan — previously these rows only ever lived in local component
      // state and were discarded the moment the page was left.
      for (const row of filledInstructions) {
        await createInstruction(created.plan_id, row).catch(() => {})
      }

      const finalPlan = isDraft ? created : await updatePlanStatus(created.plan_id, 'SUBMITTED')
      const libraryEntry = {
        id: finalPlan.plan_id,
        shortId: finalPlan.plan_id ? finalPlan.plan_id.slice(0, 8).toUpperCase() : generateId().toUpperCase(),
        plan_name: finalPlan.title ?? planName,
        district: finalPlan.district_name ?? selectedDistrict?.name ?? '—',
        active_from: finalPlan.active_from ?? activeFrom ?? '—',
        active_until: activeUntilFull || '—',
        status: finalPlan.status ?? (isDraft ? 'DRAFT' : 'SUBMITTED'),
      }
      setPlans((prev) => [libraryEntry, ...prev])
      showToast(isDraft ? 'Draft saved.' : 'Plan submitted to Operations Manager.')
      setInstructions([{ ...EMPTY_INSTRUCTION }])
      setPlanName('')
    } catch {
      setSaveError('Failed to save plan. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <PlannerPageHeader
        title="Deployment Planning"
        subtitle="Create and manage real unit positioning plans."
      />

      <div className="portal-split-45-55 gap-4">
        <div className="dispatcher-surface p-4">
          <SectionTitle title="Create Deployment Plan" />
          <div className="flex flex-col gap-3 mt-4">
            <label className="text-[12px] font-medium text-(--text-secondary)">
              Plan name *
              <input
                className="dispatcher-input dispatcher-text-input h-10 w-full mt-1 text-[13px]"
                placeholder="e.g. Friday PM Kimihurura Surge Plan"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </label>
            <label className="text-[12px] font-medium text-(--text-secondary)">
              District *
              <select
                className="dispatcher-input dispatcher-select h-10 w-full mt-1 text-[13px]"
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
              >
                {districts.map((d) => (
                  <option key={d.district_id} value={d.district_id}>{d.name}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-3">
              <label className="text-[12px] font-medium text-(--text-secondary)">
                Active from *
                <input
                  type="date"
                  className="dispatcher-input dispatcher-text-input h-10 w-full mt-1"
                  value={activeFrom}
                  onChange={(e) => setActiveFrom(e.target.value)}
                />
              </label>
              <label className="text-[12px] font-medium text-(--text-secondary)">
                Active until *
                <div className="flex flex-wrap gap-2 mt-1">
                  <input
                    type="date"
                    className="dispatcher-input dispatcher-text-input h-10 flex-1 min-w-0"
                    value={activeUntil}
                    onChange={(e) => setActiveUntil(e.target.value)}
                  />
                  <input
                    type="time"
                    className="dispatcher-input dispatcher-text-input h-10 flex-1 min-w-0"
                    value={activeUntilTime}
                    onChange={(e) => setActiveUntilTime(e.target.value)}
                  />
                </div>
              </label>
            </div>

            <div className="text-[13px] font-semibold mt-2 mb-1">Unit Positioning Instructions</div>
            <p className="text-[11px] text-(--text-muted) m-0 -mt-1 mb-1">Units shown are from the selected district's real fleet.</p>
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
                  <select
                    className="dispatcher-input dispatcher-select h-9 text-[12px]"
                    value={row.vehicle_id}
                    onChange={(e) => updateInstruction(idx, 'vehicle_id', e.target.value)}
                  >
                    <option value="">Select unit…</option>
                    {vehicles.map((v) => (
                      <option key={v.vehicle_id} value={v.vehicle_id}>
                        {v.plate_number} · {v.vehicle_type}
                      </option>
                    ))}
                  </select>
                  <input
                    className="dispatcher-input dispatcher-text-input h-9 text-[12px]"
                    placeholder="Current location"
                    value={row.from_location}
                    onChange={(e) => updateInstruction(idx, 'from_location', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="dispatcher-input dispatcher-text-input h-9 text-[12px]"
                    placeholder="Target standby point"
                    value={row.to_location}
                    onChange={(e) => updateInstruction(idx, 'to_location', e.target.value)}
                  />
                  <input
                    type="datetime-local"
                    className="dispatcher-input dispatcher-text-input h-9 text-[12px]"
                    value={row.move_time}
                    onChange={(e) => updateInstruction(idx, 'move_time', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button type="button" className="dispatcher-btn-ghost w-full h-10 flex items-center justify-center gap-1" onClick={addInstruction}>
              <Plus size={16} />
              Add Instruction
            </button>

            {saveError && (
              <div className="text-[12px] px-3 py-2 rounded" style={{ background: 'var(--status-critical-bg)', color: 'var(--status-critical)' }}>
                {saveError}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <button type="button" className="dispatcher-btn-ghost" onClick={() => savePlan(true)} disabled={saving}>
                {saving ? 'Saving…' : 'Save as Draft'}
              </button>
              <button type="button" className="dispatcher-btn-primary inline-flex items-center gap-1.5" onClick={() => savePlan(false)} disabled={saving}>
                <Send size={16} />
                {saving ? 'Submitting…' : 'Submit to Operations Manager'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="dispatcher-surface p-4">
            <div className="flex items-center gap-2 mb-4">
              <ChartLine size={18} className="text-(--accent)" />
              <h3 className="text-[13px] font-semibold m-0">District Coverage</h3>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded ml-auto"
                style={{ background: 'var(--accent-ghost)', color: 'var(--accent)' }}
              >
                LIVE
              </span>
            </div>
            {coverageNow ? (
              <>
                <div className="text-[11px] font-mono uppercase text-(--text-muted)">Current Fleet Availability — {selectedDistrict?.name}</div>
                <div className="text-[28px] font-bold font-mono" style={{ color: coverageNow.coverage_pct >= 60 ? 'var(--status-low)' : 'var(--status-critical)' }}>
                  {coverageNow.coverage_pct}%
                </div>
                <div className="h-2 rounded-full bg-(--border) mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${coverageNow.coverage_pct}%`, background: coverageNow.coverage_pct >= 60 ? 'var(--accent)' : 'var(--status-critical)' }} />
                </div>
                <div className="text-[11px] text-(--text-muted) mt-2">{coverageNow.available} of {coverageNow.total} units available right now</div>
              </>
            ) : (
              <p className="text-[12px] text-(--text-muted) m-0">No fleet data for this district.</p>
            )}
            <div className="text-[12px] mt-3 pt-3 border-t border-(--border-subtle)">
              {filledInstructions.length} real unit{filledInstructions.length === 1 ? '' : 's'} being repositioned in this plan
            </div>
          </div>

          <div className="dispatcher-surface p-4">
            <div className="flex flex-wrap justify-between gap-2 mb-3">
              <h3 className="text-[13px] font-semibold m-0">Plan Library</h3>
              <div className="flex flex-wrap gap-1">
                {PLAN_FILTERS.map((f) => (
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
            {plansLoading && (
              <div className="text-[12px] text-(--text-muted) py-4 text-center">Loading plans…</div>
            )}
            {!plansLoading && filteredPlans.length === 0 && (
              <div className="text-[12px] text-(--text-muted) py-4 text-center">No plans found.</div>
            )}
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="border-t border-(--border-subtle)">
                <div className="flex flex-wrap items-center gap-2 py-2.5 text-[12px] hover:bg-(--bg-elevated) -mx-2 px-2 rounded">
                  <span className="font-mono text-(--accent) font-bold">{plan.shortId}</span>
                  <span className="text-[13px] truncate flex-1 min-w-[120px]">{plan.plan_name}</span>
                  <span className="text-(--text-secondary)">{plan.district}</span>
                  <span className="font-mono text-[11px] text-(--text-muted)">{fmtDate(plan.active_from)}</span>
                  <StatusBadge label={plan.status} variant={planStatusVariant(plan.status)} />
                  <button
                    type="button"
                    className="dispatcher-btn-ghost text-[11px] py-1 px-2 inline-flex items-center gap-1"
                    onClick={() => setOpenPlanId(openPlanId === plan.id ? null : plan.id)}
                  >
                    {openPlanId === plan.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    Instructions
                  </button>
                </div>
                {openPlanId === plan.id && (
                  <div className="pl-2 -mt-1">
                    <InstructionsPanel planId={plan.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
