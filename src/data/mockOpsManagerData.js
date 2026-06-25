export const OPS_ESCALATIONS = [
  {
    id: 'INC-2403',
    severity: 'critical',
    type: 'Structure Fire & Medical Standby',
    location: 'Nyarugenge · Nyamirambo · KN 3 Ave',
    elapsed: '00:25:14',
    reason: 'Officer Needs Assistance triggered',
    lat: -1.9403,
    lng: 30.0588,
  },
  {
    id: 'INC-2407',
    severity: 'high',
    type: 'Armed Robbery in Progress',
    location: 'Nyarugenge · Biryogo sector',
    elapsed: '00:08:33',
    reason: 'Manual escalation by dispatcher',
    lat: -1.9659,
    lng: 30.0444,
  },
]

export const OPS_AI_RECOMMENDATIONS = [
  {
    id: 'REC-0041',
    status: 'pending',
    text: 'Move P-07 → Nyamirambo Standby',
    reason: 'Predicted demand spike in Nyamirambo (+34% confidence)',
    impact: '+6.2% zone coverage',
    confidence: 82,
    detail: 'Relocate P-07 from Nyarugenge Centre to Nyamirambo Standby Point',
    demand: 'Demand forecast: +34% incident probability in Nyamirambo next 22 minutes',
    coverageGain: 'Projected coverage gain: +6.2% | Response time improvement: −1.4m',
  },
  {
    id: 'REC-0042',
    status: 'pending',
    text: 'Move POL-12 → Muhima Patrol Loop',
    reason: 'Coverage gap detected after INC-2403 resource draw',
    impact: '+4.1% zone coverage',
    confidence: 76,
    detail: 'Relocate POL-12 from KN 4 Ave to Muhima Patrol Loop',
    demand: 'Post-incident redeployment — maintain Nyarugenge corridor visibility',
    coverageGain: 'Projected coverage gain: +4.1% | Response time improvement: −0.9m',
  },
  {
    id: 'REC-0043',
    status: 'pending',
    text: 'Pre-position AMB-11 at Biryogo Junction',
    reason: 'Medical call cluster forecast 18 min',
    impact: '+3.8% medical reach',
    confidence: 71,
    detail: 'Pre-position AMB-11 at Biryogo Junction standby',
    demand: 'Medical demand index rising in Nyarugenge south sector',
    coverageGain: 'Projected coverage gain: +3.8% | Response time improvement: −2.1m',
  },
  {
    id: 'REC-0038',
    status: 'pending',
    text: 'Shift M-04 to Nyarugenge Rapid Response',
    reason: 'Motorcycle availability surplus near Muhima',
    impact: '+2.5% rapid response',
    confidence: 68,
    detail: 'Shift M-04 from Nyamirambo to Nyarugenge Centre rapid response node',
    demand: 'Rebalance motorcycle coverage for evening peak in Nyarugenge',
    coverageGain: 'Projected coverage gain: +2.5% | Response time improvement: −0.6m',
  },
]

export const OPS_DISPATCHERS = [
  { id: 'DSP-0042', user_id: 'u1111111-0000-4000-8000-000000000001', name: 'Jean Bosco Nkurunziza', initials: 'JB', workload: 'normal', incidents: 4, incidents_handled: 31, ai_acceptance_rate: 94, status: 'ON DUTY', district: 'Nyarugenge' },
  { id: 'DSP-0018', user_id: 'udsp0018-0000-4000-8000-000000000018', name: 'Aline Mukamana', initials: 'AM', workload: 'high', incidents: 9, incidents_handled: 44, ai_acceptance_rate: 71, status: 'ON DUTY', district: 'Nyarugenge' },
  { id: 'DSP-0027', user_id: 'udsp0027-0000-4000-8000-000000000027', name: 'Claude Kabera', initials: 'CK', workload: 'normal', incidents: 3, incidents_handled: 28, ai_acceptance_rate: 88, status: 'ON DUTY', district: 'Nyarugenge' },
  { id: 'DSP-0033', user_id: 'udsp0033-0000-4000-8000-000000000033', name: 'Divine Uwase', initials: 'DU', workload: 'overload', incidents: 12, incidents_handled: 52, ai_acceptance_rate: 58, status: 'ON BREAK', district: 'Nyarugenge' },
]


