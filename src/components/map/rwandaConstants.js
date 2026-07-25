import L from 'leaflet'

export const RWANDA_CENTER = [-1.9403, 29.8739]
export const RWANDA_BOUNDS = L.latLngBounds(
  L.latLng(-2.8402, 28.8617),
  L.latLng(-1.0474, 30.8990)
)
export const RWANDA_MIN_ZOOM = 9
export const RWANDA_MAX_ZOOM = 16

// Real, fixed administrative sectors per district — Kigali City only, since
// that's the only area this app currently has live data/coverage for. Used
// to validate an incident's recorded `sector` actually belongs to the
// district it's shown under: seed/geocoded data sometimes stored the
// district's own name as the "sector" (e.g. "Nyarugenge District"), or a
// sector belonging to a different district entirely, which then rendered as
// a bogus coverage zone on the wrong district's own Coverage Analysis page.
export const DISTRICT_SECTORS = {
  Nyarugenge: ['Gitega', 'Kanyinya', 'Kigali', 'Kimisagara', 'Mageragere', 'Muhima', 'Nyakabanda', 'Nyamirambo', 'Nyarugenge', 'Rwezamenyo'],
  Gasabo: ['Bumbogo', 'Gatsata', 'Gikomero', 'Gisozi', 'Jabana', 'Jali', 'Kacyiru', 'Kimihurura', 'Kimironko', 'Kinyinya', 'Ndera', 'Nduba', 'Remera', 'Rusororo', 'Rutunga'],
  Kicukiro: ['Gahanga', 'Gatenga', 'Gikondo', 'Kagarama', 'Kanombe', 'Kicukiro', 'Kigarama', 'Masaka', 'Niboye', 'Nyarugunga'],
}
