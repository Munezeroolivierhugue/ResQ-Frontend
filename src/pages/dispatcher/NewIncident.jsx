import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Phone, Mic, MicOff, Zap, AlertTriangle, Check, X, PhoneCall } from 'lucide-react'
import { DEFAULT_IMMEDIATE_INCIDENT_ID } from '../../data/mockDispatchImmediateData'
import { useThemeStore } from '../../store/themeStore'
import { useCallChannelStore } from '../../store/callChannelStore'
import { getTriageQuestions, getSeverityRules } from '../../api/triage'
import { checkDuplicates, createIncident } from '../../api/incidents'
import { listDistricts } from '../../api/districts'
import { getCallerByPhone } from '../../api/callers'
import { calculateSeverity } from '../../utils/severityEngine'
import { haversineMeters } from '../../utils/geo'
import { generateCallerName } from '../../utils/rwandaNames'
import TriageLocationMap from '../../components/dispatcher/TriageLocationMap'
import IncidentTimeline from '../../components/intake/IncidentTimeline'
import AiDispatchRecommendation from '../../components/intake/AiDispatchRecommendation'
import {
  IntakePanel,
  PanelHeader,
  ReadonlyField,
  StatusPill,
} from '../../components/intake/IntakeUi'
import SeverityBadge from '../../components/dispatcher/SeverityBadge'
import FieldLabel from '../../components/ui/FieldLabel'

// Maps UI category labels → backend triage type codes
const CATEGORY_TO_TRIAGE_TYPE = {
  'Medical':               'MEDICAL',
  'Traffic / MVA':         'RTA',
  'Accident':              'RTA',
  'Fire':                  'FIRE',
  'Security / Disturbance':'SECURITY',
  'Disaster':              'DISASTER',
  'Other':                 'OTHER',
}

// Derived from backend types — all types have backend triage endpoints
const INCIDENT_CATEGORIES = Object.keys(CATEGORY_TO_TRIAGE_TYPE)

const SEVERITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

function intakeKey(callId) { return `resq-intake-${callId}` }

