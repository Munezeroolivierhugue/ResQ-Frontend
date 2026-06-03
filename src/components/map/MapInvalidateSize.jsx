import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export default function MapInvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const invalidate = () => map.invalidateSize()
    const t = setTimeout(invalidate, 0)
    const t2 = setTimeout(invalidate, 150)
    window.addEventListener('resize', invalidate)
    return () => {
      clearTimeout(t)
      clearTimeout(t2)
      window.removeEventListener('resize', invalidate)
    }
  }, [map])
  return null
}
