import api from '../lib/apiClient'

function transformPlan(p) {
  return {
    plan_id: p.planId,
    title: p.title,
    district_id: p.districtId,
    district_name: p.districtName,
    status: p.status,
    created_by_id: p.createdById,
    created_by_name: p.createdByName,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    description: p.description,
    event_date: p.eventDate,
  }
}

function transformInstruction(i) {
  return {
    instruction_id: i.instructionId,
    plan_id: i.planId,
    vehicle_id: i.vehicleId,
    vehicle_plate: i.vehiclePlate,
    from_location: i.fromLocation,
    to_location: i.toLocation,
    move_time: i.moveTime,
    notes: i.notes,
  }
}

function transformSimulation(s) {
  return {
    simulation_id: s.simulationId,
    name: s.name,
    scenario_type: s.scenarioType,
    district_id: s.districtId,
    status: s.status,
    coverage_score: s.coverageScore,
    response_time_avg: s.responseTimeAvg,
    units_deployed: s.unitsDeployed,
    run_by_name: s.runByName,
    ran_at: s.ranAt,
    notes: s.notes,
  }
}

function transformGap(g) {
  return {
    gap_id: g.gapId,
    district_id: g.districtId,
    district_name: g.districtName,
    severity: g.severity,
    description: g.description,
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
    title: body.title,
    districtId: body.district_id,
    description: body.description,
    eventDate: body.event_date,
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

export async function listSimulations() {
  const { data } = await api.get('/api/planning/simulations')
  return (data.data ?? data).map(transformSimulation)
}

export async function runSimulation(body) {
  const payload = {
    name: body.name,
    scenarioType: body.scenario_type,
    districtId: body.district_id,
    notes: body.notes,
  }
  const { data } = await api.post('/api/planning/simulations', payload)
  return transformSimulation(data.data ?? data)
}

export async function listCoverageGaps() {
  const { data } = await api.get('/api/planning/coverage-gaps')
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
