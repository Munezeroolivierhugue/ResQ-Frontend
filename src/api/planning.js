import api from '../lib/apiClient'

function transformPlan(p) {
  return {
    plan_id: p.planId,
    title: p.name ?? p.title,
    district_id: p.districtId,
    district_name: p.districtName,
    status: p.status,
    created_by_id: p.createdById,
    active_from: p.activeFrom,
    active_until: p.activeUntil,
    projected_coverage: p.projectedCoverage,
  }
}

function transformInstruction(i) {
  return {
    instruction_id: i.instructionId,
    plan_id: i.planId,
    vehicle_id: i.vehicleId,
    vehicle_plate: i.vehiclePlateNumber,
    from_location: i.fromLocation,
    to_location: i.toLocation,
    move_time: i.moveTime,
  }
}

function transformSimulation(s) {
  return {
    simulation_id: s.simulationId,
    scenario_type: s.scenarioType,
    disaster_scenario: s.disasterScenario,
    multiplier: s.multiplier,
    duration_hours: s.durationHours,
    focus_area: s.focusArea,
    projected_response_time: s.projectedResponseTime,
    projected_coverage: s.projectedCoverage,
    projected_incidents: s.projectedIncidents,
    baseline_response_time: s.baselineResponseTime,
    target_response_time: s.targetResponseTime,
    units_available: s.unitsAvailable,
    units_total: s.unitsTotal,
    units_short: s.unitsShort,
    created_at: s.createdAt,
  }
}

function transformGap(g) {
  return {
    gap_id: g.gapId,
    zone: g.zone,
    coverage: g.currentCoverage != null ? Math.round(g.currentCoverage) : 0,
    target_coverage: g.targetCoverage,
    recommendation: g.recommendation,
    detected_at: g.detectedAt,
  }
}

function transformEvent(e) {
  return {
    event_id: e.eventId,
    name: e.name,
    location: e.location,
    expected_attendance: e.expectedAttendance,
    event_date: e.eventDate,
    district_id: e.districtId,
    created_by_name: e.createdByName,
    risk_level: e.riskLevel,
  }
}

export async function listPlans(districtId, status) {
  const params = {}
  if (districtId) params.districtId = districtId
  if (status) params.status = status
  const { data } = await api.get('/api/planning/plans', { params })
  return (data.data ?? data).map(transformPlan)
}

export async function getPlan(id) {
  const { data } = await api.get(`/api/planning/plans/${id}`)
  return transformPlan(data.data ?? data)
}

export async function createPlan(body) {
  const payload = {
    name: body.title ?? body.name,
    districtId: body.district_id,
    activeFrom: body.active_from ?? null,
    activeUntil: body.active_until ?? null,
    projectedCoverage: body.projected_coverage ?? null,
  }
  const { data } = await api.post('/api/planning/plans', payload)
  return transformPlan(data.data ?? data)
}

export async function updatePlanStatus(id, status) {
  const { data } = await api.patch(`/api/planning/plans/${id}/status`, null, { params: { status } })
  return transformPlan(data.data ?? data)
}

export async function listInstructions(planId) {
  const { data } = await api.get(`/api/planning/plans/${planId}/instructions`)
  return (data.data ?? data).map(transformInstruction)
}

export async function createInstruction(planId, body) {
  const payload = {
    vehicleId: body.vehicle_id || null,
    fromLocation: body.from_location || null,
    toLocation: body.to_location || null,
    moveTime: body.move_time || null,
  }
  const { data } = await api.post(`/api/planning/plans/${planId}/instructions`, payload)
  return transformInstruction(data.data ?? data)
}

export async function listSimulations() {
  const { data } = await api.get('/api/planning/simulations')
  return (data.data ?? data).map(transformSimulation)
}

export async function runSimulation(body) {
  const payload = {
    scenarioType: body.scenario_type,
    disasterScenario: body.disaster_scenario ?? null,
    multiplier: body.multiplier ?? 1,
    durationHours: body.duration_hours ?? 4,
    districtId: body.district_id ?? null,
  }
  const { data } = await api.post('/api/planning/simulations', payload)
  return transformSimulation(data.data ?? data)
}

export async function listCoverageGaps(districtId) {
  const { data } = await api.get('/api/planning/coverage-gaps', {
    params: districtId ? { districtId } : {},
  })
  return (data.data ?? data).map(transformGap)
}

export async function listEvents() {
  const { data } = await api.get('/api/planning/events')
  return (data.data ?? data).map(transformEvent)
}

export async function createEvent(body) {
  const payload = {
    name: body.name,
    location: body.location,
    expectedAttendance: body.expected_attendance,
    eventDate: body.event_date,
    districtId: body.district_id,
    riskLevel: body.risk_level,
  }
  const { data } = await api.post('/api/planning/events', payload)
  return transformEvent(data.data ?? data)
}

export async function getPredictions(params = {}) {
  const { data } = await api.get('/api/planning/predictions', { params })
  return data.data ?? data
}

export async function getHotspots(params = {}) {
  const mapped = {}
  if (params.districtId) mapped.districtId = params.districtId
  if (params.incidentType) mapped.incidentType = params.incidentType
  if (params.days) mapped.days = params.days
  const { data } = await api.get('/api/planning/hotspots', { params: mapped })
  return (data.data ?? data).map((h) => ({
    name: h.name,
    lat: h.lat,
    lng: h.lng,
    count: h.count,
    top_type: h.topType,
    density: h.density,
    previous_count: h.previousCount,
    increase_pct: h.increasePct,
  }))
}

export async function getDistrictCoverage() {
  const { data } = await api.get('/api/planning/district-coverage')
  return (data.data ?? data).map((d) => ({
    district_id: d.districtId,
    district_name: d.districtName,
    lat: d.lat,
    lng: d.lng,
    coverage_pct: d.coveragePct,
    available: d.available,
    total: d.total,
  }))
}

export async function getCoverageGapDetails(districtId) {
  const { data } = await api.get('/api/planning/coverage-gap-details', {
    params: districtId ? { districtId } : {},
  })
  return (data.data ?? data).map((g) => ({
    zone: g.zone,
    district_id: g.districtId,
    district_name: g.districtName,
    coverage: g.currentCoverage,
    target_coverage: g.targetCoverage,
    recommendation: g.recommendation,
    district_incidents_30d: g.districtIncidents30d,
    nearest_unit_plate: g.nearestUnitPlate,
    nearest_unit_distance_km: g.nearestUnitDistanceKm,
  }))
}

export async function getIncidentTimeDistribution(params = {}) {
  const mapped = {}
  if (params.districtId) mapped.districtId = params.districtId
  if (params.incidentType) mapped.incidentType = params.incidentType
  if (params.days) mapped.days = params.days
  const { data } = await api.get('/api/planning/incident-time-distribution', { params: mapped })
  const d = data.data ?? data
  return {
    by_hour: d.byHour ?? [],
    by_day: d.byDay ?? [],
    by_month: d.byMonth ?? [],
  }
}
