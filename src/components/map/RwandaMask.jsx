import { GeoJSON } from 'react-leaflet'

// Rwanda border polygon (accurate simplified outline, counter-clockwise)
const RWANDA_CCW = [
  [29.0222, -1.0644], [29.0222, -1.0644],
  [29.1200, -1.0474], [29.2500, -1.0600], [29.3800, -1.0700],
  [29.5200, -1.0900], [29.6300, -1.0700], [29.7200, -1.0800],
  [29.8300, -1.0600], [29.9500, -1.0700], [30.0600, -1.0900],
  [30.1500, -1.1200], [30.2200, -1.1600], [30.3500, -1.2000],
  [30.4800, -1.2600], [30.5500, -1.3400], [30.6200, -1.4200],
  [30.6800, -1.5000], [30.7500, -1.5800], [30.8200, -1.6700],
  [30.8700, -1.7600], [30.8990, -1.8500], [30.8800, -1.9500],
  [30.8500, -2.0500], [30.8200, -2.1500], [30.8000, -2.2500],
  [30.7600, -2.3500], [30.7000, -2.4400], [30.6200, -2.5200],
  [30.5300, -2.5900], [30.4400, -2.6500], [30.3400, -2.7000],
  [30.2300, -2.7500], [30.1200, -2.7900], [30.0000, -2.8100],
  [29.8800, -2.8402], [29.7500, -2.8200], [29.6200, -2.7800],
  [29.5000, -2.7200], [29.4000, -2.6500], [29.3200, -2.5700],
  [29.2500, -2.4800], [29.1900, -2.3900], [29.1400, -2.2900],
  [29.0900, -2.1900], [29.0500, -2.0900], [29.0000, -1.9800],
  [28.9600, -1.8700], [28.9200, -1.7600], [28.8900, -1.6500],
  [28.8617, -1.5400], [28.8700, -1.4300], [28.9000, -1.3200],
  [28.9400, -1.2200], [28.9800, -1.1500], [29.0222, -1.0644],
]

// Clockwise version for the hole
const RWANDA_CW = [...RWANDA_CCW].reverse()

// World polygon with Rwanda punched out as a hole
const MASK_GEOJSON = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      // Outer ring: entire world (counter-clockwise)
      [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
      // Inner ring: Rwanda hole (clockwise = hole in GeoJSON)
      RWANDA_CW,
    ],
  },
}

// Rwanda border outline only
const BORDER_GEOJSON = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [RWANDA_CCW],
  },
}

export default function RwandaMask() {
  return (
    <>
      {/* Mask: dark overlay on everything outside Rwanda */}
      <GeoJSON
        key="rwanda-mask"
        data={MASK_GEOJSON}
        style={{
          fillColor: '#040D1F',
          fillOpacity: 0.92,
          color: 'transparent',
          weight: 0,
          interactive: false,
        }}
      />
      {/* Border: clean green stroke around Rwanda */}
      <GeoJSON
        key="rwanda-border"
        data={BORDER_GEOJSON}
        style={{
          fill: false,
          color: '#3DAA6A',
          weight: 2,
          opacity: 0.85,
          interactive: false,
        }}
      />
    </>
  )
}
