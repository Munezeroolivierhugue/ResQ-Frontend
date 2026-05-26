const OM_DISTRICT_SESSION_KEY = 'resq-om-district'
const DEFAULT_OM_DISTRICT = 'Nyarugenge'

/** Assigned district for Operations Manager (admin provisioning or demo default). */
export function getOpsManagerDistrict() {
  return (
    sessionStorage.getItem(OM_DISTRICT_SESSION_KEY) ||
    sessionStorage.getItem('resq-invite-district') ||
    DEFAULT_OM_DISTRICT
  )
}

export function getOpsManagerDistrictHeading() {
  return `${getOpsManagerDistrict().toUpperCase()} DISTRICT`
}
