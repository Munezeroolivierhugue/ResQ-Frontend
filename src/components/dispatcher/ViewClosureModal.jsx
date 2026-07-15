import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import SectionTitle from './SectionTitle'
import FieldReportCard from './FieldReportCard'
import ClosureRecordCard from './ClosureRecordCard'
import { getReportForIncident, getClosureForIncident, listAttachments } from '../../api/fieldReports'
import { formatIncidentType } from '../../utils/incidentTypeLabels'

// Read-only "what was submitted" card — separate from IncidentClosure.jsx,
// which is the editable closure form. Clicking "View Closure" from Incident
// History previously routed into that editable page (with its own Close/
// Save-as-draft buttons), which makes no sense for an already-closed
// incident someone just wants to review.
export default function ViewClosureModal({ incident, open, onClose }) {
  const [fieldReport, setFieldReport] = useState(null)
  const [closure, setClosure] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !incident?.incident_id) return
    setLoading(true)
    Promise.allSettled([
      getReportForIncident(incident.incident_id),
      getClosureForIncident(incident.incident_id),
    ]).then(async ([frRes, clRes]) => {
      const fr = frRes.status === 'fulfilled' ? frRes.value : null
      setFieldReport(fr)
      setClosure(clRes.status === 'fulfilled' ? clRes.value : null)
      if (fr?.report_id) {
        try { setPhotos(await listAttachments(fr.report_id)) } catch { setPhotos([]) }
      } else {
        setPhotos([])
      }
    }).finally(() => setLoading(false))
  }, [open, incident?.incident_id])

  if (!open) return null

  const location = incident?.address ?? (incident?.district ? `${incident.district}${incident.sector ? ' / ' + incident.sector : ''}` : null)

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 border-none cursor-pointer"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-(--border) bg-(--bg-surface) p-5 md:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 border-none cursor-pointer text-(--text-secondary) hover:text-(--text-primary)"
          style={{ background: 'none' }}
        >
          <X size={18} />
        </button>

        <span className="dispatcher-eyebrow">Closure record</span>
        <h2 className="text-xl font-bold m-0 mt-1" style={{ fontFamily: 'var(--font-display)' }}>
          {incident?.incident_ref}
        </h2>
        <p className="text-[13px] text-(--text-secondary) m-0 mt-1">
          {formatIncidentType(incident?.incident_type) ?? 'Incident'}
          {incident?.district ? ` · ${incident.district}${incident.sector ? ' / ' + incident.sector : ''}` : ''}
          {incident?.address ? ` · ${incident.address}` : ''}
        </p>

        {loading ? (
          <p className="text-[13px] text-(--text-muted) mt-4">Loading…</p>
        ) : (
          <div className="flex flex-col gap-5 mt-4">
            <div>
              <SectionTitle title="Field responder's report" className="mb-3" />
              <FieldReportCard fieldReport={fieldReport} photos={photos} location={location} />
            </div>

            <div>
              <SectionTitle title="Dispatcher's closure record" className="mb-3" />
              <ClosureRecordCard closure={closure} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
