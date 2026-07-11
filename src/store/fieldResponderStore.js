import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mockUnifiedComms } from '../data/mockUnifiedComms'
import { FR_OFFICER, FR_ASSIGNMENT } from '../data/mockFieldResponderData'
import { generateUuid, yesNoToBoolean } from '../utils/formHelpers'
import { recordGpsPing, updateVehicleStatus, getVehicle } from '../api/vehicles'
import { submitFieldReport } from '../api/fieldReports'
import { updateIncidentStatus, listIncidents } from '../api/incidents'
import { listDispatchesForIncident } from '../api/dispatches'
import { getAccessToken, getCurrentUser } from '../utils/authSession'

const STAGES = ['dispatched', 'en_route', 'on_scene', 'incident_clear']
const MOCK_VEHICLE_ID = FR_OFFICER.vehicle_id  // placeholder — never send to real API

let gpsIntervalId = null

function startGpsInterval() {
  if (gpsIntervalId) return
  let lat = FR_OFFICER.current_lat
  let lng = FR_OFFICER.current_lng
  gpsIntervalId = setInterval(() => {
    const { gpsActive, vehicleId } = useFieldResponderStore.getState()
    if (!gpsActive) { stopGpsInterval(); return }
    if (!getAccessToken()) return
    // Only ping when we have a real vehicle ID assigned — skip mock placeholder
    if (!vehicleId || vehicleId === MOCK_VEHICLE_ID) return
    lat += (Math.random() * 2 - 1) * 0.0001
    lng += (Math.random() * 2 - 1) * 0.0001
    recordGpsPing(vehicleId, lat, lng).catch(() => {})
  }, 30000)
}

function stopGpsInterval() {
  clearInterval(gpsIntervalId)
  gpsIntervalId = null
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
          } catch {
            // Can't fetch vehicle — attempt status update anyway
            updateVehicleStatus(vehicleId, 'available').catch(() => {})
          }
        }
      },

      // Poll active incidents to find one dispatched to this vehicle
      pollForAssignment: async () => {
        const { vehicleId, assignment } = get()
        if (!vehicleId || vehicleId === MOCK_VEHICLE_ID) return
        if (assignment) return   // already have one
        try {
          const statuses = ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE']
          for (const status of statuses) {
            const incidents = await listIncidents({ status })
            for (const inc of incidents) {
              const dispatches = await listDispatchesForIncident(inc.incident_id)
              const mine = dispatches.find(d => d.vehicle_id === vehicleId)
              if (mine) {
                set({
                  incidentId: inc.incident_id,
                  hasActiveAssignment: true,
                  assignment: {
                    incident: inc,
                    dispatch: mine,
                    otherDispatches: dispatches.filter(d => d.vehicle_id !== vehicleId),
                  },
                })
                return
              }
            }
          }
        } catch { /* silent — will retry on next poll */ }
      },

      acceptAssignment: () => {
        const { incidentId } = get()
        set({ assignmentStage: 'en_route', dutyStatus: 'available' })
        if (incidentId) updateIncidentStatus(incidentId, 'EN_ROUTE').catch(() => {})
      },
      markOnScene: () => {
        const { incidentId } = get()
        set({ assignmentStage: 'on_scene', dutyStatus: 'on_scene' })
        if (incidentId) updateIncidentStatus(incidentId, 'ON_SCENE').catch(() => {})
      },
      clearIncident: () =>
        set({
          incidentId: null,
          assignmentStage: 'incident_clear',
          dutyStatus: 'available',
          hasActiveAssignment: false,
          assignment: null,
        }),
      endShift: () => {
        stopGpsInterval()
        set({ dutyStatus: 'offline', gpsActive: false, hasActiveAssignment: false, assignmentStage: 'dispatched', assignment: null })
      },
      submitReport: async (form) => {
        const { vehicleId, incidentId } = get()
        const user = getCurrentUser()
        const payload = {
          report_id: generateUuid(),
          incident_id: incidentId || FR_ASSIGNMENT.incident_id,
          vehicle_id: vehicleId || FR_OFFICER.vehicle_id,
          responder_id: user?.user_id || FR_OFFICER.user_id,
          persons_involved: parseInt(form.persons, 10) || 0,
          injuries: yesNoToBoolean(form.injuries),
          suspects: yesNoToBoolean(form.suspects),
          scene_status: form.sceneStatus,
          description: buildDescription(form),
          agencies_involved: form.agencies?.join(', ').slice(0, 255) || null,
          case_reference: form.caseReference || null,
          entry_method: 'STRUCTURED',
          submitted_at: new Date().toISOString(),
        }
        await submitFieldReport(payload)
        set({
          reportSubmitted: true,
          dutyStatus: 'available',
          assignmentStage: 'incident_clear',
          hasActiveAssignment: false,
          incidentId: null,
          assignment: null,
        })
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
        // assignment is NOT persisted — always fetched live from the backend
      }),
    }
  )
)

// Start GPS if it was active when the page loads (e.g. restored from localStorage)
if (useFieldResponderStore.getState().gpsActive) startGpsInterval()

// Keep GPS interval in sync with gpsActive state changes
useFieldResponderStore.subscribe((state, prevState) => {
  if (state.gpsActive !== prevState.gpsActive) {
    state.gpsActive ? startGpsInterval() : stopGpsInterval()
  }
})
