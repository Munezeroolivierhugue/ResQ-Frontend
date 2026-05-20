/**
 * Active incident detail — visual mock for INC-2403 (Fire, Nyamirambo).
 * Coordinates align with mockData.js entries.
 */

import { mockIncidents } from './mockData'

const base = mockIncidents.find((i) => i.id === 'INC-2403')

export const activeIncident = {
  ...base,
  title: 'Structure Fire & Medical Standby — Nyamirambo',
  address: `${base.sector}, ${base.district}, Kigali`,
  elapsedDisplay: '00:25:00',
  level: 4,
  hotZoneRadiusM: 280,
  safetyLineRadiusM: 450,
}

/** Units assigned / responding — lat/lng near incident for map accuracy */
export const activeIncidentUnits = [
  {
    id: 'FTK-02',
    type: 'Fire Truck',
    role: 'Fire suppression',
    status: 'arrived',
    statusLabel: 'ARRIVED',
    timestamp: '14:18:02',
    eta: null,
    assignment: 'INC-2403',
    lat: -1.9662,
    lng: 30.0448,
    accuracy: '±8m',
    colorKey: 'fire',
  },
  {
    id: 'FTK-05',
    type: 'Fire Truck',
    role: 'Backup suppression',
    status: 'enroute',
    statusLabel: 'EN ROUTE',
    timestamp: null,
    eta: '3m',
    assignment: 'INC-2403',
    lat: -1.9645,
    lng: 30.0462,
    accuracy: '±15m',
    colorKey: 'fire',
  },
  {
    id: 'AMB-07',
    type: 'Ambulance',
    role: 'Medical standby',
    status: 'enroute',
    statusLabel: 'EN ROUTE',
    timestamp: null,
    eta: '5m',
    assignment: 'INC-2403',
    lat: -1.9688,
    lng: 30.0415,
    accuracy: '±12m',
    colorKey: 'medical',
  },
  {
    id: 'POL-12',
    type: 'Police',
    role: 'Crowd control / perimeter',
    status: 'arrived',
    statusLabel: 'ARRIVED',
    timestamp: '14:22:15',
    eta: null,
    assignment: 'INC-2403',
    lat: -1.9651,
    lng: 30.0432,
    accuracy: '±10m',
    colorKey: 'police',
  },
]

export const UNIT_COLORS = {
  fire: 'var(--status-critical)',
  medical: 'var(--status-info)',
  police: 'var(--status-medium)',
  dispatch: 'var(--accent)',
}

export const mockFieldComms = [
  { id: 1, from: 'FTK-02', role: 'field', unitType: 'fire', time: '14:18', text: 'Dispatch, FTK-02 on scene. Confirming hydrant access on Street 12.' },
  { id: 2, from: 'DISPATCH', role: 'dispatch', time: '14:19', text: 'Confirmed. Hydrant team notified. Maintain hot zone.', isSelf: true },
  { id: 3, from: 'POL-12', role: 'field', unitType: 'police', time: '14:22', text: 'Crowd moving back. Need one more officer at south checkpoint.' },
  { id: 4, from: 'DISPATCH', role: 'dispatch', time: '14:23', text: 'Copy. Backup unit coordinating. Hold south line.', isSelf: true },
  { id: 5, from: 'FTK-02', role: 'field', unitType: 'fire', time: '14:24', text: 'Visibility poor — smoke layer low. Advise AMB to stage upwind.' },
]
