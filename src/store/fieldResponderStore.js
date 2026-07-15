import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mockUnifiedComms } from '../data/mockUnifiedComms'
import { FR_OFFICER, FR_ASSIGNMENT } from '../data/mockFieldResponderData'
import { generateUuid, yesNoToBoolean } from '../utils/formHelpers'
import { recordGpsPing, updateVehicleStatus, getVehicle } from '../api/vehicles'
import { submitFieldReport } from '../api/fieldReports'
import { updateIncidentStatus, getIncident } from '../api/incidents'
import { listDispatchesForIncident, getMyDispatches } from '../api/dispatches'
import { getAccessToken, getCurrentUser } from '../utils/authSession'

const STAGES = ['dispatched', 'en_route', 'on_scene', 'incident_clear']
const MOCK_VEHICLE_ID = FR_OFFICER.vehicle_id  // placeholder — never send to real API

let gpsIntervalId = null
let geoWatchId = null
let latestGeo = null // { lat, lng } — updated live by the browser's real geolocation

// Previously the periodic ping sent a purely synthetic random walk starting
// from a fixed mock coordinate (FR_OFFICER.current_lat/lng), completely
// disconnected from the officer's real position — meanwhile FRNavigation.jsx
// separately reads real browser geolocation for its own map. Those two never
// agreed, which is why the dispatcher's Active Incident map and Admin Unit
// Management (both driven by these pings) could show a unit in a totally
// different district than where the field responder — and the incident
// itself — actually was. Pinging from the same real geolocation the
// responder's own screen uses keeps every screen consistent.
function startGeoWatch() {
  if (geoWatchId != null || !navigator.geolocation) return
  geoWatchId = navigator.geolocation.watchPosition(
    (pos) => { latestGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude } },
    () => {},
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 },
  )
}

function stopGeoWatch() {
  if (geoWatchId != null) navigator.geolocation.clearWatch(geoWatchId)
  geoWatchId = null
  latestGeo = null
}

function startGpsInterval() {
  if (gpsIntervalId) return
  startGeoWatch()
  gpsIntervalId = setInterval(() => {
    const { gpsActive, vehicleId } = useFieldResponderStore.getState()
    if (!gpsActive) { stopGpsInterval(); return }
    if (!getAccessToken()) return
    // Only ping when we have a real vehicle ID assigned — skip mock placeholder
    if (!vehicleId || vehicleId === MOCK_VEHICLE_ID) return
    // No real fix yet — skip this tick rather than send a fabricated position
    if (!latestGeo) return
    recordGpsPing(vehicleId, latestGeo.lat, latestGeo.lng).catch(() => {})
  }, 30000)
}

function stopGpsInterval() {
  clearInterval(gpsIntervalId)
  gpsIntervalId = null
  stopGeoWatch()
}

function buildDescription(form) {
  const parts = [form.description || '']
  if (form.actions) parts.push(`\nActions taken:\n${form.actions}`)
  parts.push(`\nAdditional support needed: ${form.supportNeeded || 'NO'}`)
  if (form.followUp) parts.push(`\nRecommended follow-up:\n${form.followUp}`)
  return parts.join('')
}