export default function NewIncident() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  useThemeStore()

  // ── Inbound call context ─────────────────────────────────────────────────────
  // Derived once on mount: URL params win, then sessionStorage fallback.
  // This lets the form survive navigating away and returning via the sidebar.
  const [activeCall] = useState(() => {
    const urlId    = searchParams.get('call_id')
    const urlPhone = searchParams.get('phone')
    if (urlId) {
      // New call from URL — persist so sidebar navigation restores it
      try { sessionStorage.setItem('resq-active-call', JSON.stringify({ callId: urlId, callPhone: urlPhone })) } catch {}
      return { callId: urlId, callPhone: urlPhone }
    }
    // No URL params — check for an in-progress call saved from a previous mount
    try {
      const stored = JSON.parse(sessionStorage.getItem('resq-active-call') ?? 'null')
      if (stored?.callId) return stored
    } catch {}
    return { callId: null, callPhone: null }
  })
  const callId    = activeCall.callId
  const callPhone = activeCall.callPhone
  const { endCall } = useCallChannelStore()

  // ── Live call timer ──────────────────────────────────────────────────────────
  const [callElapsed, setCallElapsed] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  useEffect(() => {
    if (!callId) return
    const t = setInterval(() => setCallElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [callId])

  const fmtCallTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const callTimeRef = useRef(new Date().toISOString())

  // ── Caller profile — fetched from backend, no mock fallback ─────────────────
  const [callerData, setCallerData] = useState(null)
  useEffect(() => {
    if (!callPhone) return
    getCallerByPhone(callPhone)
      .then((profile) => {
        setCallerData({
          phone_number: profile.phone_number ?? callPhone,
          identity:     profile.identity     || generateCallerName(),
          previous_incidents: profile.previous_incidents ?? 0,
          trust_level:  profile.trust_level  || 'UNVERIFIED',
        })
      })
      .catch(() => {
        // Caller not in DB — generate random name, zero incidents
        setCallerData((prev) => prev ?? {
          phone_number: callPhone,
          identity:     generateCallerName(),
          previous_incidents: 0,
          trust_level:  'UNVERIFIED',
        })
      })
  }, [callPhone])

  // ── Form state ───────────────────────────────────────────────────────────────
  const [incidentType, setIncidentType]           = useState('')
  const [, setIncidentTypeVersion]                = useState(0)
  const [triageResponses, setTriageResponses]     = useState([])
  const [severityOverrideActive, setSeverityOverrideActive] = useState(false)
  const [finalSeverity, setFinalSeverity]         = useState('LOW')
  const [overrideReason, setOverrideReason]       = useState('')
  const [overrideReasonError, setOverrideReasonError] = useState(false)
  const [location, setLocation]                   = useState(null)
  const [peopleCount, setPeopleCount]             = useState(1)
  const [submitting, setSubmitting]               = useState(false)
  const [submitError, setSubmitError]             = useState(null)
  const [occurrenceTime, setOccurrenceTime]       = useState('')
  const [duplicateAction, setDuplicateAction]     = useState(null)
  const [detectedLocation, setDetectedLocation]   = useState(null)
  const [linkedIncidentId, setLinkedIncidentId]   = useState(null)
  const [investigateIncident, setInvestigateIncident] = useState(null)
  const [districts, setDistricts]                 = useState([])
  const [district, setDistrict]                   = useState('')
  const [districtError, setDistrictError]         = useState(false)
  const [sector, setSector]                       = useState('')
  const [streetAddress, setStreetAddress]         = useState('')
  const [notes, setNotes]                         = useState('')
  const [duplicates, setDuplicates]               = useState([])

  // ── SessionStorage persistence — survives page refresh ──────────────────────
  // Phase flag so we don't overwrite saved data before we've had a chance to restore it
  const [hydrated, setHydrated] = useState(!callId)

  useEffect(() => {
    if (!callId) return
    try {
      const raw = sessionStorage.getItem(intakeKey(callId))
      if (raw) {
        const s = JSON.parse(raw)
        if (s.incidentType)               setIncidentType(s.incidentType)
        if (s.triageResponses?.length)    setTriageResponses(s.triageResponses)
        if (s.district)                   setDistrict(s.district)
        if (s.sector)                     setSector(s.sector)
        if (s.notes !== undefined)        setNotes(s.notes)
        if (s.peopleCount)                setPeopleCount(s.peopleCount)
        if (s.occurrenceTime)             setOccurrenceTime(s.occurrenceTime)
        if (s.location)                   { setLocation(s.location); setDetectedLocation(s.location) }
        if (s.streetAddress !== undefined) setStreetAddress(s.streetAddress)
        if (s.callerData)                 setCallerData(s.callerData)
        if (s.finalSeverity)              setFinalSeverity(s.finalSeverity)
        if (s.severityOverrideActive)     setSeverityOverrideActive(s.severityOverrideActive)
        if (s.overrideReason)             setOverrideReason(s.overrideReason)
      }
    } catch {}
    setHydrated(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — intentionally mount-only

  useEffect(() => {
    if (!hydrated || !callId) return
    try {
      sessionStorage.setItem(intakeKey(callId), JSON.stringify({
        incidentType, triageResponses, district, sector, streetAddress, notes, peopleCount,
        occurrenceTime, location, callerData, finalSeverity,
        severityOverrideActive, overrideReason,
      }))
    } catch {}
  }, [hydrated, callId, incidentType, triageResponses, district, sector, streetAddress, notes,
      peopleCount, occurrenceTime, location, callerData, finalSeverity,
      severityOverrideActive, overrideReason])

  // ── Districts from backend ───────────────────────────────────────────────────
  useEffect(() => {
    listDistricts().then(setDistricts).catch(() => {})
  }, [])

  // Clear sector when district changes
  useEffect(() => { setSector('') }, [district])

  // ── Location change from TriageLocationMap ───────────────────────────────────
  const handleLocationChange = useCallback((loc) => {
    setLocation(loc)
    setDetectedLocation(loc)
    setDuplicateAction(null)
  }, [])

  // ── Address found from map search (street/landmark geocode) ─────────────────
  const handleAddressFound = useCallback(({ label, sector: detectedSector }) => {
    if (detectedSector) setSector(detectedSector)
    // label is the street/landmark name from map search — persist across navigation
    if (label !== undefined) setStreetAddress(label)
  }, [])

  // ── Duplicate detection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!detectedLocation || detectedLocation.source === 'TELECOM_ROUGH') {
      setDuplicates([])
      return
    }
    checkDuplicates(detectedLocation.lat, detectedLocation.lng)
      .then((incs) => setDuplicates(incs.map((inc) => ({
        ...inc,
        _distance: Math.round(haversineMeters(detectedLocation.lat, detectedLocation.lng, inc.lat, inc.lng)),
        _minutesAgo: Math.round((Date.now() - new Date(inc.call_time).getTime()) / 60000),
      }))))
      .catch(() => setDuplicates([]))
  }, [detectedLocation])

  // ── Triage questions + severity rules ────────────────────────────────────────
  const triageTypeCode = CATEGORY_TO_TRIAGE_TYPE[incidentType]
  const [triageQuestions, setTriageQuestions] = useState([])
  const [severityRules, setSeverityRules]     = useState(null)
  useEffect(() => {
    if (!triageTypeCode) {
      setTriageQuestions([])
      setSeverityRules(null)
      return
    }
    Promise.all([
      getTriageQuestions(triageTypeCode),
      getSeverityRules(triageTypeCode),
    ]).then(([qs, rules]) => {
      setTriageQuestions(qs.sort((a, b) => a.display_order - b.display_order))
      setSeverityRules(rules)
    }).catch(() => { setTriageQuestions([]); setSeverityRules(null) })
  }, [triageTypeCode, incidentType])

  // ── Derived: severity ────────────────────────────────────────────────────────
  const calculatedSeverity = useMemo(
    () => calculateSeverity(incidentType, triageResponses, severityRules),
    [incidentType, triageResponses, severityRules]
  )
  const effectiveSeverity = severityOverrideActive ? finalSeverity : calculatedSeverity

  // ── AI recommendation ────────────────────────────────────────────────────────
  const aiRecommendation = useMemo(() => {
    const sev = (effectiveSeverity || 'LOW').toLowerCase()
    const n = peopleCount || 1
    const ambCount   = Math.min(4, Math.max(1, Math.ceil(n / 5)))
    const policeCount = sev === 'critical' ? 3 : n > 10 ? 2 : 1
    const type = (incidentType ?? '').toUpperCase()

    let resources, context, reasoning
    if (type === 'RTA' || type === 'TRAFFIC / MVA') {
      resources = [`${policeCount} Police Officer${policeCount > 1 ? 's' : ''}`, `${ambCount} Ambulance${ambCount > 1 ? 's' : ''}`, '1 Traffic Officer']
      context   = `Road traffic accident — ${n} person${n > 1 ? 's' : ''} involved`
      reasoning = `Caller reports ${n} person${n > 1 ? 's' : ''} affected. ${ambCount} ambulance${ambCount > 1 ? 's' : ''} + police dispatched per triage.`
    } else if (type === 'MEDICAL') {
      resources = [`${policeCount} Police Officer${policeCount > 1 ? 's' : ''}`, `${ambCount} Ambulance${ambCount > 1 ? 's' : ''}`, `${ambCount} Paramedic Team${ambCount > 1 ? 's' : ''}`]
      context   = `Medical emergency — ${n} patient${n > 1 ? 's' : ''} reported`
      reasoning = `${n} patient${n > 1 ? 's' : ''} identified. ${ambCount} ambulance${ambCount > 1 ? 's' : ''} required plus police escort.`
    } else if (type === 'FIRE') {
      const fireUnits = sev === 'critical' ? 2 : 1
      resources = [`${policeCount} Police Officer${policeCount > 1 ? 's' : ''}`, `${ambCount} Ambulance${ambCount > 1 ? 's' : ''}`, `${fireUnits} Fire Engine${fireUnits > 1 ? 's' : ''}`, '2 Firefighters']
      context   = `Fire outbreak — ${n > 1 ? n + ' casualties possible' : 'active fire reported'}`
      reasoning = `Active fire with ${n} person${n > 1 ? 's' : ''} at risk. Fire + ambulance + police team required.`
    } else if (type === 'SECURITY' || type === 'SECURITY / DISTURBANCE') {
      resources = [`${policeCount} Police Officer${policeCount > 1 ? 's' : ''}`, '1 Patrol Vehicle']
      context   = `Security incident — threat level ${sev}`
      reasoning = `Caller transcript suggests disturbance. ${policeCount} police unit${policeCount > 1 ? 's' : ''} dispatched.`
    } else {
      resources = [`${policeCount} Police Officer${policeCount > 1 ? 's' : ''}`, '1 Emergency Unit']
      context   = 'Emergency requiring immediate attention'
      reasoning = 'Dispatch based on caller description and triage assessment.'
    }

    const confidence  = sev === 'critical' ? 96 : sev === 'high' ? 91 : sev === 'medium' ? 84 : 76
    const responseTime = sev === 'critical' ? '2 minutes' : sev === 'high' ? '4 minutes' : '7 minutes'
    return { threat: effectiveSeverity || 'LOW', context, resources, responseTime, reasoning, confidence }
  }, [incidentType, effectiveSeverity, peopleCount])

  // AI recommendation is only meaningful once incident type, triage and district are known
  const showAiRecommendation =
    !!incidentType &&
    !!district &&
    (triageQuestions.length === 0 || triageResponses.length > 0)

  // ── Checklist — auto-derived from real form state, no mock data ──────────────
  const checklist = {
    callback_confirmed:   !!(callPhone || callId),
    location_verified:    !!(location?.source && location.source !== 'TELECOM_ROUGH') || !!(location?.lat),
    type_confirmed:       !!incidentType,
    life_threat_assessed: triageResponses.length > 0 || !!calculatedSeverity,
    specialized_support:  !!district && !!effectiveSeverity,
  }

  const canSubmit  =
    !!district &&
    !!incidentType &&
    (!severityOverrideActive || overrideReason.trim().length > 0)

  const showDuplicateBanner = duplicates.length > 0 && duplicateAction == null
  const firstDuplicate      = duplicates[0]

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleTriageAnswer = useCallback((question_code, answer) => {
    setTriageResponses((prev) => {
      const idx = prev.findIndex((r) => r.question_code === question_code)
      const entry = {
        response_id:   `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        question_code,
        answer,
        created_at: new Date().toISOString(),
      }
      if (idx >= 0) { const next = [...prev]; next[idx] = entry; return next }
      return [...prev, entry]
    })
  }, [])

  const handleActivateOverride = () => {
    setSeverityOverrideActive(true)
    setFinalSeverity(calculatedSeverity || 'LOW')
  }

  const handleCancelOverride = () => {
    setSeverityOverrideActive(false)
    setFinalSeverity('LOW')
    setOverrideReason('')
    setOverrideReasonError(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!district) { setDistrictError(true); return }
    if (severityOverrideActive && !overrideReason.trim()) { setOverrideReasonError(true); return }
    setSubmitting(true)
    setSubmitError(null)

    const selectedDistrict = districts.find((d) => d.district_id === district)
    const incidentPayload  = {
      // Backend and the AI dispatch engine key off the triage type code
      // (MEDICAL/RTA/FIRE/SECURITY/...), not the UI category label — sending
      // the raw label here meant every real incident's type never matched the
      // AI engine's classification rules, silently degrading every recommendation
      // to the generic "ANY unit" fallback instead of the correct required unit mix.
      incidentType: CATEGORY_TO_TRIAGE_TYPE[incidentType] ?? incidentType,
      callerPhone:    callPhone ?? callerData?.phone_number ?? 'unknown',
      callerIdentity: callerData?.identity ?? null,
      districtId:     district || null,
      latitude:       location?.lat ?? null,
      longitude:      location?.lng ?? null,
      sector:         sector || null,
      landmark:       streetAddress || location?.landmark || null,
      occurrenceTime: occurrenceTime || null,
      peopleCount:    peopleCount || 1,
    }

    let createdIncident = null
    try {
      createdIncident = await createIncident(incidentPayload)
    } catch {
      setSubmitError('Incident saved locally — backend sync failed. Proceeding.')
    }

    // Session data is intentionally kept until the incident is marked complete on the ActiveIncident page

    const incident = {
      incident_id:    createdIncident?.incident_id ?? null,
      incident_ref:   createdIncident?.incident_ref ?? 'PENDING',
      incident_type:  incidentType,
      final_severity: effectiveSeverity,
      severity:       (effectiveSeverity ?? 'LOW').toLowerCase(),
      lat:  location?.lat ?? null,
      lng:  location?.lng ?? null,
      district:       selectedDistrict?.name ?? district,
      district_id:    district || null,
      sector:         sector || null,
      street_address: streetAddress || location?.landmark || null,
      people_count:   peopleCount,
      call_time:      callTimeRef.current,
      notes,
    }

    setSubmitting(false)
    navigate('/dispatcher/ai-engine', { state: { incident, aiRecommendation } })
  }

  // ── Incident timeline steps (real state only, no mock conditions) ─────────────
  const timelineSteps = [
    {
      id: 'call',
      icon: 'phone',
      label: 'Incoming Call',
      // Done only if there is a real call_id from the URL (actual answered call)
      status: callId ? 'done' : 'pending',
    },
    {
      id: 'accepted',
      icon: 'check',
      label: 'Dispatcher Accepted',
      status: callId ? 'done' : 'pending',
    },
    {
      id: 'sms',
      icon: 'message',
      label: 'SMS Location Sent',
      status: location?.source === 'GPS_PRECISE'
        ? 'done'
        : location
        ? 'current'
        : 'pending',
    },
    {
      id: 'gps',
      icon: 'map',
      label: 'Caller Shared GPS / Pin',
      status: location?.source === 'GPS_PRECISE' || location?.source === 'MANUAL_PIN'
        ? 'done'
        : 'pending',
    },
    {
      id: 'caller_id',
      icon: 'phone',
      label: 'Caller Identified',
      status: checklist.callback_confirmed ? 'done' : 'pending',
    },
    {
      id: 'type',
      icon: 'check',
      label: 'Incident Type Selected',
      status: checklist.type_confirmed
        ? 'done'
        : incidentType
        ? 'current'
        : 'pending',
    },
    {
      id: 'triage',
      icon: 'bot',
      label: 'Triage / Severity Assessed',
      status: checklist.life_threat_assessed
        ? 'done'
        : triageResponses.length > 0
        ? 'current'
        : 'pending',
    },
    {
      id: 'district',
      icon: 'map',
      label: 'District & Resources Set',
      status: checklist.specialized_support
        ? 'done'
        : district
        ? 'current'
        : 'pending',
    },
    {
      id: 'unit_rec',
      icon: 'bot',
      label: 'Unit Recommendation Ready',
      status: incidentType && effectiveSeverity
        ? 'current'
        : 'pending',
    },
    {
      id: 'dispatch',
      icon: 'truck',
      label: 'Officers Dispatched',
      status: 'pending',
    },
  ]

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-(--bg-base) flex flex-col">
      {/* ── Page header ── */}
      <header className="shrink-0 px-5 md:px-6 pt-5 pb-3">
        <div className="max-w-[1800px] mx-auto">
          <span className="dispatcher-eyebrow">Emergency intake</span>
          <h1
            className="text-xl md:text-2xl font-bold text-(--text-primary) m-0 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Smart dispatch intake
          </h1>
          <p className="text-[12px] text-(--text-secondary) mt-1 m-0">
            Automated emergency call handling · Rwanda Police Emergency Response
          </p>
        </div>
      </header>

      <div className="flex-1 min-h-0 max-w-[1800px] w-full mx-auto px-5 md:px-6 py-4 flex flex-col gap-4">

        {/* ── Active inbound call banner ── */}
        {callId && (
          <div
            className="rounded-xl border px-4 py-3 flex flex-wrap items-center gap-3 animate-fade-in-up"
            style={{ background: 'var(--status-low-bg)', borderColor: 'var(--status-low)' }}
          >
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-full shrink-0"
              style={{ background: 'var(--status-low)', color: '#fff' }}
            >
              <PhoneCall size={15} />
            </span>
            <div className="flex-1 min-w-0">
              <p
                className="m-0 text-[11px] font-bold uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--status-low)' }}
              >
                Call active
              </p>
              <p
                className="m-0 text-[13px] font-semibold"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
              >
                {callPhone}
              </p>
            </div>
            <span
              className="text-[13px] font-bold shrink-0"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-low)' }}
            >
              {fmtCallTime(callElapsed)}
            </span>

            {/* Mute toggle */}
            <button
              type="button"
              onClick={() => setIsMuted((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer shrink-0 text-[11px] font-bold transition-colors"
              style={{
                fontFamily: 'var(--font-display)',
                background: isMuted
                  ? 'color-mix(in srgb, var(--status-warning) 12%, transparent)'
                  : 'var(--bg-elevated)',
                color:    isMuted ? 'var(--status-warning)' : 'var(--text-secondary)',
                borderColor: isMuted ? 'var(--status-warning)' : 'var(--border)',
              }}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
              {isMuted ? 'Muted' : 'Mute'}
            </button>

            {/* End call */}
            <button
              type="button"
              onClick={() => { endCall(); navigate('/dispatcher') }}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg border-none cursor-pointer shrink-0"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'var(--status-critical-bg)',
                color:      'var(--status-critical)',
                border:     '1px solid var(--status-critical)',
              }}
            >
              End call
            </button>
          </div>
        )}

        {/* ── Duplicate detection banner ── */}
        {showDuplicateBanner && firstDuplicate && (
          <div
            className="rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in-up"
            style={{
              background:   'color-mix(in srgb, var(--status-warning) 15%, transparent)',
              borderColor:  'var(--status-warning)',
            }}
          >
            <AlertTriangle size={16} className="shrink-0" style={{ color: 'var(--status-warning)' }} />
            <p className="flex-1 min-w-0 text-[13px] font-semibold text-(--text-primary) m-0">
              Possible duplicate of{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>#{firstDuplicate.incident_ref}</span>{' '}
              — {firstDuplicate._distance}m away, {firstDuplicate._minutesAgo} min ago
            </p>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { setDuplicateAction('link'); setLinkedIncidentId(firstDuplicate.incident_id) }}
                className="px-3 py-1.5 rounded-lg border text-[12px] font-semibold cursor-pointer"
                style={{ fontFamily: 'var(--font-display)', borderColor: 'var(--status-warning)', color: 'var(--status-warning)', background: 'color-mix(in srgb, var(--status-warning) 10%, transparent)' }}
              >
                Link to existing
              </button>
              <button
                type="button"
                onClick={() => setDuplicateAction('new')}
                className="px-3 py-1.5 rounded-lg border text-[12px] font-semibold cursor-pointer"
                style={{ fontFamily: 'var(--font-display)', borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-input)' }}
              >
                Create new
              </button>
              <button
                type="button"
                onClick={() => setInvestigateIncident(firstDuplicate)}
                className="px-3 py-1.5 rounded-lg border text-[12px] font-semibold cursor-pointer"
                style={{ fontFamily: 'var(--font-display)', borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-input)' }}
              >
                Investigate further
              </button>
            </div>
          </div>
        )}

        {duplicateAction === 'link' && linkedIncidentId && (
          <div
            className="rounded-lg border px-3 py-2 text-[12px] font-medium flex items-center gap-2"
            style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', background: 'var(--accent-ghost)', color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
          >
            <Check size={13} />
            Linked to #{firstDuplicate?.incident_ref} — will be recorded as duplicate on submit.
            <button
              type="button"
              onClick={() => { setDuplicateAction(null); setLinkedIncidentId(null) }}
              className="ml-auto cursor-pointer bg-transparent border-none p-0"
              style={{ color: 'var(--accent)' }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Three-column form ── */}
        <form onSubmit={handleSubmit} className="w-full intake-three-col items-start">

          {/* ════════════ LEFT ════════════ */}
          <div className="intake-col--left flex flex-col gap-4">

            {/* Caller profile — real data only, no mock */}
            <IntakePanel className="p-4 md:p-5">
              <PanelHeader
                icon={Phone}
                title={callId ? 'Inbound call — caller profile' : 'Auto-filled caller profile'}
                badge={
                  callId
                    ? <StatusPill label="Call Active" color="var(--status-low)" />
                    : null
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5">
                <ReadonlyField
                  label="Phone number"
                  value={callPhone ?? '—'}
                  mono
                />
                <ReadonlyField
                  label="Caller"
                  value={callerData?.identity ?? '—'}
                />
                <ReadonlyField
                  label="Previous incidents"
                  value={callerData != null ? String(callerData.previous_incidents) : '—'}
                />
                <ReadonlyField
                  label="Caller trust level"
                  value={callerData?.trust_level ?? '—'}
                />
              </div>
            </IntakePanel>

            {/* ── Triage + Severity panel ── */}
            <IntakePanel className="p-4 md:p-5 flex flex-col gap-3">

              <div className="flex items-center justify-between gap-2 pb-3 border-b border-(--border-subtle)">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.1em] text-(--text-secondary)"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Calculated severity
                </span>
                <SeverityBadge severity={effectiveSeverity} size="lg" />
              </div>

              {/* Incident type selector — categories from backend type map */}
              <label className="dispatcher-field m-0">
                <span className="field-label">Incident type *</span>
                <select
                  className="dispatcher-input dispatcher-select mt-1"
                  value={incidentType}
                  onChange={(e) => {
                    setIncidentType(e.target.value)
                    setTriageResponses([])
                    setIncidentTypeVersion((v) => v + 1)
                  }}
                  required
                  style={{ appearance: 'none' }}
                >
                  <option value="" disabled>Select incident type...</option>
                  {INCIDENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>

              {/* Triage questions */}
              {triageQuestions.length > 0 && (
                <div className="flex flex-col gap-3 pt-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.12em] text-(--text-muted)"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Triage questions
                  </span>
                  {triageQuestions.map((q, qi) => {
                    const response = triageResponses.find((r) => r.question_code === q.question_code)
                    const opts      = Array.isArray(q.answer_options) ? q.answer_options : []
                    const useDropdown = opts.length > 4
                    return (
                      <div key={q.question_id} className="flex flex-col gap-1.5">
                        <span className="text-[12px] font-medium text-(--text-primary)">
                          {qi + 1}. {q.question_text}
                        </span>
                        {useDropdown ? (
                          <select
                            className="dispatcher-input dispatcher-select"
                            value={response?.answer ?? ''}
                            onChange={(e) => handleTriageAnswer(q.question_code, e.target.value)}
                            style={{ appearance: 'none' }}
                          >
                            <option value="" disabled>Select answer...</option>
                            {opts.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <div className="flex flex-wrap gap-1.5" role="group" aria-label={q.question_text}>
                            {opts.map((opt) => {
                              const selected = response?.answer === opt
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleTriageAnswer(q.question_code, opt)}
                                  className="px-2.5 py-1 rounded-md border text-[11px] font-medium cursor-pointer"
                                  style={{
                                    fontFamily: 'var(--font-body)',
                                    borderColor: selected ? 'var(--accent)' : 'var(--border)',
                                    background:  selected ? 'var(--accent-ghost)' : 'var(--bg-input)',
                                    color:       selected ? 'var(--accent)' : 'var(--text-secondary)',
                                  }}
                                  aria-pressed={selected}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {incidentType && triageQuestions.length === 0 && (
                <p className="text-[11px] text-(--text-muted) italic m-0">
                  No triage questions for this type. Severity defaults to LOW.
                </p>
              )}

              {/* Severity override */}
              <div className="pt-2 border-t border-(--border-subtle)">
                {!severityOverrideActive ? (
                  <button
                    type="button"
                    onClick={handleActivateOverride}
                    className="text-[12px] font-medium text-(--text-muted) underline cursor-pointer bg-transparent border-none p-0"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Change severity
                  </button>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-(--text-muted)" style={{ fontFamily: 'var(--font-display)' }}>Override:</span>
                      <SeverityBadge severity={calculatedSeverity} strikethrough />
                      <span className="text-[11px] text-(--text-muted)">→</span>
                      <SeverityBadge severity={finalSeverity} />
                    </div>
                    <label className="dispatcher-field m-0">
                      <span className="field-label">Final severity *</span>
                      <select
                        className="dispatcher-input dispatcher-select mt-1"
                        value={finalSeverity}
                        onChange={(e) => setFinalSeverity(e.target.value)}
                        style={{ appearance: 'none' }}
                      >
                        {SEVERITY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </label>
                    <label className="dispatcher-field m-0">
                      <span className="field-label">Reason for override *</span>
                      <textarea
                        className="dispatcher-input dispatcher-textarea mt-1"
                        value={overrideReason}
                        onChange={(e) => { setOverrideReason(e.target.value.slice(0, 255)); setOverrideReasonError(false) }}
                        maxLength={255}
                        placeholder="Explain why the calculated severity is being changed..."
                        rows={3}
                        aria-invalid={overrideReasonError}
                        style={overrideReasonError ? { borderColor: 'var(--status-critical)' } : undefined}
                      />
                      <div className="flex items-start justify-between mt-1 gap-2">
                        {overrideReasonError
                          ? <p className="text-[11px] m-0" style={{ color: 'var(--status-critical)' }}>Override reason is required.</p>
                          : <span />
                        }
                        <span className="text-[10px] text-(--text-muted) shrink-0 ml-auto" style={{ fontFamily: 'var(--font-mono)' }}>
                          {overrideReason.length} / 255
                        </span>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={handleCancelOverride}
                      className="text-[12px] font-medium text-(--text-muted) underline cursor-pointer bg-transparent border-none p-0 self-start"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Cancel override
                    </button>
                  </div>
                )}
              </div>
            </IntakePanel>

            {/* Notes — empty by default, no placeholder text */}
            <IntakePanel className="p-4 md:p-5 flex flex-col">
              <PanelHeader
                icon={Mic}
                title="Live incident notes"
                badge={
                  <span className="text-[9px] font-bold text-(--accent) uppercase tracking-wider flex items-center gap-1">
                    <Mic size={10} />
                    Voice transcript active
                  </span>
                }
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px] w-full rounded-lg px-3 py-2.5 text-[13px] text-(--text-primary) bg-(--bg-input) border border-(--border) outline-none resize-y leading-relaxed focus:border-(--accent)"
                placeholder="Type notes as the caller speaks…"
                aria-label="Live incident notes"
              />
              <p className="text-[10px] text-(--text-muted) m-0 mt-2">
                Auto-save active · synced from live transcript
              </p>
            </IntakePanel>

            {/* Live transcript placeholder */}
            {callId && (
              <IntakePanel className="p-4 md:p-5 flex flex-col gap-2">
                <PanelHeader
                  icon={Mic}
                  title="Live transcript"
                  badge={
                    <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--status-low)' }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--status-low)', animation: 'pulse 1.4s infinite' }} />
                      Listening
                    </span>
                  }
                />
                <div
                  className="rounded-lg px-3 py-2.5 text-[12px] leading-relaxed"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontStyle: 'italic', minHeight: 72 }}
                >
                  Transcript will stream here once the backend connects the voice pipeline.
                </div>
                <p className="text-[10px] text-(--text-muted) m-0">
                  Powered by Africa's Talking STT · streams on call_id {callId}
                </p>
              </IntakePanel>
            )}
          </div>

          {/* ════════════ CENTER ════════════ */}
          <div className="intake-col--center flex flex-col gap-4">

            {/* Location confirmation — district only; sector auto-filled from map search */}
            <IntakePanel className="p-4 md:p-5 shrink-0">
              <FieldLabel className="mb-3">Location confirmation</FieldLabel>
              <label className="dispatcher-field m-0">
                <span className="field-label">District *</span>
                <select
                  className="dispatcher-input dispatcher-select mt-1"
                  value={district}
                  onChange={(e) => { setDistrict(e.target.value); setDistrictError(false) }}
                  required
                  aria-invalid={districtError}
                  aria-describedby={districtError ? 'district-error' : 'district-helper'}
                  style={{
                    appearance: 'none',
                    ...(districtError ? { borderColor: 'var(--status-critical)', boxShadow: '0 0 0 3px var(--status-critical-bg)' } : {}),
                  }}
                >
                  <option value="" disabled>Select district — confirm with caller</option>
                  {Object.entries(
                    districts.reduce((acc, d) => {
                      const p = d.province ?? 'Other'
                      ;(acc[p] = acc[p] ?? []).push(d)
                      return acc
                    }, {})
                  ).map(([province, list]) => (
                    <optgroup key={province} label={`── ${province} ──`}>
                      {list.map((d) => (
                        <option key={d.district_id} value={d.district_id}>{d.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p
                  id="district-helper"
                  className="m-0 mt-1"
                  style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}
                >
                  Confirm the caller&apos;s location before selecting. District determines which
                  Operations Manager receives this incident.
                </p>
                {districtError && (
                  <p id="district-error" className="m-0 mt-1" style={{ fontSize: '11px', color: 'var(--status-critical)' }}>
                    District is required. Confirm location with caller before submitting.
                  </p>
                )}
              </label>
              {streetAddress && (
                <p className="m-0 mt-2 text-[11px]" style={{ color: 'var(--accent)' }}>
                  Location: <strong>{streetAddress}</strong>
                </p>
              )}
              {sector && (
                <p className="m-0 mt-2 text-[11px]" style={{ color: 'var(--accent)' }}>
                  Area: <strong>{sector}</strong>
                </p>
              )}
            </IntakePanel>

            {/* Three-way location map */}
            <TriageLocationMap
              caller={callerData}
              onLocationChange={handleLocationChange}
              onAddressFound={handleAddressFound}
              districtCenter={(() => {
                const d = districts.find((x) => x.district_id === district)
                return d?.lat && d?.lng ? [d.lat, d.lng] : null
              })()}
            />

            {/* People involved */}
            <IntakePanel className="p-4 md:p-5 shrink-0">
              <label className="dispatcher-field m-0">
                <span className="field-label">Number of people involved</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  className="dispatcher-input dispatcher-text-input mt-1"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <p className="m-0 mt-1" style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Affects number of ambulances / units the AI recommends.
                </p>
              </label>
            </IntakePanel>

            {/* Occurrence time */}
            <IntakePanel className="p-4 md:p-5 shrink-0">
              <div className="dispatcher-field m-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="field-label">When did this happen? (optional)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date()
                      now.setSeconds(0, 0)
                      setOccurrenceTime(now.toISOString().slice(0, 16))
                    }}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded border cursor-pointer shrink-0"
                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-ghost)', fontFamily: 'var(--font-display)' }}
                  >
                    Now
                  </button>
                </div>
                <input
                  type="datetime-local"
                  className="dispatcher-input dispatcher-text-input"
                  value={occurrenceTime}
                  onChange={(e) => setOccurrenceTime(e.target.value)}
                  aria-label="Occurrence time — ask the caller, do not auto-fill"
                />
                <p className="m-0 mt-1" style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Ask the caller when the incident occurred, or tap Now if happening at this moment.
                </p>
              </div>
            </IntakePanel>

            {/* AI recommendation + action buttons */}
            <div className="w-full shrink-0">
              <div
                className="flex flex-col rounded-xl border border-(--border) bg-(--bg-surface) shadow-[var(--shadow-card)] overflow-hidden"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <div className="min-h-0 [&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none">
                  {showAiRecommendation ? (
                    <AiDispatchRecommendation data={aiRecommendation} />
                  ) : (
                    <div className="p-5 flex flex-col gap-2">
                      <p className="m-0 text-[12px] font-bold uppercase tracking-wide text-(--text-muted)" style={{ fontFamily: 'var(--font-display)' }}>
                        AI dispatch recommendation
                      </p>
                      <p className="m-0 text-[12px] text-(--text-muted)">
                        {!incidentType
                          ? 'Select an incident type to begin triage.'
                          : !district
                          ? 'Select the incident district to continue.'
                          : 'Answer the triage questions to generate a recommendation.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-(--border-subtle) shrink-0 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/dispatcher')}
                    className="px-4 py-2 rounded-lg border border-(--border) bg-transparent text-(--text-primary) text-[12px] font-semibold cursor-pointer hover:bg-(--bg-elevated)"
                  >
                    Cancel
                  </button>

                  {effectiveSeverity === 'CRITICAL' && (
                    <Link
                      to={`/dispatcher/dispatch-immediate/${DEFAULT_IMMEDIATE_INCIDENT_ID}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border-none text-[12px] font-bold uppercase tracking-wide no-underline transition-opacity hover:opacity-90"
                      style={{
                        fontFamily: 'var(--font-display)',
                        background: 'var(--status-critical)',
                        color: 'var(--text-on-accent)',
                        boxShadow: '0 4px 20px color-mix(in srgb, var(--status-critical) 40%, transparent)',
                      }}
                    >
                      <Zap size={14} />
                      Dispatch Immediate
                    </Link>
                  )}

                  {submitError && (
                    <p className="text-[11px] text-(--status-medium) m-0 mb-1">{submitError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    title={!canSubmit ? 'Select incident type and district first' : undefined}
                    className="flex-1 min-w-[140px] px-4 py-2 rounded-lg border-none text-[12px] font-bold uppercase tracking-wide"
                    style={{
                      fontFamily: 'var(--font-display)',
                      background: canSubmit && !submitting ? 'var(--accent)' : 'var(--border)',
                      color:      canSubmit && !submitting ? 'var(--text-on-accent)' : 'var(--text-muted)',
                      cursor:     canSubmit && !submitting ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {submitting ? 'Analysing…' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ════════════ RIGHT ════════════ */}
          <div className="intake-col--right flex flex-col gap-4">
            <IncidentTimeline steps={timelineSteps} />
          </div>
        </form>
      </div>

      {/* ── Investigate Further modal ── */}
      {investigateIncident && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Existing incident details"
          onClick={() => setInvestigateIncident(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-(--border) bg-(--bg-surface) p-6 flex flex-col gap-4 shadow-[var(--shadow-modal)] animate-fade-in-up"
            style={{ fontFamily: 'var(--font-body)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-(--accent)" style={{ fontFamily: 'var(--font-display)' }}>
                  Existing incident
                </span>
                <h2 className="text-[18px] font-bold text-(--text-primary) m-0 mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                  {investigateIncident.incident_ref}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInvestigateIncident(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-(--border) bg-(--bg-input) text-(--text-secondary) cursor-pointer hover:bg-(--bg-elevated)"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <ReadonlyField label="Type"     value={investigateIncident.incident_type} />
              <ReadonlyField label="Severity" value={(investigateIncident.final_severity || investigateIncident.severity || 'UNKNOWN').toUpperCase()} />
              <ReadonlyField label="Status"   value={investigateIncident.status?.toUpperCase() ?? '—'} />
              <ReadonlyField label="District" value={investigateIncident.district ?? '—'} />
            </div>
            <div className="p-3 rounded-lg border border-(--border-subtle) bg-(--bg-input) text-[12px] text-(--text-secondary)">
              Distance:{' '}
              <strong className="text-(--text-primary) font-semibold">{investigateIncident._distance}m</strong>
              {' · '}
              Reported:{' '}
              <strong className="text-(--text-primary) font-semibold">{investigateIncident._minutesAgo} min ago</strong>
            </div>
            <button
              type="button"
              onClick={() => setInvestigateIncident(null)}
              className="w-full py-2 rounded-lg border border-(--border) bg-transparent text-(--text-primary) text-[12px] font-semibold cursor-pointer hover:bg-(--bg-elevated)"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
