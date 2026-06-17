import { useParams, Navigate } from 'react-router-dom'
import AdminPortalSettingsView from '../../components/settings/AdminPortalSettingsView'
import AdminSystemSettings from './AdminSystemSettings'

const USER_SECTIONS = ['profile', 'appearance', 'notifications', 'language', 'security']
const SYSTEM_SECTIONS = ['general', 'retention', 'backup', 'announcements']

export default function AdminSettings() {
  const { section } = useParams()

  if (!section || USER_SECTIONS.includes(section)) {
    return <AdminPortalSettingsView />
  }

  if (SYSTEM_SECTIONS.includes(section)) {
    return <AdminSystemSettings />
  }

  // Unknown section — fall back to profile
  return <Navigate to="/admin/settings/profile" replace />
}
