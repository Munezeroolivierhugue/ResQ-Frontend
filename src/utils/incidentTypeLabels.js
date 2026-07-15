// Backend/AI engine key off short codes (MEDICAL/RTA/FIRE/SECURITY/DISASTER/OTHER,
// see NewIncident.jsx's CATEGORY_TO_TRIAGE_TYPE) — this maps them back to a
// readable label for display to dispatchers and field responders.
export const INCIDENT_TYPE_LABELS = {
  MEDICAL: 'Medical',
  RTA: 'Road Traffic Accident',
  FIRE: 'Fire',
  SECURITY: 'Security / Disturbance',
  DISASTER: 'Disaster',
  OTHER: 'Other',
}

export function formatIncidentType(code) {
  if (!code) return code
  return INCIDENT_TYPE_LABELS[normalizeIncidentType(code)] ?? code
}

// Older/manually-entered incidents stored the human-readable label directly
// ("Fire", "Medical", "Security / Disturbance") instead of the canonical
// code, and "TRAFFIC" was used as a synonym for RTA before that code
// existed — so the same real-world type shows up under multiple raw
// incident_type values in the database. Any screen that lists distinct
// types (e.g. Incident History's filter dropdown) needs to collapse these
// down to one canonical code per type, or it shows visually-duplicate
// options that silently filter differently depending on which literal
// string a given incident happens to have stored.
const LEGACY_TYPE_ALIASES = {
  FIRE: 'FIRE',
  MEDICAL: 'MEDICAL',
  SECURITY: 'SECURITY',
  RTA: 'RTA',
  DISASTER: 'DISASTER',
  OTHER: 'OTHER',
  TRAFFIC: 'RTA',
  'Fire': 'FIRE',
  'Medical': 'MEDICAL',
  'Security / Disturbance': 'SECURITY',
  'Road Traffic Accident': 'RTA',
  'Disaster': 'DISASTER',
  'Other': 'OTHER',
}

export function normalizeIncidentType(code) {
  if (!code) return code
  return LEGACY_TYPE_ALIASES[code] ?? code.toUpperCase()
}
