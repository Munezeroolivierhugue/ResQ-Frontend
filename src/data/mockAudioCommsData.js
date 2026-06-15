/** Mock data for voice channel audio log (visual simulation only). */
// Each clip: { id, from, unitId, unitType, time, durationS, label, isNew }
// from: 'dispatch' | 'field'  ·  unitType: 'fire' | 'medical' | 'police'

export const mockAudioClips = [
  {
    id: 'ac-1',
    from: 'field',
    unitId: 'FTK-02',
    unitType: 'fire',
    time: '14:18',
    durationS: 14,
    label: 'On scene confirm — hydrant access Street 12',
    isNew: false,
  },
  {
    id: 'ac-2',
    from: 'dispatch',
    unitId: null,
    unitType: null,
    time: '14:19',
    durationS: 9,
    label: 'Confirmed. Hydrant team notified — maintain hot zone',
    isNew: false,
  },
  {
    id: 'ac-3',
    from: 'field',
    unitId: 'POL-12',
    unitType: 'police',
    time: '14:22',
    durationS: 18,
    label: 'Crowd pushed back — requesting extra officer south checkpoint',
    isNew: false,
  },
  {
    id: 'ac-4',
    from: 'dispatch',
    unitId: null,
    unitType: null,
    time: '14:23',
    durationS: 7,
    label: 'Copy — backup unit coordinating, hold south line',
    isNew: false,
  },
  {
    id: 'ac-5',
    from: 'field',
    unitId: 'FTK-02',
    unitType: 'fire',
    time: '14:24',
    durationS: 22,
    label: 'Visibility poor — smoke layer low, advise AMB stage upwind',
    isNew: true,
  },
]

/** Format seconds → M:SS display string (e.g. 75 → "1:15") */
export function fmtDuration(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}
