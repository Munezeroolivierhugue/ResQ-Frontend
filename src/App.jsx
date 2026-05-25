import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import AdminShell from './components/admin/AdminShell'
import LiveDispatchMap from './pages/dispatcher/LiveDispatchMap'
import NewIncident from './pages/dispatcher/NewIncident'
import AIDispatchEngine from './pages/dispatcher/AIDispatchEngine'
import ActiveIncident from './pages/dispatcher/ActiveIncident'
import IncidentHistory from './pages/dispatcher/IncidentHistory'
import IncidentClosure from './pages/dispatcher/IncidentClosure'
import ShiftHandover from './pages/dispatcher/ShiftHandover'
import MyProfile from './pages/dispatcher/MyProfile'
import DispatcherSettings from './pages/dispatcher/Settings'
import DispatchImmediate from './pages/dispatcher/DispatchImmediate'
import Notifications from './pages/dispatcher/Notifications'
import DispatcherRoute from './components/layout/DispatcherRoute'
import AdminSettings from './pages/admin/AdminSettings'
import Login from './pages/auth/Login'
import LoginMfa from './pages/auth/LoginMfa'
import Register from './pages/auth/Register'
import VerifyOtp from './pages/auth/VerifyOtp'
import MfaSetup from './pages/auth/MfaSetup'
import AdminInviteUser from './pages/admin/AdminInviteUser'
import AdminUsers from './pages/admin/AdminUsers'

const dispatcher = { name: 'Jean Bosco', role: 'DISPATCHER' }
const admin = { name: 'Super Admin', role: 'SUPER ADMIN' }

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth (frontend simulation) */}
        <Route path="/login" element={<Login />} />
        <Route path="/login/mfa" element={<LoginMfa />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/password" element={<Navigate to="/register" replace />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/mfa-setup" element={<MfaSetup />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminShell user={admin} />}>
          <Route index element={<AdminInviteUser />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Dispatcher portal */}
        <Route path="/dispatcher" element={<AppShell user={dispatcher} />}>
          <Route index element={<LiveDispatchMap />} />
          <Route path="new-incident" element={<NewIncident />} />
          <Route path="ai-engine" element={<AIDispatchEngine />} />
          <Route path="active-incident" element={<ActiveIncident />} />
          <Route path="queue" element={<Navigate to="/dispatcher/active-incident" replace />} />
          <Route path="history" element={<IncidentHistory />} />
          <Route path="incident-report" element={<IncidentClosure />} />
          <Route path="shift-handover" element={<ShiftHandover />} />
          <Route path="shifts" element={<Navigate to="/dispatcher/shift-handover" replace />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="settings" element={<DispatcherSettings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route element={<DispatcherRoute />}>
            <Route path="dispatch-immediate/:incidentId" element={<DispatchImmediate />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
