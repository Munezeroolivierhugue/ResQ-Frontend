import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import LiveDispatchMap from './pages/dispatcher/LiveDispatchMap'
import NewIncident from './pages/dispatcher/NewIncident'
import AIDispatchEngine from './pages/dispatcher/AIDispatchEngine'
import IncidentQueue from './pages/dispatcher/IncidentQueue'
import IncidentHistory from './pages/dispatcher/IncidentHistory'
import ShiftManagement from './pages/dispatcher/ShiftManagement'
import MyProfile from './pages/dispatcher/MyProfile'

const dispatcher = { name: 'Jean Bosco', role: 'DISPATCHER' }

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dispatcher" element={<AppShell user={dispatcher} />}>
          <Route index element={<LiveDispatchMap />} />
          <Route path="new-incident" element={<NewIncident />} />
          <Route path="ai-engine" element={<AIDispatchEngine />} />
          <Route path="queue" element={<IncidentQueue />} />
          <Route path="history" element={<IncidentHistory />} />
          <Route path="shifts" element={<ShiftManagement />} />
          <Route path="profile" element={<MyProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/dispatcher" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