export const useFieldResponderStore = create(
  persist(
    (set, get) => ({
      vehicleId: null,        // set via setVehicleId() when shift is started with a real vehicle
      incidentId: null,       // set via setIncidentId() when a dispatch assignment arrives
      assignment: null,       // { incident, dispatch, otherDispatches } — live, not persisted
      gpsActive: true,
      dutyStatus: 'offline',
      assignmentStage: 'dispatched',
      hasActiveAssignment: false,
      messages: [...mockUnifiedComms],
      reportSubmitted: false,
      outstandingReports: [],
      toast: null,
      sessionUserId: null,    // whose account this persisted state belongs to — see checkSessionOwner()

      setVehicleId: (vehicleId) => set({ vehicleId }),
      setIncidentId: (incidentId) => set({ incidentId }),
      setAssignment: (assignment) => set({ assignment }),
      setGpsActive: (gpsActive) => set({ gpsActive }),

      goAvailable: async () => {
        const { vehicleId } = get()
        set({ dutyStatus: 'available', gpsActive: true })
        startGpsInterval()
        if (vehicleId && vehicleId !== MOCK_VEHICLE_ID) {
          try {
            const v = await getVehicle(vehicleId)
            const alreadyActive = ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE'].includes((v.status ?? '').toUpperCase())
            if (!alreadyActive) updateVehicleStatus(vehicleId, 'available').catch(() => {})
            // A vehicle's current_lat/current_lng is meant to be live-tracked
            // GPS, but it can go stale or wrong between shifts (e.g. it was
            // last pinged from wherever the previous device's geolocation
            // happened to resolve, which may have nothing to do with this
            // vehicle's actual home district). Snapping to the station's
            // fixed, correct coordinates at the start of every shift is the
            // real-world-accurate behavior anyway — a unit starts its shift
            // at its station — and keeps the dispatcher's map from showing
            // a unit in the wrong district before its first real GPS fix.
            if (v.station_lat != null && v.station_lng != null) {
              recordGpsPing(vehicleId, v.station_lat, v.station_lng).catch(() => {})
            }
          } catch {
            // Can't fetch vehicle — attempt status update anyway
            updateVehicleStatus(vehicleId, 'available').catch(() => {})
          }
        }
      },

      // Poll for dispatches assigned to this responder
      pollForAssignment: async () => {
        const { assignment } = get()
        if (assignment) return   // already have one
        try {
          const dispatches = await getMyDispatches()
          // Most-recent-first so an older dispatch can't shadow a newer one if
          // the backend doesn't already return them in that order.
          const candidates = [...dispatches].sort(
            (a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0)
          )
          // A dispatch is "current" for the responder up until they submit
          // their field report — once the incident reaches PENDING_REPORT
          // (set by the backend as a side effect of that submission) or
          // beyond, the ball is in the dispatcher's court for closure, and
          // this responder has nothing left to do. Previously only CLOSED
          // counted as terminal here, which is why submitReport() used to
          // force the incident straight to CLOSED itself (to stop it from
          // reappearing as "active") — but that skipped the dispatcher's own
          // review+closure step entirely, since by the time they opened the
          // closure form the incident was already CLOSED and the backend
          // correctly rejected it (closure requires RESOLVED/PENDING_REPORT).
          const RESPONDER_DONE_STATUSES = new Set(['PENDING_REPORT', 'RESOLVED', 'CLOSED'])
          let active = null
          let inc = null
          for (const candidate of candidates) {
            try {
              const candidateIncident = await getIncident(candidate.incident_id)
              if (!RESPONDER_DONE_STATUSES.has(candidateIncident?.status)) {
                active = candidate
                inc = candidateIncident
                break
              }
            } catch { /* skip this candidate, try the next */ }
          }
          if (!active) return
          const sibling = await listDispatchesForIncident(active.incident_id)
          set({
            incidentId: active.incident_id,
            hasActiveAssignment: true,
            assignment: {
              incident: inc,
              dispatch: active,
              otherDispatches: sibling.filter(d => d.dispatch_id !== active.dispatch_id),
            },
          })
        } catch { /* silent — will retry on next poll */ }
      },

      acceptAssignment: () => {
        const { incidentId } = get()
        set({ assignmentStage: 'en_route', dutyStatus: 'available' })
        if (incidentId) updateIncidentStatus(incidentId, 'EN_ROUTE').catch(() => {})
      },
      markOnScene: async () => {
        const { incidentId, vehicleId, assignment } = get()
        set({ assignmentStage: 'on_scene', dutyStatus: 'on_scene' })
        if (incidentId) updateIncidentStatus(incidentId, 'ON_SCENE').catch(() => {})
        // The periodic GPS interval is pure random jitter around wherever it
        // started (it has no notion of a destination) and keeps its own
        // lat/lng closure state independent of this snap — previously it
        // kept firing every 30s afterward, sending a stale jittered position
        // that visibly dragged the dispatcher's map pin away from the
        // incident again a moment after arriving. Stop it here so the pin
        // stays put for the whole on-scene phase; it resumes (from a fresh
        // position) once the responder is free to move again — see
        // submitReport()/clearIncident().
        stopGpsInterval()
        // Prefer the responder's own live GPS fix (`latestGeo`, kept current
        // by startGeoWatch() the whole time gpsActive) over the incident's
        // static coordinates — it's literally where they're standing when
        // they press this button.
        let lat = latestGeo?.lat ?? assignment?.incident?.lat
        let lng = latestGeo?.lng ?? assignment?.incident?.lng
        // Both can still be missing — `assignment.incident` is whatever the
        // store happened to be populated with (WS push vs polling fallback
        // take different paths) and isn't guaranteed to carry a location at
        // this exact moment. Previously that silently left the vehicle at
        // whatever position it already had (e.g. still its home station from
        // shift start, or nothing at all), so the status flipped to ON_SCENE
        // but the pin never moved. Re-fetching the incident directly here
        // guarantees a real location as long as the incident has one at all.
        if ((lat == null || lng == null) && incidentId) {
          try {
            const inc = await getIncident(incidentId)
            lat = lat ?? inc?.lat
            lng = lng ?? inc?.lng
          } catch { /* fall through with whatever we already had */ }
        }
        if (vehicleId && vehicleId !== MOCK_VEHICLE_ID && lat != null && lng != null) {
          recordGpsPing(vehicleId, lat, lng).catch(() => {})
        }
        // The vehicle's own status row was never transitioned to ON_SCENE
        // here — only the incident's status was updated, and a GPS ping only
        // touches lat/lng, not status. Dispatcher screens read the vehicle's
        // live status (not the incident's), so units never visibly turned
        // "On Scene" there even though the incident itself had moved on.
        if (vehicleId && vehicleId !== MOCK_VEHICLE_ID) {
          updateVehicleStatus(vehicleId, 'on_scene', lat, lng).catch(() => {})
        }
      },
      clearIncident: async () => {
        const { incidentId } = get()
        // Not currently wired to any button (the "Incident Clear" UI action
        // actually calls updateIncidentStatus + submitReport directly) — kept
        // consistent with the other status-transition actions in case it's
        // used directly in the future, so it doesn't silently regress into
        // the local-only-reset bug that caused incidents to never close.
        if (incidentId) await updateIncidentStatus(incidentId, 'CLOSED').catch(() => {})
        set({
          incidentId: null,
          assignmentStage: 'incident_clear',
          dutyStatus: 'available',
          hasActiveAssignment: false,
          assignment: null,
        })
        // markOnScene() froze the GPS interval so the pin would hold at the
        // incident until it fully closed — resume live tracking now that
        // it has.
        if (get().gpsActive) startGpsInterval()
      },
      // Non-police responders never file a field report (only RNP units do —
      // see canFileFieldReports()), so submitReport()'s state reset never
      // runs for them. Without this, after they mark an incident RESOLVED
      // the store kept pointing at that now-finished incident (stale
      // incidentId/assignment/hasActiveAssignment), so the assignment screen
      // kept showing it instead of a clean "no active assignment" state.
      clearAssignmentLocal: () => {
        set({
          reportSubmitted: false,
          dutyStatus: 'available',
          assignmentStage: 'incident_clear',
          hasActiveAssignment: false,
          incidentId: null,
          assignment: null,
        })
        if (get().gpsActive) startGpsInterval()
      },
      endShift: () => {
        stopGpsInterval()
        set({ dutyStatus: 'offline', gpsActive: false, hasActiveAssignment: false, assignmentStage: 'dispatched', assignment: null })
      },
      submitReport: async (form) => {
        const { vehicleId, incidentId } = get()
        const user = getCurrentUser()
        if (!incidentId) throw new Error('No active incident — cannot submit report.')
        if (!vehicleId || vehicleId === MOCK_VEHICLE_ID) throw new Error('No real vehicle assigned — cannot submit report.')
        const payload = {
          report_id: generateUuid(),
          incident_id: incidentId,
          vehicle_id: vehicleId,
          responder_id: user?.user_id || null,
          persons_involved: parseInt(form.persons, 10) || 0,
          injuries: yesNoToBoolean(form.injuries),
          suspects: yesNoToBoolean(form.suspects),
          scene_status: form.sceneStatus,
          confirmed_type: form.incidentType || null,
          description: buildDescription(form),
          agencies_involved: form.agencies?.join(', ').slice(0, 255) || null,
          case_reference: form.caseReference || null,
          entry_method: 'STRUCTURED',
          submitted_at: new Date().toISOString(),
        }
        const saved = await submitFieldReport(payload)
        // The backend moves the incident to PENDING_REPORT as a side effect
        // of saving the report — that's the correct terminal state from the
        // responder's side. This used to also force-close the incident
        // straight to CLOSED to stop it reappearing in pollForAssignment(),
        // but that skipped the dispatcher's own review-and-closure step
        // entirely (the closure form requires RESOLVED/PENDING_REPORT and
        // was finding the incident already CLOSED). pollForAssignment() now
        // treats PENDING_REPORT itself as "done" for this responder, so no
        // forced status change is needed here — the dispatcher owns the
        // CLOSED transition from here on.
        set({
          reportSubmitted: true,
          dutyStatus: 'available',
          assignmentStage: 'incident_clear',
          hasActiveAssignment: false,
          incidentId: null,
          assignment: null,
        })
        // markOnScene() froze the GPS interval so the pin would hold at the
        // incident until it fully closed — resume live tracking now that
        // it has.
        if (get().gpsActive) startGpsInterval()
        // Returned so the caller can attach a photo to the real report_id
        // (previously nothing was returned, so there was no way to sequence
        // a photo upload after a successful submission).
        return saved
      },
      addMessage: (text, from = 'officer') => {
        const now = new Date()
        const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        set((s) => ({
          messages: [...s.messages, { id: `m-${Date.now()}`, type: 'text', from, time, text }],
        }))
      },
      addVoiceMessage: (durationS, from = 'officer', unitId = 'YOU') => {
        const now = new Date()
        const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        set((s) => ({
          messages: [
            ...s.messages,
            { id: `ac-${Date.now()}`, type: 'voice', from, unitId, unitType: 'fire', time, durationS, label: 'Voice update sent to Dispatch', isNew: false },
          ],
        }))
      },
      showToast: (message, variant = 'success') => {
        set({ toast: { message, variant } })
        const ms = variant === 'critical' ? 4000 : 3000
        setTimeout(() => set({ toast: null }), ms)
      },
      stageIndex: () => STAGES.indexOf(get().assignmentStage),
      // This store persists vehicleId/incidentId/hasActiveAssignment to a
      // single global localStorage key with no per-user scoping — nothing
      // ever cleared it on logout, so a second, different field responder
      // logging into the same browser/device would inherit the previous
      // user's stale assignment flags until the next live poll reconciled
      // it. Call this from authSession.logout() to close that gap.
      resetForNewUser: () => {
        stopGpsInterval()
        const user = getCurrentUser()
        set({
          vehicleId: null,
          incidentId: null,
          assignment: null,
          gpsActive: true,
          dutyStatus: 'offline',
          assignmentStage: 'dispatched',
          hasActiveAssignment: false,
          messages: [...mockUnifiedComms],
          reportSubmitted: false,
          outstandingReports: [],
          toast: null,
          sessionUserId: user?.user_id ?? null,
        })
      },
      // resetForNewUser() only runs from authSession.logout() — if a tester
      // (or a stale session) swaps accounts in the same browser tab without
      // going through that flow (new tab reusing localStorage, manual token
      // swap), the previous responder's vehicleId/incidentId otherwise
      // leaks into the new session's UI until the next live poll overwrites
      // it. Call this once on load to catch that mismatch immediately.
      checkSessionOwner: () => {
        const { sessionUserId } = get()
        const user = getCurrentUser()
        const currentId = user?.user_id ?? null
        if (!currentId) return
        if (sessionUserId && sessionUserId !== currentId) {
          get().resetForNewUser()
        } else if (!sessionUserId) {
          set({ sessionUserId: currentId })
        }
      },
    }),
    {
      name: 'fr-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        vehicleId: state.vehicleId,
        incidentId: state.incidentId,
        gpsActive: state.gpsActive,
        dutyStatus: state.dutyStatus,
        assignmentStage: state.assignmentStage,
        hasActiveAssignment: state.hasActiveAssignment,
        messages: state.messages,
        outstandingReports: state.outstandingReports,
        sessionUserId: state.sessionUserId,
        // assignment is NOT persisted — always fetched live from the backend
      }),
    }
  )
)

// Guard against stale cross-account state before anything else reads the
// store (e.g. before GPS restarts below using a leftover vehicleId).
useFieldResponderStore.getState().checkSessionOwner()

// Start GPS if it was active when the page loads (e.g. restored from localStorage)
if (useFieldResponderStore.getState().gpsActive) startGpsInterval()

// Keep GPS interval in sync with gpsActive state changes
useFieldResponderStore.subscribe((state, prevState) => {
  if (state.gpsActive !== prevState.gpsActive) {
    state.gpsActive ? startGpsInterval() : stopGpsInterval()
  }
})
