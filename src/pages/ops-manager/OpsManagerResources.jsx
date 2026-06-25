import { useState } from 'react'
import ResourceReallocationFlow from '../../components/ops-manager/ResourceReallocationFlow'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { OPS_MUTUAL_AID_HISTORY } from '../../data/mockOpsManagerData'
import OpsManagerDistrictLabel from '../../components/ops-manager/OpsManagerDistrictLabel'
import { mockMutualAidRequests } from '../../data/mockMutualAidRequests'
import { generateUuid } from '../../utils/formHelpers'
import { getCurrentUser } from '../../utils/authSession'
import { useNotificationsStore } from '../../store/notificationsStore'
import { getOpsManagerDistrict } from '../../utils/opsManagerDistrict'

const DURATION_HOURS = { '1h': 1, '2h': 2, '4h': 4, 'Full shift': 8 }

export default function OpsManagerResources() {
  const addNotification = useNotificationsStore((s) => s.addNotification)
  const [tab, setTab] = useState('recommendations')
  const [form, setForm] = useState({
    unitType: 'Police Van',
    qty: 2,
    targetDistrict: 'Bugesera',
    duration: '2h',
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const handleSubmitMutualAid = () => {
    const cu = getCurrentUser()
    const district = getOpsManagerDistrict()
    mockMutualAidRequests.push({
      request_id: generateUuid(),
      requesting_district_id: cu?.district_id || district,
      source_district_id: form.targetDistrict,
      requested_by: cu?.user_id || 'demo-user-uuid',
      unit_type: form.unitType,
      quantity: parseInt(form.qty, 10),
      duration: DURATION_HOURS[form.duration] ?? 2,
      reason: form.notes || null,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    })
    addNotification({
      id: `ma-${Date.now()}`,
      type: 'MUTUAL_AID_REQUEST',
      title: `Mutual Aid Request — ${form.targetDistrict}`,
      desc: `${form.qty}× ${form.unitType} for ${form.duration}`,
      time: 'Just now',
      read: false,
      href: '#resources',
      target_role: 'ops_manager',
    })
    setSubmitted(true)
    showToast(`Request submitted to ${form.targetDistrict}`)
  }

  return (
    <div className="portal-page relative">
      {toast && (
        <div
          className="fixed top-20 right-6 z-50 max-w-sm px-4 py-3 rounded-lg border text-[13px] font-medium shadow-lg"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--status-low)', color: 'var(--status-low)' }}
        >
          {toast}
        </div>
      )}
      <div className="mb-4">
        <h1 className="dispatcher-page-title m-0">Resource Reallocation</h1>
        <OpsManagerDistrictLabel />
      </div>
      <div className="flex flex-wrap gap-2 mb-6 border-b border-(--border) pb-2">
        {['recommendations', 'mutual-aid'].map((t) => (
          <button
            key={t}
            type="button"
            className="text-[13px] font-semibold px-4 py-2 border-none bg-transparent cursor-pointer border-b-2 -mb-[10px] transition-colors"
            style={{
              borderColor: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
            }}
            onClick={() => { setTab(t); setSubmitted(false) }}
          >
            {t === 'recommendations' ? 'AI Recommendations' : 'Mutual Aid'}
          </button>
        ))}
      </div>

      {tab === 'recommendations' && <ResourceReallocationFlow />}

      {tab === 'mutual-aid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dispatcher-surface p-5">
            <SectionTitle title="Request Mutual Aid" />
            {submitted ? (
              <div
                className="mt-4 p-4 rounded-lg flex flex-col gap-2"
                style={{ background: 'var(--status-low-bg)', border: '1px solid var(--status-low)' }}
              >
                <div className="font-bold text-(--status-low)">Request submitted</div>
                <p className="text-[13px] text-(--text-secondary) m-0">
                  {form.qty}× {form.unitType} requested from {form.targetDistrict} for {form.duration}.
                </p>
                <button
                  type="button"
                  className="dispatcher-btn-ghost text-[12px] self-start mt-2"
                  onClick={() => setSubmitted(false)}
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-4">
                <label className="dispatcher-field">
                  <span className="field-label">Unit type needed</span>
                  <select
                    className="dispatcher-input dispatcher-select"
                    value={form.unitType}
                    onChange={(e) => setForm((f) => ({ ...f, unitType: e.target.value }))}
                  >
                    {['Police Van', 'Motorcycle', 'Ambulance', 'Fire Unit'].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="dispatcher-field">
                  <span className="field-label">Quantity needed</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="dispatcher-input dispatcher-text-input"
                    value={form.qty}
                    onChange={(e) => setForm((f) => ({ ...f, qty: Number(e.target.value) }))}
                  />
                </label>
                <label className="dispatcher-field">
                  <span className="field-label">Source district</span>
                  <select
                    className="dispatcher-input dispatcher-select"
                    value={form.targetDistrict}
                    onChange={(e) => setForm((f) => ({ ...f, targetDistrict: e.target.value }))}
                  >
                    {['Bugesera', 'Rwamagana', 'Gasabo', 'Kicukiro'].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label className="dispatcher-field">
                  <span className="field-label">Duration needed</span>
                  <select
                    className="dispatcher-input dispatcher-select"
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  >
                    {['1h', '2h', '4h', 'Full shift'].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label className="dispatcher-field">
                  <span className="field-label">Reason / notes</span>
                  <textarea
                    className="dispatcher-input dispatcher-textarea"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </label>
                <button type="button" className="dispatcher-btn-primary w-full" onClick={handleSubmitMutualAid}>
                  Submit Mutual Aid Request
                </button>
              </div>
            )}
          </div>
          <div className="dispatcher-surface p-5">
            <SectionTitle title="Request History" />
            <div className="mt-4">
              {OPS_MUTUAL_AID_HISTORY.map((r) => (
                <div key={r.id} className="py-3 border-b border-(--border-subtle) last:border-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-(--accent)">{r.id}</span>
                    <span className="text-[12px] text-(--text-secondary)">
                      {r.district} · {r.qty}× {r.unitType}
                    </span>
                    <StatusBadge
                      label={r.status}
                      variant={
                        r.status === 'APPROVED' ? 'resolved' : r.status === 'PENDING' ? 'handover' : 'critical'
                      }
                    />
                    <span className="text-[11px] font-mono text-(--text-muted) ml-auto">{r.time}</span>
                  </div>
                  {r.arrived && <div className="text-[11px] text-(--status-low) mt-1">{r.arrived}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