export const OPS_FLEET = [
  { type: 'Police Vans', available: 7, total: 10 },
  { type: 'Motorcycles', available: 12, total: 15 },
  { type: 'Ambulances', available: 3, total: 5 },
  { type: 'Fire Units', available: 4, total: 4 },
]

export const OPS_DASHBOARD_RECOMMENDATIONS = OPS_AI_RECOMMENDATIONS.slice(0, 2)

export const OPS_MUTUAL_AID_HISTORY = [
  { id: 'MAR-001', district: 'Bugesera', unitType: 'Police Van', qty: 2, status: 'APPROVED', time: '14:02', arrived: '2 units arrived' },
  { id: 'MAR-002', district: 'Rwamagana', unitType: 'Ambulance', qty: 1, status: 'PENDING', time: '14:18', arrived: null },
  { id: 'MAR-003', district: 'Gasabo', unitType: 'Motorcycle', qty: 3, status: 'DECLINED', time: '13:45', arrived: null },
]

export const OPS_AGENCIES = [
  { id: 'rnp', agency_id: 'ag333333-0000-4000-8000-000000000003', name: 'Rwanda National Police', color: 'var(--accent)', units: 14, status: 'ACTIVE', last_communication_at: '14:24:06' },
  { id: 'fire', agency_id: 'ag222222-0000-4000-8000-000000000002', name: 'Kigali Fire & Rescue', color: 'var(--status-critical)', units: 4, status: 'ACTIVE', last_communication_at: '14:22:41' },
  { id: 'med', agency_id: 'ag111111-0000-4000-8000-000000000001', name: 'SAMU / Medical', color: 'var(--status-info)', units: 3, status: 'EN ROUTE', last_communication_at: '14:20:15' },
  { id: 'rib', agency_id: 'agrib0000-0000-4000-8000-000000000004', name: 'RIB Forensics', color: 'var(--status-medium)', units: 0, status: 'STAGING', last_communication_at: '14:05:00' },
]

export const OPS_AGENCY_OPTIONS = [
  'Rwanda National Police',
  'Kigali Fire & Rescue',
  'SAMU / Medical',
  'RIB',
  'Traffic Police',
]

export const OPS_ESCALATION_DETAIL = {
  'INC-2403': {
    id: 'INC-2403',
    type: 'Structure Fire & Medical Standby',
    severity: 'critical',
    location: 'Nyarugenge · KN 3 Ave near Nyamirambo Market',
    lat: -1.9403,
    lng: 30.0588,
    fieldReportUnit: 'FTK-02',
    reassessment: {
      updated: '14:26',
      severity: 'CRITICAL',
      additionalUnits: '2× FTK, 1× AMB',
      duration: '45–90 min',
      risk: 'Secondary collapse risk — structural fire',
    },
    fieldUpdates: [
      { id: 1, time: '14:18', title: 'Partial collapse reported — west wall', description: 'Officer FTK-02 requesting additional structural support.' },
      { id: 2, time: '14:12', title: 'Medical standby activated', description: 'Two civilians with smoke inhalation — AMB en route.' },
      { id: 3, time: '14:06', title: 'Initial on-scene assessment', description: 'Multi-storey commercial structure — active fire floor 2.' },
    ],
    units: [
      { id: 'FTK-02', type: 'Fire Truck', status: 'ON SCENE', eta_minutes: null, lat: -1.9405, lng: 30.059 },
      { id: 'FTK-05', type: 'Fire Truck', status: 'EN ROUTE', eta_minutes: 4, lat: -1.952, lng: 30.061 },
      { id: 'AMB-11', type: 'Ambulance', status: 'EN ROUTE', eta_minutes: 6, lat: -1.935, lng: 30.07 },
      { id: 'POL-12', type: 'Police', status: 'ON SCENE', eta_minutes: null, lat: -1.941, lng: 30.058 },
    ],
  },
  'INC-2407': {
    id: 'INC-2407',
    type: 'Armed Robbery in Progress',
    severity: 'high',
    location: 'Nyarugenge · Biryogo · KN 5 St',
    lat: -1.9659,
    lng: 30.0444,
    fieldReportUnit: 'POL-08',
    reassessment: {
      updated: '14:20',
      severity: 'HIGH',
      additionalUnits: '1× POL Van, 1× Motorcycle',
      duration: '20–40 min',
      risk: 'Suspect mobile — possible secondary location',
    },
    fieldUpdates: [
      { id: 1, time: '14:15', title: 'Suspect direction — toward Muhima', description: 'Witness reports two males on motorcycle fled toward Nyarugenge Centre.' },
      { id: 2, time: '14:10', title: 'Scene secured', description: 'Shop owner safe — no injuries confirmed.' },
    ],
    units: [
      { id: 'POL-08', type: 'Police', status: 'ON SCENE', eta_minutes: null, lat: -1.9659, lng: 30.0444 },
      { id: 'P-07', type: 'Police Van', status: 'EN ROUTE', eta_minutes: 3, lat: -1.962, lng: 30.048 },
    ],
  },
}

