import AdminPageHeader from '../../components/admin/AdminPageHeader'
import SettingsProfileSection from '../../components/settings/SettingsProfileSection'

export default function AdminProfile() {
  return (
    <div className="portal-page">
      <AdminPageHeader title="My Profile" subtitle="Super Admin account identity." />
      <SettingsProfileSection
        initials="SA"
        roleLabel="SUPER ADMIN"
        badge="ADM-0001"
        defaultForm={{
          name: 'System Admin',
          email: 'admin@resq.rw',
          phone: '+250 788 000 001',
          station: 'RNP HQ Central Command',
        }}
      />
    </div>
  )
}
