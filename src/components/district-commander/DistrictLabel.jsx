import { MapPin } from 'lucide-react'
import { getDistrictLabelHeading } from '../../utils/districtCommanderSession'

export default function DistrictLabel({ districtName }) {
  const heading = getDistrictLabelHeading(districtName)

  return (
    <span
      className="inline-flex items-center gap-[0.4rem] mt-1.5"
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--accent)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <MapPin size={14} style={{ color: 'var(--accent)' }} aria-hidden />
      {heading}
    </span>
  )
}
