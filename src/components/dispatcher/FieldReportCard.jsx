import { User, Image as ImageIcon } from 'lucide-react'
import { attachmentUrl } from '../../api/fieldReports'
import { formatIncidentType } from '../../utils/incidentTypeLabels'

function Row({ label, value }) {
  return (
    <div className="text-(--text-secondary)">
      {label}: <strong className="text-(--text-primary)">{value}</strong>
    </div>
  )
}

// Read-only, one-field-per-line rendering of a submitted field report —
// shared by every screen that reviews it (Active Incident, Incident
// Closure, View Closure modal, Ops Manager's closure review) so the layout
// stays consistent instead of four independently-drifting copies.
export default function FieldReportCard({ fieldReport, photos = [], location }) {
  if (!fieldReport) {
    return <p className="text-[13px] text-(--text-muted) m-0">No field report was submitted for this incident.</p>
  }
  return (
    <div className="flex flex-col gap-1.5 text-[13px]">
      <div className="flex items-center gap-1.5 text-(--text-secondary)">
        <User size={13} />
        <span>
          Submitted by <strong className="text-(--text-primary)">{fieldReport.responder_name ?? 'Field responder'}</strong>
          {fieldReport.vehicle_plate ? ` (${fieldReport.vehicle_plate})` : ''}
        </span>
      </div>
      {fieldReport.submitted_at && <Row label="on" value={new Date(fieldReport.submitted_at).toLocaleString()} />}
      <Row label="Confirmed type" value={formatIncidentType(fieldReport.confirmed_type) ?? '—'} />
      <Row label="Location" value={location ?? '—'} />
      <Row label="Persons involved" value={fieldReport.persons_involved ?? '—'} />
      <Row label="Injuries" value={fieldReport.injuries ? 'Yes' : 'No'} />
      <Row label="Suspects" value={fieldReport.suspects ? 'Yes' : 'No'} />
      <Row label="Scene status" value={fieldReport.scene_status ?? '—'} />
      {fieldReport.description && (
        <div className="text-(--text-secondary)">
          details: <span className="text-(--text-primary)">{fieldReport.description}</span>
        </div>
      )}
      {photos.length > 0 && (
        <div>
          <div className="text-(--text-secondary) mb-1">image evidence:</div>
          <div className="flex flex-wrap gap-2">
            {photos.map((p) => (
              p.file_type === 'IMAGE' ? (
                <a key={p.attachment_id} href={attachmentUrl(p.file_url)} target="_blank" rel="noreferrer">
                  <img
                    src={attachmentUrl(p.file_url)}
                    alt={p.caption ?? 'Field report attachment'}
                    style={{ width: 96, height: 96, objectFit: 'cover' }}
                    className="rounded-md border border-(--border-subtle)"
                  />
                </a>
              ) : (
                <span key={p.attachment_id} className="text-[11px] text-(--accent) inline-flex items-center gap-1">
                  <ImageIcon size={12} /> {p.file_type ?? 'File'}
                </span>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
