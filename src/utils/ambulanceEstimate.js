// Derives headcount and required-ambulance-count from triage answers instead of
// asking the dispatcher to manually type "number of people involved" — the
// triage questions already capture this, so a manual duplicate field was both
// redundant and a second source of truth that could disagree with them.
//
// Real-world rule (per product): in Rwanda, one ambulance carries a full crew
// (doctors on board can treat several patients at the scene) and typically
// transports the group unless the numbers involved are large enough to need
// a second/third vehicle. Rather than trying to infer per-person mobility
// from triage symptom answers (which was both inaccurate and made the
// dispatcher second-guess a serious-sounding call down to fewer ambulances),
// this is now a flat headcount scale — if it turns out more are needed once
// on scene, that's what the existing backup-request flow is for.

const AMBULANCE_THRESHOLDS = [
  { min: 101, count: 5 },
  { min: 61,  count: 3 },
  { min: 46,  count: 2 },
  { min: 0,   count: 1 },
]

function ambulancesForCount(peopleCount) {
  if (peopleCount <= 0) return 0
  const tier = AMBULANCE_THRESHOLDS.find((t) => peopleCount >= t.min)
  return tier.count
}

// Per incident-type config: which triage question holds the headcount (or a
// proxy for it), and how to translate its (often bucketed) answer into a
// numeric estimate.
const TYPE_CONFIG = {
  MEDICAL: {
    countQuestion: 'Q_MED_COUNT',
    countMap: { '1': 1, '2–3': 3, '4 or more': 4 },
  },
  RTA: {
    // RTA has no direct "how many people" question — injury severity is the
    // best available proxy for how many casualties need transport.
    countQuestion: 'Q_RTA_INJURIES',
    countMap: { 'Multiple severe': 3, 'One severe': 1, 'Minor only': 1, 'None visible': 0 },
  },
  FIRE: {
    countQuestion: 'Q_FIR_CASUALTIES',
    countMap: { 'Multiple': 3, 'One': 1, 'None': 0 },
  },
  SECURITY: {
    countQuestion: 'Q_SEC_CASUALTIES',
    countMap: { 'Multiple': 3, 'One': 1, 'None': 0 },
  },
  DISASTER: {
    countQuestion: 'Q_DIS_SCALE',
    countMap: { '1–10': 5, '11–50': 30, '51–200': 100, '200 or more': 200 },
  },
  OTHER: {
    countQuestion: 'Q_OTH_PEOPLE',
    countMap: { '1': 1, '2–5': 3, '6–10': 8, '10 or more': 10 },
  },
}

/**
 * @param {string} incidentType   Backend triage type code (MEDICAL/RTA/FIRE/SECURITY/DISASTER/OTHER)
 * @param {Array<{question_code:string, answer:string}>} triageResponses
 * @returns {{ peopleCount: number, recommendedAmbulances: number }}
 */
export function estimateAmbulanceNeed(incidentType, triageResponses) {
  const cfg = TYPE_CONFIG[(incidentType ?? '').toUpperCase()]
  if (!cfg || !Array.isArray(triageResponses)) {
    return { peopleCount: 0, recommendedAmbulances: 0 }
  }

  const answerFor = (code) => triageResponses.find((r) => r.question_code === code)?.answer
  const countAnswer = answerFor(cfg.countQuestion)
  const peopleCount = countAnswer != null ? (cfg.countMap[countAnswer] ?? 0) : 0

  return { peopleCount, recommendedAmbulances: ambulancesForCount(peopleCount) }
}
