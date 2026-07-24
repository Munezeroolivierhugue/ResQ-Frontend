/** Field Responder mobile — mock officer + assignment data (Kigali). */

export const FR_OFFICER = {
  // DB-backed (users + agency_assignments)
  user_id: 'u4444444-0000-4000-8000-000000000004',
  vehicle_id: 'v7070707-0000-4000-8000-000000000070',
  current_lat: -1.9532,
  current_lng: 30.0588,
  // UI display fields
  initials: 'JB',
  name: 'Jean Bosco Nkurunziza',
  badge: 'DSP-0042',
  unit: 'P-12 Motorcycle',
  shift: '08:00 – 16:00 · Today',
}

export const FR_BRIEFING = {
  text: 'Increased patrol requested in Kimihurura sector today. Vehicle P-22 has a mechanical issue — do not use. All units report GPS status at shift start.',
  time: '08:00',
  author: 'Kagame R. (Ops Manager)',
}

export const FR_ASSIGNMENT = {
  // DB-backed (incidents)
  incident_id: 'i3333333-0000-4000-8000-000000000003',
  id: 'INC-2403',
  type: 'Armed Robbery',
  severity: 'critical',
  location: 'KG 11 Ring Road, Kimironko',
  landmark: 'Near BK Arena',
  lat: -1.9441,
  lng: 30.0619,
  // DB-backed (gps_pings / dispatches.current_lat|lng)
  current_lat: -1.9532,
  current_lng: 30.0588,
  eta_minutes: 3.2,
  priority: 'HIGH',
  // UI-only — denormalized triage summary; not a DB column
  caller: {
    persons: '2–3 reported',
    weapons: 'YES',
    injuries: 'Unknown',
    description:
      'Caller reports two men with a firearm at the KG 11 Ring Road entrance. Victim is a shop owner.',
  },
  // UI-only — computed by routing API; not a DB column
  distanceKm: 1.1,
  // UI-only — denormalized join over dispatches + units; not a DB column
  otherUnits: [{ id: 'P-19', type: 'Police Van', eta: '5 min' }],
  // UI-only — computed turn-by-turn instruction; not a DB column
  turnInstruction: 'Turn right onto KN 4 Ave in 400m',
  // UI-only
  turnSub: 'Then continue 650m to destination',
}

export const FR_DISPATCH_MESSAGES = [
  {
    id: 'm1',
    from: 'dispatch',
    time: '14:19',
    text: 'FTK-02 confirmed on scene. Maintain perimeter KG 11.',
  },
  {
    id: 'm2',
    from: 'officer',
    time: '14:22',
    text: 'Confirmed. Perimeter set. Suspect possibly inside building.',
  },
  {
    id: 'm3',
    from: 'dispatch',
    time: '14:23',
    text: 'P-19 en route ETA 4 min. Hold position.',
  },
  {
    id: 'm4',
    from: 'officer',
    time: '14:26',
    text: 'Copy. No movement at front entrance.',
  },
]

export const FR_QUICK_REPLIES = [
  'Arrived on scene',
  'Scene secured',
  'Suspect in custody',
  'Medical assistance needed',
  'Scene clear',
  'Awaiting backup',
]

export const FR_FLAG_OPTIONS = [
  'Cannot respond — mechanical issue',
  'Cannot respond — officer safety',
  'Location unclear — needs clarification',
  'Wrong unit type dispatched',
]

export const FR_BACKUP_REASONS = [
  {
    id: 'units',
    label: 'Additional Units Needed',
    sub: 'Capacity — more units required',
    icon: 'users',
  },
  {
    id: 'safety',
    label: 'Responder Safety Threat',
    sub: 'Weapons or physical danger present',
    icon: 'shield',
  },
  {
    id: 'specialist',
    label: 'Specialized Unit Required',
    sub: 'A unit with specific equipment or training is needed',
    icon: 'star',
  },
]

export const FR_PERFORMANCE = {
  incidents: 14,
  avgResponse: '6.8m',
  distance: '94 km',
  reportsFiled: 14,
  performance: 87,
  gpsUptime: '100%',
  districtAvg: '7.4m',
  weeklyTrend: [
    { day: 'Mon', min: 7.2 },
    { day: 'Tue', min: 8.1 },
    { day: 'Wed', min: 6.9 },
    { day: 'Thu', min: 7.4 },
    { day: 'Fri', min: 6.8 },
    { day: 'Sat', min: 7.1 },
    { day: 'Sun', min: 6.8 },
  ],
  aiDispatches: 11,
  manualOverride: 3,
}

export const FR_SHIFT_HISTORY = [
  {
    id: 'INC-2403',
    type: 'Armed Robbery',
    severity: 'CRITICAL',
    time: '14:18',
    location: 'KG 11 Ring Road, Kimironko',
    response: '6.2m',
  },
  {
    id: 'INC-2398',
    type: 'Traffic Accident',
    severity: 'HIGH',
    time: '11:42',
    location: 'KN 3 Road, Remera',
    response: '5.8m',
  },
  {
    id: 'INC-2391',
    type: 'Domestic',
    severity: 'MEDIUM',
    time: '09:15',
    location: 'Kimisagara Sector',
    response: '8.4m',
  },
  {
    id: 'INC-2387',
    type: 'Theft',
    severity: 'LOW',
    time: '08:52',
    location: 'Nyamirambo Market',
    response: '7.1m',
  },
]

export const FR_OUTSTANDING_REPORTS = []

export const FR_INCIDENT_TYPES = [
  'Armed Robbery',
  'Traffic Accident',
  'Medical Emergency',
  'Domestic',
  'Fire',
  'Theft',
  'Other',
]

export const FR_SCENE_STATUSES = [
  'Scene Clear',
  'Scene Active',
  'Requires Specialist',
  'Requires Medical',
]

export const FR_AGENCY_OPTIONS = [
  'Rwanda Investigation Bureau (RIB)',
  'Criminal Records Office',
  'Traffic Police Command',
  'Medical Services',
]

export function severityBannerBg(severity) {
  const map = {
    critical: 'var(--status-critical)',
    high: 'var(--status-high)',
    medium: 'var(--status-medium)',
    low: 'var(--status-low)',
  }
  return map[severity] || map.high
}

export function etaColor(minutes) {
  if (minutes < 5) return 'var(--status-low)'
  if (minutes <= 10) return 'var(--status-medium)'
  return 'var(--status-critical)'
}
