import api from '../lib/apiClient'

function transformReport(r) {
  return {
    report_id: r.reportId,
    report_type: r.reportType,
    district_id: r.districtId,
    district_name: r.districtName,
    period_start: r.periodStart,
    period_end: r.periodEnd,
    status: r.status,
    generated_by_name: r.generatedByName,
    generated_at: r.generatedAt,
    total_incidents: r.totalIncidents,
    avg_response_time: r.avgResponseTime,
    resolution_rate: r.resolutionRate,
    submitted_at: r.submittedAt,
  }
}

function transformUnitPerf(u) {
  return {
    perf_id: u.perfId,
    vehicle_id: u.vehicleId,
    plate_number: u.plateNumber,
    period: u.period,
    total_dispatches: u.totalDispatches,
    avg_response_time: u.avgResponseTime,
    on_time_rate: u.onTimeRate,
    incidents_resolved: u.incidentsResolved,
    computed_at: u.computedAt,
  }
}

function transformDataQuality(d) {
  return {
    record_id: d.recordId,
    source: d.source,
    completeness: d.completeness,
    accuracy: d.accuracy,
    timeliness: d.timeliness,
    overall_score: d.overallScore,
    issues_found: d.issuesFound,
    checked_at: d.checkedAt,
  }
}

function transformResourceRequest(r) {
  return {
    request_id: r.requestId,
    district_id: r.districtId,
    district_name: r.districtName,
    resource_type: r.resourceType,
    quantity: r.quantity,
    reason: r.reason,
    status: r.status,
    requested_by_name: r.requestedByName,
    created_at: r.createdAt,
  }
}

export async function listReports(reportType, districtId) {
  const params = {}
  if (reportType) params.reportType = reportType
  if (districtId) params.districtId = districtId
  const { data } = await api.get('/api/reporting/reports', { params })
  return (data.data ?? data).map(transformReport)
}

export async function getReport(id) {
  const { data } = await api.get(`/api/reporting/reports/${id}`)
  return transformReport(data.data ?? data)
}

export async function generateReport(body) {
  const payload = {
    reportType: body.report_type,
    districtId: body.district_id,
    periodStart: body.period_start,
    periodEnd: body.period_end,
  }
  const { data } = await api.post('/api/reporting/reports', payload)
  return transformReport(data.data ?? data)
}

export async function submitReport(id) {
  const { data } = await api.post(`/api/reporting/reports/${id}/submit`)
  return transformReport(data.data ?? data)
}

export async function listUnitPerformance(vehicleId) {
  const params = vehicleId ? { vehicleId } : {}
  const { data } = await api.get('/api/reporting/unit-performance', { params })
  return (data.data ?? data).map(transformUnitPerf)
}

export async function listDataQuality() {
  const { data } = await api.get('/api/reporting/data-quality')
  return (data.data ?? data).map(transformDataQuality)
}

export async function runDataQualityCheck(source) {
  const { data } = await api.post('/api/reporting/data-quality/check', null, { params: { source } })
  return transformDataQuality(data.data ?? data)
}

export async function listResourceRequests(districtId, status) {
  const params = {}
  if (districtId) params.districtId = districtId
  if (status) params.status = status
  const { data } = await api.get('/api/reporting/resource-requests', { params })
  return (data.data ?? data).map(transformResourceRequest)
}

export async function createResourceRequest(body) {
  const payload = {
    districtId: body.district_id,
    resourceType: body.resource_type,
    quantity: body.quantity,
    reason: body.reason,
  }
  const { data } = await api.post('/api/reporting/resource-requests', payload)
  return transformResourceRequest(data.data ?? data)
}

export async function listPatterns() {
  const { data } = await api.get('/api/reporting/patterns')
  return data.data ?? data
}

export async function listModels() {
  const { data } = await api.get('/api/reporting/models')
  return data.data ?? data
}
