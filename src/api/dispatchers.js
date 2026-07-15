import api from '../lib/apiClient'

export async function getDispatcherSupervision() {
  const { data } = await api.get('/api/dispatchers/supervision')
  return (data.data ?? data).map((d) => ({
    user_id: d.userId,
    name: d.name,
    active_incidents: d.activeIncidents,
    incidents_handled_today: d.incidentsHandledToday,
    ai_acceptance_rate: d.aiAcceptanceRate,
    on_duty: d.onDuty,
  }))
}
