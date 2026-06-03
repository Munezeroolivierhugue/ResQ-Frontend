import { severityBannerBg } from '../../data/mockFieldResponderData'

export default function SeverityBanner({
  severity,
  label,
  title,
  location,
  landmark,
  incidentId,
  children,
}) {
  return (
    <div
      className="fr-severity-banner"
      style={{ background: severityBannerBg(severity) }}
    >
      {label && <div className="fr-severity-label">{label}</div>}
      <div className="fr-severity-row">
        <div className="fr-severity-main">
          <div className="fr-severity-title">{title}</div>
          {location && <div className="fr-severity-location">{location}</div>}
          {landmark && <div className="fr-severity-landmark">{landmark}</div>}
          {children}
        </div>
        {incidentId && <div className="fr-severity-id">{incidentId}</div>}
      </div>
    </div>
  )
}
