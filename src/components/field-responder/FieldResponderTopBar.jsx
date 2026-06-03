import { Siren, Bell } from 'lucide-react'
import { FR_OFFICER } from '../../data/mockFieldResponderData'

export default function FieldResponderTopBar({ title }) {
  return (
    <header className="fr-topbar field-responder-topbar">
      <div className="fr-topbar-brand">
        <Siren size={20} className="text-(--accent)" />
        <span className="fr-topbar-logo">RESQ</span>
      </div>
      <h1 className="fr-topbar-title">{title}</h1>
      <div className="fr-topbar-actions">
        <span className="fr-topbar-badge">{FR_OFFICER.badge}</span>
        <button type="button" className="fr-topbar-bell" aria-label="Notifications">
          <Bell size={20} />
          <span className="fr-topbar-bell-dot" aria-hidden />
        </button>
      </div>
    </header>
  )
}
