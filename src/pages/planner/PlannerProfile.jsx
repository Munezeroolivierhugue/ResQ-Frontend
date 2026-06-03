import SettingsProfileSection from '../../components/settings/SettingsProfileSection'
import PlannerPageHeader from '../../components/planner/PlannerPageHeader'

export default function PlannerProfile() {
  return (
    <div className="portal-page">
      <PlannerPageHeader title="My Profile" subtitle="Emergency planner account and shift context." />
      <SettingsProfileSection
        initials="CU"
        roleLabel="EMERGENCY PLANNER"
        badge="PLN-0018"
        defaultForm={{
          name: 'Claudine Uwimana',
          email: 'c.uwimana@resq.rw',
          phone: '+250 788 334 221',
          station: 'Kigali City Planning Office',
        }}
        stationAdminNote="Assigned by administrator · contact HQ provisioning to change"
        shiftStats={[
          { label: 'Planning window', value: '08:00 – 17:00 · Today' },
          { label: 'Plans submitted this week', value: '7' },
          { label: 'Active predictions', value: '6' },
          { label: 'Coverage district', value: 'Kigali City — All Districts' },
        ]}
      />
    </div>
  )
}
