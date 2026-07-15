import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import SectionTitle from './SectionTitle'
import FieldReportCard from './FieldReportCard'
import ClosureRecordCard from './ClosureRecordCard'
import { getReportForIncident, getClosureForIncident, listAttachments } from '../../api/fieldReports'
import { listDispatchesForIncident } from '../../api/dispatches'
import { listVehicles } from '../../api/vehicles'
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
  // Every unit that served this incident — previously this read-only view
  // only ever showed the single field responder's report, with no way to see
  // other units (e.g. backup units an Ops Manager dispatched) that also
  // responded to the same incident.
  const [respondingUnits, setRespondingUnits] = useState([])

  useEffect(() => {
    if (!open || !incident?.incident_id) return
    setLoading(true)
    Promise.allSettled([
      getReportForIncident(incident.incident_id),
      getClosureForIncident(incident.incident_id),
      listDispatchesForIncident(incident.incident_id),
      listVehicles(),
    ]).then(async ([frRes, clRes, dispRes, vehRes]) => {
      const fr = frRes.status === 'fulfilled' ? frRes.value : null
      setFieldReport(fr)
      setClosure(clRes.status === 'fulfilled' ? clRes.value : null)
      if (fr?.report_id) {
        try { setPhotos(await listAttachments(fr.report_id)) } catch { setPhotos([]) }
      } else {
        setPhotos([])
      }
      const dispatches = dispRes.status === 'fulfilled' ? dispRes.value : []
      const vehicles = vehRes.status === 'fulfilled' ? vehRes.value : []
      const vehicleMap = new Map(vehicles.map((v) => [v.vehicle_id, v]))
      setRespondingUnits(dispatches.map((d) => {
        const v = vehicleMap.get(d.vehicle_id) ?? {}
        return {
          id: d.vehicle_plate ?? v.plate_number ?? d.vehicle_id,
          type: v.vehicle_type ?? 'Unit',
          isBackup: d.override_reason === 'backup_request',
        }
      }))
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
            {respondingUnits.length > 0 && (
              <div>
                <SectionTitle title="Responding units" className="mb-3" />
                <div className="flex flex-col gap-2">
                  {respondingUnits.map((u, i) => (
                    <div
                      key={u.id + i}
                      className="flex flex-wrap items-center gap-2 py-1.5 text-[12px] border-b border-(--border-subtle) last:border-0"
                    >
                      <span className="font-mono font-bold text-(--accent)">{u.id}</span>
                      <span className="text-(--text-secondary)">· {u.type}</span>
                      {u.isBackup && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--status-medium-bg)', color: 'var(--status-medium)' }}
                        >
                          Backup
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
