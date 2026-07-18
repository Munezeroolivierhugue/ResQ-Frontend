import api from '../lib/apiClient'

function transformReport(r) {
  // Backend returns `period` (e.g. "2026-07"), derive start/end from it
  let periodStart = r.periodStart ?? null
  let periodEnd = r.periodEnd ?? null
  if (!periodStart && r.period) {
    const [yr, mo] = r.period.split('-').map(Number)
    const lastDay = new Date(yr, mo, 0).getDate()
    periodStart = `${yr}-${String(mo).padStart(2, '0')}-01`
    periodEnd = `${yr}-${String(mo).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  }
  return {
    report_id: r.reportId,
    report_type: r.reportType,
    district_id: r.districtId,
    district_name: r.districtName,
    period_start: periodStart,
    period_end: periodEnd,
    status: r.status,
    generated_by_name: r.createdByName ?? null,
    generated_at: r.generatedAt ?? r.createdAt ?? null,
    total_incidents: r.totalIncidents,
    avg_response_time: r.avgResponseTime,
    resolution_rate: r.resolutionRate ?? r.dispatchAccuracy ?? null,
    submitted_at: r.submittedAt,
  }
}

function transformUnitPerf(u) {
  return {
    perf_id: u.recordId ?? u.perfId,
    vehicle_id: u.vehicleId,
    plate_number: u.plateNumber,
    period: u.period,
    total_dispatches: u.totalDispatches ?? u.incidentsHandled ?? null,
    avg_response_time: u.avgResponseTime,
    on_time_rate: u.onTimeRate != null ? u.onTimeRate : (u.performanceScore != null ? u.performanceScore / 100 : null),
    incidents_resolved: u.incidentsResolved ?? u.incidentsHandled ?? null,
    ai_acceptance_rate: u.aiAcceptanceRate ?? null,
    computed_at: u.computedAt ?? null,
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
    resource_type: r.unitType,
    quantity: r.quantity,
    reason: r.justification,
    urgency: r.urgency,
    status: r.status,
    requested_by_name: r.requestedByName ?? null,
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
    period: body.period ?? null,
    periodStart: body.period_start ?? null,
    periodEnd: body.period_end ?? null,
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

// Computes (and persists) a real performance record for one vehicle over a
// period ("YYYY-MM") from its actual dispatch/response-time/AI-acceptance
// history — nothing in the app ever called this, so unit_performance rows
// never existed and every performance column silently showed "—".
export async function computeUnitPerformance(vehicleId, period) {
  const { data } = await api.post(`/api/reporting/unit-performance/${vehicleId}`, null, { params: { period } })
  return transformUnitPerf(data.data ?? data)
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
    unitType: body.resource_type ?? body.unit_type,
    quantity: body.quantity,
    urgency: body.urgency ?? null,
    justification: body.reason ?? body.justification ?? null,
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

export async function getAnomalies() {
  const { data } = await api.get('/api/reporting/anomalies')
  const d = data.data ?? data
  return {
    anomalies: (d.anomalies ?? []).map((a) => ({
      incident_id: a.incidentId,
      incident_ref: a.incidentRef,
      incident_type: a.incidentType,
      district_name: a.districtName,
      anomaly_score: a.anomalyScore,
      reasoning: a.reasoning,
    })),
    total_analyzed: d.totalAnalyzed,
    model_version: d.modelVersion,
    message: d.message,
    analysed_at: d.analysedAt,
  }
}

export async function getDistrictBenchmark(days) {
  const { data } = await api.get('/api/reporting/district-benchmark', { params: days ? { days } : {} })
  return (data.data ?? data).map((r) => ({
    district: r.districtName,
    incidents: r.incidents,
    avg_response: r.avgResponseTime,
    target_met: r.targetMet,
    coverage_pct: r.coveragePct,
    resolution_pct: r.resolutionRate,
    ai_acceptance_pct: r.aiAcceptance,
    rank: r.rank,
  }))
}

export async function getFieldReportQuality() {
  const { data } = await api.get('/api/reporting/field-report-quality')
  const d = data.data ?? data
  return {
    fully_complete_pct: d.fullyCompletePct,
    partially_complete_pct: d.partiallyCompletePct,
    not_submitted_pct: d.notSubmittedPct,
    missed_fields: (d.missedFields ?? []).map((f) => ({ field: f.field, skip_rate_pct: f.skipRatePct })),
    low_units: (d.lowUnits ?? []).map((u) => ({
      vehicle_plate: u.vehiclePlate,
      officer_name: u.officerName,
      completion_rate_pct: u.completionRatePct,
      missing_fields: u.missingFields,
    })),
  }
}

export async function getOverrideAnalysis() {
  const { data } = await api.get('/api/reporting/override-analysis')
  return (data.data ?? data).map((r) => ({
    reason: r.reason,
    count: r.count,
    avg_response_overridden: r.avgResponseOverridden,
    avg_response_baseline: r.avgResponseBaseline,
    better_count: r.betterCount,
    worse_count: r.worseCount,
    recommendation: r.recommendation,
  }))
}
