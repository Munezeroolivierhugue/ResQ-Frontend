import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

/** Fits map view to all provided [lat, lng] points. */
export default function MapFitBounds({ points, padding = [56, 56] }) {
  const map = useMap()

  useEffect(() => {
    if (!points?.length) return
    const bounds = L.latLngBounds(points.map(([lat, lng]) => [lat, lng]))
    map.fitBounds(bounds, { padding, maxZoom: 16 })
  }, [map, points, padding])

  return null
}
