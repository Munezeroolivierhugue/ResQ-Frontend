import DistrictLabel from './DistrictLabel'
import { getDistrictCommanderDistrict } from '../../utils/districtCommanderSession'

export default function DCPageHeader({ title, subtitle }) {
  const districtName = getDistrictCommanderDistrict()

  return (
    <div className="mb-6">
      <h1 className="dispatcher-page-title m-0">{title}</h1>
      <DistrictLabel districtName={districtName} />
      {subtitle && <p className="dispatcher-page-subtitle m-0 mt-2">{subtitle}</p>}
    </div>
  )
}
