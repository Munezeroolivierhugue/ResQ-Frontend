export const mockIncidents = [
  { id: 'INC-2401', type: 'Medical', severity: 'critical', district: 'Gasabo', sector: 'Remera', reported: '14:32', elapsed: '8m', unit: 'AMB-07', status: 'active', lat: -1.9355, lng: 30.1044 },
  { id: 'INC-2402', type: 'Traffic', severity: 'high', district: 'Kicukiro', sector: 'Niboye', reported: '14:28', elapsed: '12m', unit: null, status: 'pending', lat: -1.9706, lng: 30.0776 },
  { id: 'INC-2403', type: 'Fire', severity: 'critical', district: 'Nyarugenge', sector: 'Nyamirambo', reported: '14:15', elapsed: '25m', unit: 'FTK-02', status: 'active', lat: -1.9659, lng: 30.0444 },
  { id: 'INC-2404', type: 'Security', severity: 'medium', district: 'Musanze', sector: 'Muhoza', reported: '14:40', elapsed: '2m', unit: null, status: 'pending', lat: -1.4994, lng: 29.6340 },
  { id: 'INC-2405', type: 'Medical', severity: 'high', district: 'Huye', sector: 'Ngoma', reported: '13:55', elapsed: '47m', unit: 'AMB-03', status: 'active', lat: -2.5967, lng: 29.7394 },
  { id: 'INC-2406', type: 'Disaster', severity: 'high', district: 'Rubavu', sector: 'Gisenyi', reported: '13:20', elapsed: '82m', unit: 'DST-01', status: 'active', lat: -1.6977, lng: 29.2567 },
  { id: 'INC-2407', type: 'Traffic', severity: 'low', district: 'Rwamagana', sector: 'Kigabiro', reported: '14:45', elapsed: '1m', unit: null, status: 'pending', lat: -1.9494, lng: 30.4344 },
  { id: 'INC-2408', type: 'Medical', severity: 'medium', district: 'Nyagatare', sector: 'Karama', reported: '14:10', elapsed: '32m', unit: 'AMB-11', status: 'resolved', lat: -1.2994, lng: 30.3244 },
]

export const mockUnits = [
  { id: 'AMB-07', type: 'Ambulance', status: 'deployed', location: 'Remera', assignment: 'INC-2401', lat: -1.9355, lng: 30.1044 },
  { id: 'AMB-03', type: 'Ambulance', status: 'deployed', location: 'Ngoma', assignment: 'INC-2405', lat: -2.5967, lng: 29.7394 },
  { id: 'AMB-11', type: 'Ambulance', status: 'available', location: 'Nyagatare', assignment: null, lat: -1.2994, lng: 30.3244 },
  { id: 'FTK-02', type: 'Fire Truck', status: 'deployed', location: 'Nyamirambo', assignment: 'INC-2403', lat: -1.9659, lng: 30.0444 },
  { id: 'FTK-05', type: 'Fire Truck', status: 'available', location: 'Kacyiru', assignment: null, lat: -1.9355, lng: 30.0944 },
  { id: 'POL-12', type: 'Police', status: 'available', location: 'Muhoza', assignment: null, lat: -1.4994, lng: 29.6340 },
  { id: 'POL-08', type: 'Police', status: 'idle', location: 'Gisenyi', assignment: null, lat: -1.6977, lng: 29.2567 },
  { id: 'DST-01', type: 'Disaster', status: 'deployed', location: 'Gisenyi', assignment: 'INC-2406', lat: -1.6977, lng: 29.2567 },
  { id: 'AMB-15', type: 'Ambulance', status: 'offline', location: 'Huye', assignment: null, lat: -2.5967, lng: 29.7394 },
]

export const mockShiftOfficers = [
  { id: 'OFF-01', name: 'Jean Bosco Nkurunziza', role: 'Dispatcher', status: 'active', incidents: 4, onBreak: false },
  { id: 'OFF-02', name: 'Marie Claire Uwimana', role: 'Dispatcher', status: 'active', incidents: 2, onBreak: true },
  { id: 'OFF-03', name: 'Patrick Habimana', role: 'Supervisor', status: 'active', incidents: 0, onBreak: false },
  { id: 'OFF-04', name: 'Diane Mukamana', role: 'Dispatcher', status: 'active', incidents: 6, onBreak: false },
  { id: 'OFF-05', name: 'Eric Nshimiyimana', role: 'Dispatcher', status: 'offline', incidents: 0, onBreak: false },
]

/** Recent calls shown on New Incident intake sidebar (demo). */
export const mockRecentCalls = [
  {
    id: 'RSE-1102',
    time: '14:02:11',
    title: 'Cardiac Arrest',
    summary: 'Elderly male, unconscious — Nyamirambo. Bystander CPR in progress.',
    active: true,
  },
  {
    id: 'RSE-1098',
    time: '13:47:33',
    title: 'MVA — Multi Vehicle',
    summary: 'Three vehicles, possible injuries — KG 11 Ring Road. Smoke reported.',
    active: false,
  },
  {
    id: 'RSE-1095',
    time: '13:22:01',
    title: 'Water Main Burst',
    summary: 'Flooding on main street; schools notified. Public works en route.',
    active: false,
  },
  {
    id: 'RSE-1088',
    time: '12:15:44',
    title: 'Cat in Tree (Resolved)',
    summary: 'Low priority; owner on scene. Unit cleared without deployment.',
    active: false,
    resolved: true,
  },
]

export const mockHistoryIncidents = [
  { id: 'INC-2380', type: 'Medical', severity: 'critical', district: 'Gasabo', sector: 'Kimironko', reported: '2025-01-14 08:12', resolutionTime: '18m', responseTime: '6m', target: '8m', units: ['AMB-07'], status: 'resolved' },
  { id: 'INC-2381', type: 'Fire', severity: 'high', district: 'Nyarugenge', sector: 'Muhima', reported: '2025-01-14 09:45', resolutionTime: '42m', responseTime: '11m', target: '10m', units: ['FTK-02', 'FTK-05'], status: 'resolved' },
  { id: 'INC-2382', type: 'Traffic', severity: 'medium', district: 'Kicukiro', sector: 'Gatenga', reported: '2025-01-14 10:30', resolutionTime: '25m', responseTime: '7m', target: '10m', units: ['POL-12'], status: 'resolved' },
  { id: 'INC-2383', type: 'Security', severity: 'high', district: 'Musanze', sector: 'Cyuve', reported: '2025-01-14 11:15', resolutionTime: '35m', responseTime: '14m', target: '12m', units: ['POL-08'], status: 'resolved' },
  { id: 'INC-2384', type: 'Medical', severity: 'low', district: 'Huye', sector: 'Tumba', reported: '2025-01-14 12:00', resolutionTime: '20m', responseTime: '9m', target: '10m', units: ['AMB-03'], status: 'resolved' },
]
