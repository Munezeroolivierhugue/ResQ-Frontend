import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import SettingsProfileSection from '../../components/settings/SettingsProfileSection'

export default function AnalystProfile() {
  return (
    <div className="portal-page">
      <AnalystPageHeader title="My Profile" subtitle="Analyst account and workspace identity." />
      <SettingsProfileSection
        initials="GI"
        roleLabel="ANALYST"
        badge="ANL-0024"
        defaultForm={{
          name: 'Grace Ingabire',
          email: 'g.ingabire@rnp.gov.rw',
          phone: '+250788998877',
          station: 'HQ Central Command — Kigali',
        }}
      />
    </div>
  )
}
