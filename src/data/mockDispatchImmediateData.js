import { mockIncidents, mockUnits } from './mockData'

export const DEFAULT_IMMEDIATE_INCIDENT_ID = 'INC-2409'

export const mockImmediateAssessment = {
  recommendedUnitId: 'P-07',
  recommendedLabel: 'P-07 — Police Van',
  distance: '1.2 km',
  eta: '~3 min',
  route: 'KN 4 Ave via Kacyiru',
  crew: '2 officers (full capacity)',
  confidence: 'HIGH CONFIDENCE',
}

export const mockNearestUnits = [
  { id: 'P-07', type: 'Police Van', distance: '1.2 km', eta: '~3 min', status: 'AVAILABLE' },
  { id: 'POL-12', type: 'Police', distance: '2.4 km', eta: '~5 min', status: 'AVAILABLE' },
  { id: 'AMB-11', type: 'Ambulance', distance: '3.1 km', eta: '~7 min', status: 'STANDBY' },
]

export function getImmediateIncident(incidentId) {
  const base = mockIncidents.find((i) => i.id === incidentId)
    || mockIncidents.find((i) => i.id === DEFAULT_IMMEDIATE_INCIDENT_ID)
  if (!base) return null
  return {
    ...base,
    type: base.type === 'Traffic' ? 'Armed Robbery' : base.type,
    severity: 'critical',
    location: `${base.sector}, ${base.district}`,
    reportedBy: 'Citizen · +250 788 442 901',
    description:
      'Life-threatening incident reported. Suspect armed. Immediate police response required.',
  }
}

export function getCriticalUnassignedIncident() {
  return mockIncidents.find(
    (i) => i.severity === 'critical' && !i.unit && i.status !== 'resolved',
  ) || mockIncidents.find((i) => i.id === DEFAULT_IMMEDIATE_INCIDENT_ID)
}

export function getAvailableUnitsForMap() {
  return mockUnits.filter((u) => u.status === 'available' || u.status === 'idle')
}

/** Simulated live call transcript for keyword-based type detection. */
export const mockDispatchCallTranscript =
  'Caller is shouting — there is a man with a gun near the shop on KN 4 Ave. Sounds like a robbery in progress. Please send police immediately.'

export const IMMEDIATE_INCIDENT_TYPES = [
  {
    id: 'armed-robbery',
    label: 'Armed Robbery',
    icon: 'shield',
    keywords: ['gun', 'robbery', 'armed', 'weapon', 'hostage'],
    description: 'Armed robbery reported. Suspect may be armed. Immediate police response required.',
  },
  {
    id: 'active-shooting',
    label: 'Active Shooting',
    icon: 'warning',
    keywords: ['shooting', 'shooter', 'shots fired', 'gunfire'],
    description: 'Active shooting in progress. Immediate tactical response required.',
  },
  {
    id: 'structure-fire',
    label: 'Structure Fire',
    icon: 'fire',
    keywords: ['fire', 'smoke', 'burning', 'flames'],
    description: 'Structure fire reported. Fire and rescue units required.',
  },
  {
    id: 'medical-emergency',
    label: 'Medical Emergency',
    icon: 'medical',
    keywords: ['medical', 'cardiac', 'unconscious', 'not breathing', 'ambulance'],
    description: 'Medical emergency. Ambulance dispatch priority.',
  },
  {
    id: 'traffic-accident',
    label: 'Traffic Accident',
    icon: 'car',
    keywords: ['accident', 'collision', 'crash', 'vehicle', 'mva'],
    description: 'Serious traffic collision. Police and medical support required.',
  },
  {
    id: 'public-disturbance',
    label: 'Public Disturbance',
    icon: 'people',
    keywords: ['disturbance', 'riot', 'crowd', 'fight', 'mob'],
    description: 'Large public disturbance. Multiple units may be required.',
  },
  {
    id: 'assault',
    label: 'Assault in Progress',
    icon: 'person',
    keywords: ['assault', 'stabbing', 'attack', 'knife', 'beaten'],
    description: 'Assault in progress. Immediate intervention required.',
  },
  {
    id: 'other-critical',
    label: 'Other Critical',
    icon: 'alert',
    keywords: [],
    description: 'Critical incident — type confirmed manually by dispatcher.',
  },
]

export function detectIncidentTypeFromTranscript(transcript) {
  const text = transcript.toLowerCase()
  for (const type of IMMEDIATE_INCIDENT_TYPES) {
    if (type.keywords.some((kw) => text.includes(kw))) {
      return type.id
    }
  }
  return null
}

export function getImmediateTypeById(typeId) {
  return IMMEDIATE_INCIDENT_TYPES.find((t) => t.id === typeId) || IMMEDIATE_INCIDENT_TYPES[0]
}
