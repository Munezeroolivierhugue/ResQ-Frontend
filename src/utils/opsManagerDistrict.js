const OM_DISTRICT_SESSION_KEY = 'resq-om-district'

export function getOpsManagerDistrict() {
  return (
    sessionStorage.getItem('resq-district-name') ||
    sessionStorage.getItem(OM_DISTRICT_SESSION_KEY) ||
    sessionStorage.getItem('resq-invite-district') ||
    null
  )
}

export function getOpsManagerDistrictHeading() {
  const d = getOpsManagerDistrict()
  if (!d) return 'DISTRICT COMMAND'
  const name = d.toUpperCase()
  return name.endsWith(' DISTRICT') ? name : `${name} DISTRICT`
}
