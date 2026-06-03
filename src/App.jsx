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
import AdminRoute from './components/layout/AdminRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminIntegrations from './pages/admin/AdminIntegrations'
import AdminAIConfig from './pages/admin/AdminAIConfig'
import AdminAudit from './pages/admin/AdminAudit'
import AdminSecurity from './pages/admin/AdminSecurity'
import AdminProfile from './pages/admin/AdminProfile'
import Login from './pages/auth/Login'
import LoginMfa from './pages/auth/LoginMfa'
import Register from './pages/auth/Register'
import VerifyOtp from './pages/auth/VerifyOtp'
import MfaSetup from './pages/auth/MfaSetup'
import AdminInviteUser from './pages/admin/AdminInviteUser'
import AdminUsers from './pages/admin/AdminUsers'
import OpsManagerShell from './components/ops-manager/OpsManagerShell'
import OpsManagerRoute from './components/layout/OpsManagerRoute'
import OpsManagerDashboard from './pages/ops-manager/OpsManagerDashboard'
import OpsManagerMap from './pages/ops-manager/OpsManagerMap'
import OpsManagerEscalations from './pages/ops-manager/OpsManagerEscalations'
import OpsManagerEscalation from './pages/ops-manager/OpsManagerEscalation'
import OpsManagerResources from './pages/ops-manager/OpsManagerResources'
import OpsManagerMultiAgency from './pages/ops-manager/OpsManagerMultiAgency'
import OpsManagerDispatchers from './pages/ops-manager/OpsManagerDispatchers'
import OpsManagerShift from './pages/ops-manager/OpsManagerShift'
import OpsManagerProfile from './pages/ops-manager/OpsManagerProfile'
import OpsManagerSettings from './pages/ops-manager/OpsManagerSettings'
import DistrictCommanderRoute from './components/layout/DistrictCommanderRoute'
import DistrictCommanderShell from './components/district-commander/DistrictCommanderShell'
import DCDashboard from './pages/district-commander/DCDashboard'
import DCShiftReports from './pages/district-commander/DCShiftReports'
import DCUnits from './pages/district-commander/DCUnits'
import DCCoverage from './pages/district-commander/DCCoverage'
import DCResources from './pages/district-commander/DCResources'
import DCExecutiveReport from './pages/district-commander/DCExecutiveReport'
import DCProfile from './pages/district-commander/DCProfile'
import DCSettings from './pages/district-commander/DCSettings'
import FieldResponderRoute from './components/layout/FieldResponderRoute'
import FieldResponderShell from './components/field-responder/FieldResponderShell'
import FRShiftStart from './pages/field-responder/FRShiftStart'
import FRAssignment from './pages/field-responder/FRAssignment'
import FRNavigation from './pages/field-responder/FRNavigation'
import FROnScene from './pages/field-responder/FROnScene'
import FRFieldReport from './pages/field-responder/FRFieldReport'
import FRPerformance from './pages/field-responder/FRPerformance'
import FRShiftEnd from './pages/field-responder/FRShiftEnd'
import FRProfile from './pages/field-responder/FRProfile'
import FieldResponderSettingsView from './components/settings/FieldResponderSettingsView'
import PlannerRoute from './components/layout/PlannerRoute'
import PlannerShell from './components/planner/PlannerShell'
import PlannerDashboard from './pages/planner/PlannerDashboard'
import PlannerHotspots from './pages/planner/PlannerHotspots'
import PlannerCoverage from './pages/planner/PlannerCoverage'
import PlannerDeployment from './pages/planner/PlannerDeployment'
import PlannerSimulation from './pages/planner/PlannerSimulation'
import PlannerPrediction from './pages/planner/PlannerPrediction'
import PlannerReports from './pages/planner/PlannerReports'
import PlannerProfile from './pages/planner/PlannerProfile'
import PlannerSettings from './pages/planner/PlannerSettings'
import AnalystRoute from './components/layout/AnalystRoute'
import AnalystShell from './components/analyst/AnalystShell'
import AnalystDashboard from './pages/analyst/AnalystDashboard'
import AnalystReports from './pages/analyst/AnalystReports'
import AnalystPatterns from './pages/analyst/AnalystPatterns'
import AnalystModels from './pages/analyst/AnalystModels'
import AnalystDataQuality from './pages/analyst/AnalystDataQuality'
import AnalystBenchmarking from './pages/analyst/AnalystBenchmarking'
import AnalystLibrary from './pages/analyst/AnalystLibrary'
import AnalystProfile from './pages/analyst/AnalystProfile'
import AnalystSettings from './pages/analyst/AnalystSettings'

