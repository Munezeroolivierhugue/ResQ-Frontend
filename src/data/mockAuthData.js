export const ORGANIZATIONS = [
  'Rwanda National Police (RNP)',
  'Rwanda Investigation Bureau (RIB)',
  'Ministry of Emergency Management',
  'City of Kigali — Emergency Ops',
]

export const ASSIGNED_ROLES = [
  { value: 'dispatcher', label: 'Dispatcher', portal: '/dispatcher' },
  { value: 'district_commander', label: 'District Commander', portal: '/district-commander/dashboard' },
  { value: 'ops_manager', label: 'Operations Manager', portal: '/ops-manager/dashboard' },
  { value: 'emergency_planner', label: 'Emergency Planner', portal: '/dispatcher' },
  { value: 'field_responder', label: 'Field Responder', portal: '/dispatcher' },
  { value: 'analyst', label: 'Analyst', portal: '/dispatcher' },
  { value: 'admin', label: 'Super Admin', portal: '/admin' },
]

export const JURISDICTIONS = [
  'HQ Central Command — Kigali',
  'Gasabo District Operations',
  'Nyarugenge Sector Command',
  'Eastern Province Coordination',
]

/** MFA setup step — Google Auth + trusted device only. */
export const MFA_SETUP_OPTIONS = [
  {
    id: 'google_auth',
    title: 'Google Authenticator',
    description:
      'Time-based one-time passwords (TOTP) via Google Authenticator. Scan the provisioned QR code and enter a 6-digit code at each login.',
    recommended: true,
  },
  {
    id: 'trusted_device',
    title: 'Trusted device checking',
    description:
      'Registers this terminal after successful verification. Recognized devices may skip repeated MFA on future logins from the same workstation.',
    recommended: false,
  },
]

/** Mock users "created" by admin (session demo). */
export const mockInvitedUsers = [
  {
    id: 'USR-001',
    fullName: 'Marie Claire Uwimana',
    email: 'm.uwimana@rnp.gov.rw',
    phone: '+250788456789',
    role: 'dispatcher',
    status: 'pending',
    invitedAt: '2026-05-18',
  },
  {
    id: 'USR-002',
    fullName: 'Patrick Nshimiyimana',
    email: 'p.nshimiyimana@rnp.gov.rw',
    phone: '+250788112233',
    role: 'ops_manager',
    status: 'active',
    invitedAt: '2026-05-12',
  },
  {
    id: 'USR-003',
    fullName: 'Grace Ingabire',
    email: 'g.ingabire@rnp.gov.rw',
    phone: '+250788998877',
    role: 'analyst',
    status: 'pending',
    invitedAt: '2026-05-17',
  },
  {
    id: 'USR-004',
    fullName: 'Eric Habimana',
    email: 'e.habimana@rnp.gov.rw',
    phone: '+250788334455',
    role: 'field_responder',
    status: 'active',
    invitedAt: '2026-05-10',
  },
  {
    id: 'USR-005',
    fullName: 'Chantal Mukamana',
    email: 'c.mukamana@rnp.gov.rw',
    phone: '+250788667788',
    role: 'emergency_planner',
    status: 'pending',
    invitedAt: '2026-05-19',
  },
]
