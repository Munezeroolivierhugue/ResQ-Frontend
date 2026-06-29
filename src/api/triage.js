import api from '../lib/apiClient'

function parseAnswerOptions(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    // Try JSON array first: '["YES","NO"]'
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    // Fallback: comma-separated 'YES,NO,UNKNOWN'
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function parseConditionJson(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return {} }
}

function transformQuestion(q) {
  return {
    question_id: q.questionId,
    incident_type: q.incidentType,
    question_code: q.questionCode,
    question_text: q.questionText,
    answer_options: parseAnswerOptions(q.answerOptions),
    display_order: q.displayOrder,
  }
}

function transformRule(r) {
  return {
    rule_id: r.ruleId,
    incident_type: r.incidentType,
    rule_order: r.ruleOrder ?? r.ruleCode ?? 0,
    condition_json: parseConditionJson(r.conditionJson ?? r.condition),
    severity: r.severity,
    active: r.active !== false,
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
