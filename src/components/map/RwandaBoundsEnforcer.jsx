import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { RWANDA_BOUNDS, RWANDA_MIN_ZOOM, RWANDA_MAX_ZOOM } from './rwandaConstants'

export default function RwandaBoundsEnforcer() {
  const map = useMap()

  useEffect(() => {
    map.fitBounds(RWANDA_BOUNDS, { padding: [0, 0], animate: false })
    map.setMinZoom(RWANDA_MIN_ZOOM)
    map.setMaxZoom(RWANDA_MAX_ZOOM)
    map.setMaxBounds(RWANDA_BOUNDS)

    map.on('drag', () => {
      map.panInsideBounds(RWANDA_BOUNDS, { animate: false })
    })

    map.on('zoomend', () => {
      if (!RWANDA_BOUNDS.contains(map.getCenter())) {
        map.panInsideBounds(RWANDA_BOUNDS, { animate: false })
      }
    })
  }, [map])

  return null
}
