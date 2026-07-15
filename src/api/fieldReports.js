import api from '../lib/apiClient'

function transform(r) {
  return {
    report_id: r.reportId,
    incident_id: r.incidentId,
    incident_ref: r.incidentRef,
    vehicle_id: r.vehicleId,
    vehicle_plate: r.vehiclePlate,
    responder_id: r.responderId,
    responder_name: r.responderName,
    persons_involved: r.personsInvolved,
    injuries: r.injuries,
    suspects: r.suspects,
    scene_status: r.sceneStatus,
    confirmed_type: r.confirmedType,
    description: r.description,
    agencies_involved: r.agenciesInvolved,
    case_reference: r.caseReference,
    entry_method: r.entryMethod,
    submitted_at: r.submittedAt,
  }
}

function transformClosure(c) {
  return {
    closure_id: c.closureId,
    incident_id: c.incidentId,
    incident_ref: c.incidentRef,
    persons_involved: c.personsInvolved,
    casualties: c.casualties,
    arrests: c.arrests,
    final_disposition: c.finalDisposition,
    closure_notes: c.closureNotes,
    data_source: c.dataSource,
    // Backend already returned closedByName correctly — this was mapping
    // to the raw closedById UUID instead, which is why every "Closed by"
    // line on the review screens rendered a GUID instead of a name.
    closed_by: c.closedByName,
    closed_by_id: c.closedById,
    closed_at: c.closedAt,
  }
}

export async function listMyReports() {
  const { data } = await api.get('/api/field-reports/my')
  return (data.data ?? data).map(transform)
}

export async function getReportForIncident(incidentId) {
  const { data } = await api.get(`/api/incidents/${incidentId}/field-report`)
  return transform(data.data ?? data)
}

export async function submitFieldReport(body) {
  // body snake_case; convert to camelCase for backend
  // vehicleId was previously dropped here even though the store always sent
  // it — the backend needs it both to link the report to the right vehicle
  // and to notify the correct dispatcher (the one who dispatched this unit,
  // not an arbitrary one on a multi-unit incident).
  const payload = {
    incidentId: body.incident_id,
    vehicleId: body.vehicle_id,
    personsInvolved: body.persons_involved,
    injuries: body.injuries,
    suspects: body.suspects,
    sceneStatus: body.scene_status,
    confirmedType: body.confirmed_type,
    description: body.description,
    agenciesInvolved: body.agencies_involved,
    caseReference: body.case_reference,
    entryMethod: body.entry_method ?? 'STRUCTURED',
  }
  const { data } = await api.post('/api/field-reports', payload)
  return transform(data.data ?? data)
}

export async function getClosureForIncident(incidentId) {
  const { data } = await api.get(`/api/incidents/${incidentId}/closure`)
  return transformClosure(data.data ?? data)
}

export async function uploadAttachment(reportId, file, caption) {
  const form = new FormData()
  form.append('file', file)
  if (caption) form.append('caption', caption)
  const { data } = await api.post(`/api/field-reports/${reportId}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const a = data.data ?? data
  return {
    attachment_id: a.attachmentId,
    file_url: a.fileUrl,
    file_type: a.fileType,
    caption: a.caption,
  }
}

// Backend serves attachments as plain static files (FileStorageService) under
// a relative path like "/reports/{id}/{name}" — never something the frontend
// previously fetched or rendered anywhere, so submitted photos silently never
// reached the dispatcher despite uploading successfully.
export async function listAttachments(reportId) {
  const { data } = await api.get(`/api/field-reports/${reportId}/attachments`)
  return (data.data ?? data).map((a) => ({
    attachment_id: a.attachmentId,
    file_url: a.fileUrl,
    file_type: a.fileType,
    caption: a.caption,
  }))
}

// Attachment fileUrls are backend-relative; the API client's baseURL is ''
// in dev (proxied) but must be the real backend origin in production.
export function attachmentUrl(fileUrl) {
  if (!fileUrl) return ''
  const base = import.meta.env.VITE_API_URL ?? ''
  return `${base}${fileUrl}`
}

export async function createClosure(body) {
  const payload = {
    incidentId: body.incident_id,
    personsInvolved: body.persons_involved,
    casualties: body.casualties,
    arrests: body.arrests,
    finalDisposition: body.final_disposition,
    closureNotes: body.closure_notes,
  }
  const { data } = await api.post('/api/incident-closures', payload)
  return transformClosure(data.data ?? data)
}
