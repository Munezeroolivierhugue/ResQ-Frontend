export const DC_DISTRICT_NAME = 'Nyarugenge'
const DC_DISTRICT_KEY = 'resq-dc-district'

export function getDistrictCommanderDistrict() {
  return (
    sessionStorage.getItem(DC_DISTRICT_KEY) ||
    sessionStorage.getItem('resq-invite-district') ||
    DC_DISTRICT_NAME
  )
}

export function setDistrictCommanderSession(districtName = DC_DISTRICT_NAME) {
  sessionStorage.setItem(DC_DISTRICT_KEY, districtName)
  sessionStorage.setItem('resq-om-district', districtName)
}

export function getDistrictLabelHeading(districtName) {
  return `${districtName.toUpperCase()} DISTRICT`
}
