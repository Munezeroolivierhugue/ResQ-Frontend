import { Link } from 'react-router-dom'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { OPS_ESCALATIONS } from '../../data/mockOpsManagerData'
import OpsManagerDistrictLabel from '../../components/ops-manager/OpsManagerDistrictLabel'

export default function OpsManagerEscalations() {
  return (
    <div className="portal-page">
      <h1 className="dispatcher-page-title m-0">Escalation Command</h1>
      <OpsManagerDistrictLabel />
      <p className="dispatcher-page-subtitle mt-2">Active escalations requiring operations manager oversight.</p>
      <div className="mt-6 flex flex-col gap-3">
        <SectionTitle title="Active Escalations" badge={<StatusBadge label={String(OPS_ESCALATIONS.length)} variant="critical" />} />
        {OPS_ESCALATIONS.map((esc) => (
          <div key={esc.id} className="dispatcher-surface p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-mono font-bold text-(--accent)">{esc.id}</span>
              <StatusBadge label={esc.severity.toUpperCase()} variant={esc.severity === 'critical' ? 'critical' : 'handover'} />
              <div className="text-[14px] font-semibold mt-1">{esc.type}</div>
              <div className="text-[12px] text-(--text-secondary)">{esc.location} · {esc.elapsed}</div>
            </div>
            <Link to={`/ops-manager/escalations/${esc.id}`} className="dispatcher-btn-primary no-underline text-[12px]">
              Take Command →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
