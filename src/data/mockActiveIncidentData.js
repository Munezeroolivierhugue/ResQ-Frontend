/**
 * Active incident detail — visual mock for INC-2403 (Fire, Nyamirambo).
 * Coordinates align with mockIncidents.js entries.
 */

import { mockIncidents } from './mockIncidents'
import { mockVehicles } from './mockVehicles'

const base = mockIncidents.find((i) => i.incident_ref === 'INC-2403' || i.id === 'INC-2403')

export const activeIncident = {
  ...base,
  title: 'Structure Fire & Medical Standby — Nyamirambo',
  address: `${base.sector}, ${base.district}, Kigali`,
  elapsedDisplay: '00:25:00',
  level: 4,
  hotZoneRadiusM: 280,
  safetyLineRadiusM: 450,
}

// Helper to look up vehicle from mockVehicles and extend it
const getExtendedUnit = (id, overrides) => {
  const v = mockVehicles.find(u => u.id === id);
  return {
    ...v,
    ...overrides
  };
};

/** Units assigned / responding — lat/lng near incident for map accuracy */
export const activeIncidentUnits = [
  getExtendedUnit('FTK-02', {
    role: 'Fire suppression',
    statusLabel: 'ARRIVED',
    timestamp: '14:18:02',
    eta: null,
    assignment: 'INC-2403',
    accuracy: '±8m',
    colorKey: 'fire',
    current_lat: -1.9662,
    current_lng: 30.0448,
    lat: -1.9662,
    lng: 30.0448,
  }),
  getExtendedUnit('FTK-05', {
    role: 'Backup suppression',
    statusLabel: 'EN ROUTE',
    timestamp: null,
    eta: '3m',
    assignment: 'INC-2403',
    accuracy: '±15m',
    colorKey: 'fire',
    current_lat: -1.9645,
    current_lng: 30.0462,
    lat: -1.9645,
    lng: 30.0462,
  }),
  getExtendedUnit('AMB-07', {
    role: 'Medical standby',
    statusLabel: 'EN ROUTE',
    timestamp: null,
    eta: '5m',
    assignment: 'INC-2403',
    accuracy: '±12m',
    colorKey: 'medical',
    current_lat: -1.9688,
    current_lng: 30.0415,
    lat: -1.9688,
    lng: 30.0415,
  }),
  getExtendedUnit('POL-12', {
    role: 'Crowd control / perimeter',
    statusLabel: 'ARRIVED',
    timestamp: '14:22:15',
    eta: null,
    assignment: 'INC-2403',
    accuracy: '±10m',
    colorKey: 'police',
    current_lat: -1.9651,
    current_lng: 30.0432,
    lat: -1.9651,
    lng: 30.0432,
  }),
];

export const UNIT_COLORS = {
  fire: 'var(--status-critical)',
  medical: 'var(--status-info)',
  police: 'var(--status-medium)',
  dispatch: 'var(--accent)',
};

export const mockFieldComms = [
  { id: 1, from: 'FTK-02', role: 'field', unitType: 'fire', time: '14:18', text: 'Dispatch, FTK-02 on scene. Confirming hydrant access on Street 12.' },
  { id: 2, from: 'DISPATCH', role: 'dispatch', time: '14:19', text: 'Confirmed. Hydrant team notified. Maintain hot zone.', isSelf: true },
  { id: 3, from: 'POL-12', role: 'field', unitType: 'police', time: '14:22', text: 'Crowd moving back. Need one more officer at south checkpoint.' },
  { id: 4, from: 'DISPATCH', role: 'dispatch', time: '14:23', text: 'Copy. Backup unit coordinating. Hold south line.', isSelf: true },
  { id: 5, from: 'FTK-02', role: 'field', unitType: 'fire', time: '14:24', text: 'Visibility poor — smoke layer low. Advise AMB to stage upwind.' },
];
