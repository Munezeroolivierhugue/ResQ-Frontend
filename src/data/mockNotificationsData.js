// PARTIAL INTEGRATION: listNotifications(), markRead(), markAllRead() wired to backend.
// Used as initial/fallback state before first API fetch.
// TODO: backend gap — notification href (deep link) and details fields not in backend schema.
export const mockNotifications = [
  {
    id: 'n_ma1',
    type: 'mutual_aid',
    title: 'MUTUAL AID: District Gasabo (10km)',
    desc: 'Priority request for 2x Ambulance, 1x Fire Engine',
    time: '1m ago',
    read: false,
    href: '#mutual-aid',
    details: {
      radius: 10,
      priority: 'expedited',
      resources: { ambulance: 2, fireTruck: 1, police: 0, heavyRescue: 0 }
    }
  },
  {
    id: 'n1',
    type: 'critical',
    title: 'INC-2407 escalated to Operations Manager',
    desc: 'Armed robbery in Kicukiro — awaiting command decision',
    time: '2m ago',
    read: false,
    href: '/dispatcher/active-incident',
  },
  {
    id: 'n2',
    type: 'system',
    title: 'AI Dispatch Engine — recommendation ready',
    desc: 'New dispatch recommendation for INC-2408 — Medical Emergency, Gasabo',
    time: '5m ago',
    read: false,
    href: '/dispatcher/ai-engine',
  },
  {
    id: 'n3',
    type: 'info',
    title: 'Unit FTK-05 has gone offline',
    desc: 'Fire unit FTK-05 lost GPS signal at 14:18. Last known: Nyarugenge.',
    time: '18m ago',
    read: true,
    href: '/dispatcher',
  },
  {
    id: 'n4',
    type: 'system',
    title: 'Shift handover reminder',
    desc: 'Your shift ends in 45 minutes. Begin handover report.',
    time: '32m ago',
    read: true,
    href: '/dispatcher/shift-handover',
  },
]
