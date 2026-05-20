/** Mock data for smart dispatch intake UI (visual simulation only). */

export const mockActiveCall = {
  callerNumber: '+250788123456',
  callerIdentity: 'Unknown',
  duration: '02:14',
  status: 'ACTIVE',
  district: 'Gasabo',
  riskLevel: 'Medium',
  sessionId: 'RSE-8821-MP',
}

export const mockAutoCaller = {
  phone: '+250788123456',
  name: 'Unknown / Anonymous',
  previousIncidents: 2,
  trustLevel: 'Normal',
  gpsStatus: 'GPS Pending',
}

export const mockLocationSharing = {
  state: 'connected', // 'waiting' | 'connected'
  statusLabel: 'Live location active',
  sublabel: 'Caller device GPS stream',
  accuracy: '±12m',
  source: 'GPS / Caller Device',
  lastUpdate: '2 sec ago',
  lat: -1.9441,
  lng: 30.0619,
  sector: 'Kimironko',
}

export const mockIncidentTimeline = [
  { id: 'call', label: 'Incoming Call', status: 'done', icon: 'phone' },
  { id: 'accepted', label: 'Dispatcher Accepted', status: 'done', icon: 'check' },
  { id: 'sms', label: 'SMS Location Sent', status: 'done', icon: 'message' },
  { id: 'gps', label: 'Caller Shared GPS', status: 'done', icon: 'map' },
  { id: 'unit', label: 'Unit Recommendation Ready', status: 'current', icon: 'bot' },
  { id: 'dispatch', label: 'Officers Dispatched', status: 'pending', icon: 'truck' },
]

export const mockAiRecommendation = {
  threat: 'MEDIUM',
  context: 'Possible armed confrontation',
  resources: ['2 Police Officers', '1 Patrol Vehicle'],
  responseTime: '4 minutes',
  reasoning:
    'Caller transcript suggests possible weapon-related disturbance in an urban district.',
  confidence: 89,
}

export const mockLandmarkAssist = {
  landmarks: ['BK Arena', 'Kimironko Market', 'Kigali Heights'],
  suggestedArea: 'Kimironko Sector',
  confidence: 92,
}

export const mockLiveNotesPlaceholder =
  'Caller reports suspicious activity near Kimironko market. Possible altercation in progress.'

export const mockDispatchQueue = [
  {
    id: 'RSE-1102',
    time: '14:02:11',
    title: 'Cardiac Arrest',
    summary: 'Elderly male, unconscious — Nyamirambo. Bystander CPR in progress.',
    severity: 'critical',
    active: true,
  },
  {
    id: 'RSE-1098',
    time: '13:47:33',
    title: 'MVA — Multi Vehicle',
    summary: 'Three vehicles, possible injuries — KG 11 Ring Road.',
    severity: 'high',
    active: false,
  },
  {
    id: 'RSE-1095',
    time: '13:22:01',
    title: 'Water Main Burst',
    summary: 'Flooding on main street; schools notified.',
    severity: 'medium',
    active: false,
  },
  {
    id: 'RSE-1088',
    time: '12:15:44',
    title: 'Cat in Tree',
    summary: 'Low priority; owner on scene. Unit cleared.',
    severity: 'resolved',
    active: false,
    resolved: true,
  },
]

export const INCIDENT_CATEGORIES = [
  'Security / Disturbance',
  'Medical',
  'Traffic / MVA',
  'Fire',
  'Disaster',
  'Other',
]
