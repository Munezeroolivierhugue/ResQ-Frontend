/**
 * Severity Engine — evaluates triage responses against severity rules.
 *
 * condition_json format:
 *   Simple:  { field: "Q_RTA_01", equals: "Yes - severe" }
 *   OR list: { or: [{ field: "Q_RTA_01", equals: "Yes - severe" }, { field: "Q_RTA_02", equals: "Yes" }] }
 *   Empty:   {} → always matches (fallback rule)
 *
 * @param {string} incident_type  - e.g. "RTA", "MEDICAL", "FIRE", "SECURITY"
 * @param {Array}  triage_responses - [{ question_code, answer }, ...]
 * @returns {string} severity - "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
 */
import { mockSeverityRules } from '../data/mockSeverityRules'

/** Map UI incident_type labels → triage question type codes */
const TYPE_MAP = {
  'RTA':          'RTA',
  'Traffic':      'RTA',
  'Medical':      'MEDICAL',
  'MEDICAL':      'MEDICAL',
  'Fire':         'FIRE',
  'FIRE':         'FIRE',
  'Security':     'SECURITY',
  'SECURITY':     'SECURITY',
}

function evaluateCondition(condition, triage_responses) {
  // Empty condition = fallback, always matches
  if (!condition || Object.keys(condition).length === 0) return true

  // OR list
  if (condition.or) {
    return condition.or.some((c) => evaluateCondition(c, triage_responses))
  }

  // Simple equality check
  if (condition.field && condition.equals) {
    const resp = triage_responses.find((r) => r.question_code === condition.field)
    return resp?.answer === condition.equals
  }

  return false
}

/**
 * @param {string} incident_type
 * @param {Array}  triage_responses - [{ question_code, answer }, ...]
 * @param {Array|null} liveRules - real backend severity rules (from getSeverityRules).
 *   When provided, mock rules are ignored.
 */
export function calculateSeverity(incident_type, triage_responses, liveRules = null) {
  const typeKey = TYPE_MAP[incident_type] || incident_type
  const source = liveRules ?? mockSeverityRules
  const rules = source
    .filter((r) => r.incident_type === typeKey && r.active !== false)
    .sort((a, b) => (a.rule_order ?? 0) - (b.rule_order ?? 0))

  for (const rule of rules) {
    if (evaluateCondition(rule.condition_json, triage_responses)) {
      return (rule.severity ?? 'LOW').toUpperCase()
    }
  }

  return 'LOW'
}
