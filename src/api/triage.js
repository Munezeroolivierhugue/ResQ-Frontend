import api from '../lib/apiClient'

function transformQuestion(q) {
  return {
    question_id: q.questionId,
    incident_type: q.incidentType,
    question_code: q.questionCode,
    question_text: q.questionText,
    answer_options: q.answerOptions,
    display_order: q.displayOrder,
  }
}

function transformRule(r) {
  return {
    rule_id: r.ruleId,
    incident_type: r.incidentType,
    rule_code: r.ruleCode,
    description: r.description,
    condition: r.condition,
    severity: r.severity,
  }
}

export async function getTriageQuestions(incidentType) {
  const { data } = await api.get('/api/triage/questions', { params: { incidentType } })
  return (data.data ?? data).map(transformQuestion)
}

export async function getSeverityRules(incidentType) {
  const { data } = await api.get('/api/triage/severity-rules', { params: { incidentType } })
  return (data.data ?? data).map(transformRule)
}

export async function submitTriageResponses(incidentId, responses, severityOverrideReason) {
  const payload = { responses }
  if (severityOverrideReason) payload.severityOverrideReason = severityOverrideReason
  const { data } = await api.post(`/api/triage/incidents/${incidentId}/responses`, payload)
  return data.data ?? data
}
