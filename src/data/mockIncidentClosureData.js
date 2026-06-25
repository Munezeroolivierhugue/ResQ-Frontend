import { mockIncidentClosures } from './mockIncidentClosures'
import { mockVehicles } from './mockVehicles'

const baseClosure = mockIncidentClosures[0];

const getExtendedUnit = (id, overrides) => {
  const v = mockVehicles.find(u => u.id === id);
  return {
    ...v,
    ...overrides
  };
};

export const mockIncidentClosure = {
  ...baseClosure,
  dispositionOptions: [
    { value: 'arrests', label: 'Arrest(s) made' },
    { value: 'medical', label: 'Medical transport only' },
    { value: 'cleared', label: 'Scene cleared — no arrest' },
    { value: 'referred', label: 'Referred to investigation unit' },
  ],
  recoveryOptions: [
    { value: 'full', label: 'Fully recovered' },
    { value: 'partial', label: 'Partially recovered' },
    { value: 'none', label: 'Not recovered' },
    { value: 'na', label: 'Not applicable' },
  ],
  defaultDisposition: 'arrests',
  defaultRecovery: 'full',
  units: [
    getExtendedUnit('T-14', { role: 'Tactical', status: 'Ready to release', statusTone: 'ready', cleared: true }),
    getExtendedUnit('T-22', { role: 'Intercept', status: 'Ready to release', statusTone: 'ready', cleared: true }),
    getExtendedUnit('M-09', { role: 'Medical', status: 'Wrapping logs', statusTone: 'pending', cleared: false }),
    getExtendedUnit('FTK-02', { role: 'Fire suppression', status: 'Ready to release', statusTone: 'ready', cleared: true }),
  ],
  timelineElapsed: '42m 14s',
  timeline: [
    {
      id: 1,
      time: '08:14:02',
      title: 'Incident created',
      description: '911 dispatch received — structure fire reported, Nyamirambo sector.',
      active: true,
    },
    {
      id: 2,
      time: '08:16:45',
      title: 'Units en route',
      description: 'Tactical and fire units dispatched via AI recommendation engine.',
    },
    {
      id: 3,
      time: '08:21:10',
      title: 'Arrival & cordon',
      description: 'T-14 on scene; hot zone and safety perimeter established.',
    },
    {
      id: 4,
      time: '08:52:11',
      title: 'Scene secured',
      description: 'Suspects in custody; medical standby cleared without transport.',
    },
  ],
  media: [
    { id: 'cam-01', label: 'CAM-01: Arrival', caption: 'Tactical arrival — cordon established' },
    { id: 'cam-04', label: 'CAM-04: Arrest', caption: 'Suspect custody — bodycam frame' },
  ],
}
