// TODO: backend gap — GET /api/agencies and /api/stations exist but admin UI not yet built.
// When Super Admin portal is implemented, replace with src/api/agencies.js.
export const mockAgencies = [
  { agency_id: 'agency-0001-rnp0-0000-000000000001', name: 'Rwanda National Police',     type: 'POLICE',        is_default: true  },
  { agency_id: 'agency-0002-fire-0000-000000000002', name: 'Fire and Rescue',             type: 'FIRE',          is_default: false },
  { agency_id: 'agency-0003-med0-0000-000000000003', name: 'Medical Services',            type: 'MEDICAL',       is_default: false },
  { agency_id: 'agency-0004-rib0-0000-000000000004', name: 'Rwanda Investigation Bureau', type: 'INVESTIGATION', is_default: false },
]
