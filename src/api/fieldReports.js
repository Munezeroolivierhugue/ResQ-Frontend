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
    closed_by: c.closedById,
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
  const payload = {
    incidentId: body.incident_id,
    personsInvolved: body.persons_involved,
    injuries: body.injuries,
    suspects: body.suspects,
    sceneStatus: body.scene_status,
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