export const OPS_SHIFT_HANDOVER = {
  outgoing: 'Shift 00:00–08:00 · Outgoing OM: Kagame R.',
  generated: '25 May 2026 · 07:58',
  activeIncidents: [
    { id: 'INC-2401', type: 'Medical Emergency', status: 'Monitoring', units: 'AMB-09' },
    { id: 'INC-2403', type: 'Structure Fire', status: 'Active — escalated', units: 'FTK-02, FTK-05, AMB-11' },
  ],
  unitIssues: [
    'P-03 — mechanical fault, restricted to Nyarugenge depot until 10:00',
    'M-12 — officer minor injury, light duties only',
  ],
  unresolvedEscalations: ['INC-2403 — awaiting OM command handover'],
  pendingAi: ['REC-0038 — approved, execution pending at shift change'],
  notes: 'Heavy medical load in Nyarugenge between 04:00–06:00. Recommend keeping AMB-11 pre-positioned in Nyamirambo for morning peak. Mutual aid from Bugesera arrived on time — no issues.',
  stats: {
    incidents: 198,
    avgResponse: '7.8m',
    coverage: '91%',
    escalations: 3,
  },
}

export const OPS_SHIFT_REPORT_INCIDENTS = [
  { id: 'INC-2398', type: 'Traffic Accident', severity: 'HIGH', duration: '42m', units: 3, outcome: 'Resolved — Nyamirambo' },
  { id: 'INC-2403', type: 'Structure Fire', severity: 'CRITICAL', duration: 'ongoing', units: 5, outcome: 'Active — OM commanding' },
  { id: 'INC-2405', type: 'Public Disturbance', severity: 'MEDIUM', duration: '28m', units: 2, outcome: 'Resolved — Muhima dispersed' },
  { id: 'INC-2407', type: 'Armed Robbery', severity: 'HIGH', duration: '18m', units: 3, outcome: 'Active — Biryogo pursuit' },
]

export const OPS_RESOURCE_EVENTS = [
  { time: '13:20', title: 'Mutual aid approved', description: 'MAR-001 — 2× Police Van from Bugesera · 90 min loan' },
  { time: '11:45', title: 'Reallocation executed', description: 'REC-0035 — P-07 moved to Nyamirambo Standby' },
  { time: '09:30', title: 'Fire Service activated', description: 'Kigali Fire & Rescue — 4 units on INC-2403' },
  { time: '08:05', title: 'Shift handover received', description: 'Incoming briefing from OM Kagame R.' },
]


export const OPS_JEAN_BOSCO_INCIDENTS = [
  { id: 'INC-2410', type: 'Medical Emergency' },
  { id: 'INC-2409', type: 'Traffic Accident' },
  { id: 'INC-2408', type: 'Public Disturbance' },
  { id: 'INC-2406', type: 'Theft Report' },
]

export function getEscalationDetail(id) {
  return OPS_ESCALATION_DETAIL[id] || OPS_ESCALATION_DETAIL['INC-2403']
}

export function getWorkloadVariant(workload) {
  if (workload === 'overload') return 'critical'
  if (workload === 'high') return 'handover'
  return 'resolved'
}

export function getWorkloadLabel(workload) {
  if (workload === 'overload') return 'OVERLOAD'
  if (workload === 'high') return 'HIGH'
  return 'NORMAL'
}
