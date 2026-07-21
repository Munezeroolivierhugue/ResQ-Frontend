// Derives headcount and required-ambulance-count from triage answers instead of
// asking the dispatcher to manually type "number of people involved" — the
// triage questions already capture this (and, crucially, how badly hurt those
// people are), so a manual duplicate field was both redundant and a second
// source of truth that could disagree with the triage answers.
//
// Real-world rule (per product): 1 ambulance carries 1 patient to hospital.
// So the ambulance count should track how many people are CRITICAL — severely
// injured / immobile / unable to get themselves to the ambulance — not the
// raw headcount. A road accident with 10 people who can all walk needs far
// fewer ambulances than one with 2 people trapped and unconscious.

const MAX_AMBULANCES = 6

// Per incident-type config describing:
//  - which triage question holds the headcount (or a proxy for it), and how
//    to translate its (often bucketed) answer into a numeric estimate
//  - which triage answers indicate the people involved are in a critical /
//    immobile state (i.e. cannot self-transport)
const TYPE_CONFIG = {
  MEDICAL: {
    countQuestion: 'Q_MED_COUNT',
    countMap: { '1': 1, '2–3': 3, '4 or more': 4 },
    criticalIndicators: [
      { code: 'Q_MED_CONSCIOUS', values: ['Unconscious'] },
      { code: 'Q_MED_BREATHING', values: ['Not breathing', 'Difficulty breathing'] },
      { code: 'Q_MED_BLEEDING',  values: ['Yes'] },
    ],
  },
  RTA: {
    // RTA has no direct "how many people" question — injury severity is the
    // best available proxy for how many casualties need transport.
    countQuestion: 'Q_RTA_INJURIES',
    countMap: { 'Multiple severe': 3, 'One severe': 1, 'Minor only': 1, 'None visible': 0 },
    criticalIndicators: [
      { code: 'Q_RTA_TRAPPED',   values: ['Yes, multiple', 'Yes, one'] },
      { code: 'Q_RTA_INJURIES',  values: ['Multiple severe', 'One severe'] },
      { code: 'Q_RTA_FATALITY',  values: ['Yes'] },
    ],
  },
  FIRE: {
    countQuestion: 'Q_FIR_CASUALTIES',
    countMap: { 'Multiple': 3, 'One': 1, 'None': 0 },
    criticalIndicators: [
      { code: 'Q_FIR_TRAPPED',    values: ['Yes, many', 'Yes, one'] },
      { code: 'Q_FIR_CASUALTIES', values: ['Multiple', 'One'] },
    ],
  },
  SECURITY: {
    countQuestion: 'Q_SEC_CASUALTIES',
    countMap: { 'Multiple': 3, 'One': 1, 'None': 0 },
    criticalIndicators: [
      { code: 'Q_SEC_CASUALTIES', values: ['Multiple', 'One'] },
    ],
  },
  DISASTER: {
    countQuestion: 'Q_DIS_SCALE',
    countMap: { '1–10': 5, '11–50': 30, '51–200': 100, '200 or more': 200 },
    criticalIndicators: [
      { code: 'Q_DIS_TRAPPED', values: ['Yes, many', 'Yes, few'] },
    ],
  },
  OTHER: {
    countQuestion: 'Q_OTH_PEOPLE',
    countMap: { '1': 1, '2–5': 3, '6–10': 8, '10 or more': 10 },
    criticalIndicators: [
      { code: 'Q_OTH_CASUALTIES', values: ['Multiple', 'One'] },
    ],
  },
}

/**
 * @param {string} incidentType   Backend triage type code (MEDICAL/RTA/FIRE/SECURITY/DISASTER/OTHER)
 * @param {Array<{question_code:string, answer:string}>} triageResponses
 * @returns {{ peopleCount: number, criticalCount: number, recommendedAmbulances: number }}
 */
export function estimateAmbulanceNeed(incidentType, triageResponses) {
  const cfg = TYPE_CONFIG[(incidentType ?? '').toUpperCase()]
  if (!cfg || !Array.isArray(triageResponses)) {
    return { peopleCount: 0, criticalCount: 0, recommendedAmbulances: 0 }
  }

  const answerFor = (code) => triageResponses.find((r) => r.question_code === code)?.answer

  const countAnswer = answerFor(cfg.countQuestion)
  const peopleCount = countAnswer != null ? (cfg.countMap[countAnswer] ?? 0) : 0

  const isCritical = cfg.criticalIndicators.some(
    (ind) => ind.values.includes(answerFor(ind.code))
  )

  // People who are severely injured/immobile need an ambulance each.
  // People who are not severely hurt can usually get themselves to hospital,
  // so they don't each need a dedicated ambulance — but if anyone is
  // involved at all, dispatch at least one ambulance to be safe.
  let criticalCount
  if (peopleCount === 0) {
    criticalCount = 0
  } else if (isCritical) {
    criticalCount = peopleCount
  } else {
    criticalCount = 1
  }

  const recommendedAmbulances = peopleCount === 0
    ? 0
    : Math.min(MAX_AMBULANCES, Math.max(1, Math.ceil(criticalCount / 1)))

  return { peopleCount, criticalCount, recommendedAmbulances }
}
