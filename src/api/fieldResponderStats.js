import api from '../lib/apiClient'

export async function getMyStats() {
  const { data } = await api.get('/api/field-responders/me/stats')
  const s = data.data ?? data
  return {
    incidents_today: s.incidentsToday ?? 0,
    reports_filed_today: s.reportsFiledToday ?? 0,
    reports_filed_total: s.reportsFiledTotal ?? 0,
    avg_response_minutes_today: s.avgResponseMinutesToday ?? null,
    district_avg_response_minutes_today: s.districtAvgResponseMinutesToday ?? null,
  }
}
