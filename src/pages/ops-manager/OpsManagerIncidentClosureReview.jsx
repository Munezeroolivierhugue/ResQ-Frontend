import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import SurfaceCard from '../../components/dispatcher/SurfaceCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import SeverityBadge from '../../components/dispatcher/SeverityBadge'
import FieldReportCard from '../../components/dispatcher/FieldReportCard'
import ClosureRecordCard from '../../components/dispatcher/ClosureRecordCard'
import { getReportForIncident, getClosureForIncident, listAttachments } from '../../api/fieldReports'
import { formatIncidentType } from '../../utils/incidentTypeLabels'

export default function OpsManagerIncidentClosureReview() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const incident = state?.incident ?? null

  const [fieldReport, setFieldReport] = useState(null)
  const [closure, setClosure] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!incident?.incident_id) { setLoading(false); return }
    Promise.allSettled([
      getReportForIncident(incident.incident_id),
      getClosureForIncident(incident.incident_id),
    ]).then(async ([frRes, clRes]) => {
      const fr = frRes.status === 'fulfilled' ? frRes.value : null
      setFieldReport(fr)
      setClosure(clRes.status === 'fulfilled' ? clRes.value : null)
      if (fr?.report_id) {
        try { setPhotos(await listAttachments(fr.report_id)) } catch { /* none */ }
      }
    }).finally(() => setLoading(false))
  }, [incident?.incident_id])

  if (!incident) {
    return (
      <div className="portal-page">
        <div className="flex flex-col items-center gap-3 mt-16 text-center" style={{ color: 'var(--text-secondary)' }}>
          <FileText size={40} style={{ opacity: 0.4 }} />
          <p className="text-[15px] font-semibold text-(--text-primary)">No incident selected</p>
          <p className="text-[13px]">Open this from Closed Incidents to review a specific incident.</p>
          <button type="button" className="dispatcher-btn-primary text-[13px]" onClick={() => navigate('/ops-manager/closed-incidents')}>
            Go to Closed Incidents
          </button>
        </div>
      </div>
    )
  }

  const location = incident.address ?? (incident.district ? `${incident.district}${incident.sector ? ' / ' + incident.sector : ''}` : null)

  return (
    <div className="portal-page">
      <span className="dispatcher-eyebrow">Incident closure review</span>
      <h1 className="text-2xl font-bold m-0" style={{ fontFamily: 'var(--font-display)' }}>
        {incident.incident_ref}
      </h1>
      <p className="dispatcher-page-subtitle mt-1">
        {formatIncidentType(incident.incident_type)} · <SeverityBadge severity={incident.severity} /> · {incident.district}{incident.sector ? ` / ${incident.sector}` : ''}
      </p>

      {loading ? (
        <p className="text-[13px] text-(--text-muted) mt-6">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <SurfaceCard padding="p-5 md:p-6">
            <SectionTitle title="Field responder's report" className="mb-4" />
            <FieldReportCard fieldReport={fieldReport} photos={photos} location={location} />
          </SurfaceCard>

          <SurfaceCard padding="p-5 md:p-6">
            <SectionTitle title="Dispatcher's closure record" className="mb-4" />
            <ClosureRecordCard closure={closure} />
          </SurfaceCard>
        </div>
      )}
    </div>
  )
}
