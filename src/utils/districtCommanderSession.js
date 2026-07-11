const DC_DISTRICT_KEY = 'resq-dc-district'

export function getDistrictCommanderDistrict() {
  return (
    sessionStorage.getItem('resq-district-name') ||
    sessionStorage.getItem(DC_DISTRICT_KEY) ||
    sessionStorage.getItem('resq-invite-district') ||
    null
  )
}

export function setDistrictCommanderSession(districtName) {
  if (districtName) {
    sessionStorage.setItem(DC_DISTRICT_KEY, districtName)
    sessionStorage.setItem('resq-om-district', districtName)
  }
}

export function getDistrictLabelHeading(districtName) {
  if (!districtName) return 'DISTRICT COMMAND'
  const name = districtName.toUpperCase()
  if (name.endsWith(' DISTRICT')) return name
  return `${name} DISTRICT`
}
