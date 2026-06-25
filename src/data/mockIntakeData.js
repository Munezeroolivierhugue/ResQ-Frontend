/** Mock data for smart dispatch intake UI (visual simulation only). */

import { mockCallers } from './mockCallers'
import { mockIncidents } from './mockIncidents'

// Retrieve active caller from callers database
const activeCallerRecord = mockCallers.find(c => c.caller_id === "c1111111-0000-4000-8000-000000000001");

export const mockActiveCall = {
  callerNumber: activeCallerRecord ? activeCallerRecord.phone_number : '+250788123456',
  callerIdentity: activeCallerRecord ? activeCallerRecord.identity : 'Unknown',
  duration: '02:14',
  status: 'ACTIVE',
  district: 'Gasabo',
  riskLevel: 'Medium',
  sessionId: 'RSE-8821-MP',
}

export const mockAutoCaller = {
  phone_number: activeCallerRecord ? activeCallerRecord.phone_number : '+250788123456',
  identity: activeCallerRecord ? activeCallerRecord.identity : 'Unknown / Anonymous',
  previous_incidents: activeCallerRecord ? activeCallerRecord.previous_incidents : 2,
  trust_level: activeCallerRecord ? activeCallerRecord.trust_level : 'Normal',
  gpsStatus: 'GPS Pending',
  
  // Legacy aliases
  phone: activeCallerRecord ? activeCallerRecord.phone_number : '+250788123456',
  name: activeCallerRecord ? activeCallerRecord.identity : 'Unknown / Anonymous',
  previousIncidents: activeCallerRecord ? activeCallerRecord.previous_incidents : 2,
  trustLevel: activeCallerRecord ? activeCallerRecord.trust_level : 'Normal',
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

// Map incidents to intake dispatch queue structure
export const mockDispatchQueue = mockIncidents.slice(0, 4).map((inc, idx) => ({
  id: inc.incident_ref,
  time: inc.reported,
  title: `${inc.incident_type} Incident`,
  summary: `Active report in ${inc.sector}, ${inc.district}. Coordinates: ${inc.lat}, ${inc.lng}.`,
  severity: inc.severity,
  active: idx === 0,
  resolved: inc.status === 'resolved'
}));

export const INCIDENT_CATEGORIES = [
  'Security / Disturbance',
  'Medical',
  'Traffic / MVA',
  'Fire',
  'Disaster',
  'Other',
]
