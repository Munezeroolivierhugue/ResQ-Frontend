/** Mock data for inbound call handling (dispatcher only). */

export const mockCallerProfiles = [
  {
    phone_number: '+250788100001',
    identity: 'Jean-Paul Nkurunziza',
    previous_incidents: 3,
    trust_level: 'Verified',
  },
  {
    phone_number: '+250722200002',
    identity: 'Claudine Mukamana',
    previous_incidents: 1,
    trust_level: 'Normal',
  },
  {
    phone_number: '+250733300003',
    identity: 'Unknown / Anonymous',
    previous_incidents: 0,
    trust_level: 'New',
  },
]

/** In-memory call records — recording_url filled in when call_ended arrives. */
export const mockCallRecords = [
  {
    call_id: 'CALL-00001',
    phone_number: '+250788100001',
    started_at: new Date(Date.now() - 180000).toISOString(),
    recording_url: 'https://storage.example.com/recordings/CALL-00001.mp3',
    ended_at: new Date(Date.now() - 60000).toISOString(),
  },
]

/** Rwandan phone prefixes for simulator */
const RW_PREFIXES = ['0788', '0722', '0733', '0781', '0790', '0792', '0793']

export function randomRwandanPhone() {
  const prefix = RW_PREFIXES[Math.floor(Math.random() * RW_PREFIXES.length)]
  const suffix = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  // Return in international format
  return '+2507' + prefix.slice(1) + suffix.slice(0, 6)
}