const dispatcher = { name: 'Jean Bosco', role: 'DISPATCHER' }
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

        {/* Super Admin */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminShell />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="integrations" element={<AdminIntegrations />} />
            <Route path="ai-config" element={<AdminAIConfig />} />
            <Route path="audit" element={<AdminAudit />} />
            <Route path="security" element={<AdminSecurity />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="settings" element={<Navigate to="/admin/settings/general" replace />} />
            <Route path="settings/:section" element={<AdminSettings />} />
            <Route path="invite" element={<AdminInviteUser />} />
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        {/* Field Responder mobile app */}
        <Route path="/field-responder" element={<FieldResponderRoute />}>
          {/* Navigation is full-screen (no shell chrome) — map needs a real viewport height */}
          <Route path="navigation" element={<FRNavigation />} />
          <Route element={<FieldResponderShell />}>
            <Route path="shift-start" element={<FRShiftStart />} />
            <Route path="assignment" element={<FRAssignment />} />
            <Route path="on-scene" element={<FROnScene />} />
            <Route path="report" element={<FRFieldReport />} />
            <Route path="performance" element={<FRPerformance />} />
            <Route path="shift-end" element={<FRShiftEnd />} />
            <Route path="profile" element={<FRProfile />} />
            <Route path="settings" element={<Navigate to="/field-responder/settings/profile" replace />} />
            <Route path="settings/:section" element={<FieldResponderSettingsView />} />
            <Route index element={<Navigate to="/field-responder/shift-start" replace />} />
          </Route>
        </Route>

        {/* District Commander portal */}
        <Route path="/district-commander" element={<DistrictCommanderRoute />}>
          <Route element={<DistrictCommanderShell />}>
            <Route path="dashboard" element={<DCDashboard />} />
            <Route path="shift-reports" element={<DCShiftReports />} />
            <Route path="units" element={<DCUnits />} />
            <Route path="coverage" element={<DCCoverage />} />
            <Route path="resources" element={<DCResources />} />
            <Route path="executive-report" element={<DCExecutiveReport />} />
            <Route path="profile" element={<DCProfile />} />
            <Route path="settings" element={<Navigate to="/district-commander/settings/profile" replace />} />
            <Route path="settings/:section" element={<DCSettings />} />
            <Route index element={<Navigate to="/district-commander/dashboard" replace />} />
          </Route>
        </Route>

        {/* Analyst portal */}
        <Route path="/analyst" element={<AnalystRoute />}>
          <Route element={<AnalystShell />}>
            <Route path="dashboard" element={<AnalystDashboard />} />
            <Route path="reports" element={<AnalystReports />} />
            <Route path="patterns" element={<AnalystPatterns />} />
            <Route path="models" element={<AnalystModels />} />
            <Route path="data-quality" element={<AnalystDataQuality />} />
            <Route path="benchmarking" element={<AnalystBenchmarking />} />
            <Route path="library" element={<AnalystLibrary />} />
            <Route path="profile" element={<AnalystProfile />} />
            <Route path="settings" element={<Navigate to="/analyst/settings/profile" replace />} />
            <Route path="settings/:section" element={<AnalystSettings />} />
            <Route index element={<Navigate to="/analyst/dashboard" replace />} />
          </Route>
        </Route>

        {/* Emergency Planner portal */}
        <Route path="/planner" element={<PlannerRoute />}>
          <Route element={<PlannerShell />}>
            <Route path="dashboard" element={<PlannerDashboard />} />
            <Route path="hotspots" element={<PlannerHotspots />} />
            <Route path="coverage" element={<PlannerCoverage />} />
            <Route path="deployment" element={<PlannerDeployment />} />
            <Route path="simulation" element={<PlannerSimulation />} />
            <Route path="prediction" element={<PlannerPrediction />} />
            <Route path="reports" element={<PlannerReports />} />
            <Route path="profile" element={<PlannerProfile />} />
            <Route path="settings" element={<Navigate to="/planner/settings/profile" replace />} />
            <Route path="settings/:section" element={<PlannerSettings />} />
            <Route index element={<Navigate to="/planner/dashboard" replace />} />
          </Route>
        </Route>

        {/* Operations Manager portal */}
        <Route path="/ops-manager" element={<OpsManagerRoute />}>
          <Route element={<OpsManagerShell />}>
            <Route path="dashboard" element={<OpsManagerDashboard />} />
            <Route path="map" element={<OpsManagerMap />} />
            <Route path="escalations" element={<OpsManagerEscalations />} />
            <Route path="escalations/:incidentId" element={<OpsManagerEscalation />} />
            <Route path="resources" element={<OpsManagerResources />} />
            <Route path="multi-agency" element={<OpsManagerMultiAgency />} />
            <Route path="dispatchers" element={<OpsManagerDispatchers />} />
            <Route path="shift" element={<OpsManagerShift />} />
            <Route path="profile" element={<OpsManagerProfile />} />
            <Route path="settings" element={<Navigate to="/ops-manager/settings/profile" replace />} />
            <Route path="settings/:section" element={<OpsManagerSettings />} />
            <Route index element={<Navigate to="/ops-manager/dashboard" replace />} />
          </Route>
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
          <Route path="settings" element={<Navigate to="/dispatcher/settings/profile" replace />} />
          <Route path="settings/:section" element={<DispatcherSettings />} />
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
