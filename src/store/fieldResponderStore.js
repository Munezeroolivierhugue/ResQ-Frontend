import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mockUnifiedComms } from '../data/mockUnifiedComms'
import { mockFieldReports } from '../data/mockFieldReports'
import { FR_OFFICER, FR_ASSIGNMENT } from '../data/mockFieldResponderData'
import { generateUuid, yesNoToBoolean } from '../utils/formHelpers'
import { recordGpsPing } from '../api/vehicles'
import { submitFieldReport } from '../api/fieldReports'

const STAGES = ['dispatched', 'en_route', 'on_scene', 'incident_clear']

let gpsIntervalId = null

function startGpsInterval() {
  if (gpsIntervalId) return
  let lat = FR_OFFICER.current_lat
  let lng = FR_OFFICER.current_lng
  gpsIntervalId = setInterval(() => {
    const { gpsActive } = useFieldResponderStore.getState()
    if (!gpsActive) { stopGpsInterval(); return }
    lat += (Math.random() * 2 - 1) * 0.0001
    lng += (Math.random() * 2 - 1) * 0.0001
    recordGpsPing(FR_OFFICER.vehicle_id, lat, lng).catch(console.error)
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
      gpsActive: true,
      dutyStatus: 'offline',
      assignmentStage: 'dispatched',
      hasActiveAssignment: true,
      messages: [...mockUnifiedComms],
      reportSubmitted: false,
      outstandingReports: [],
      toast: null,

      setGpsActive: (gpsActive) => set({ gpsActive }),
      goAvailable: () => set({ dutyStatus: 'available', gpsActive: true }),
      acceptAssignment: () => set({ assignmentStage: 'en_route', dutyStatus: 'available' }),
      markOnScene: () => set({ assignmentStage: 'on_scene', dutyStatus: 'on_scene' }),
      clearIncident: () =>
        set({
          assignmentStage: 'incident_clear',
          dutyStatus: 'available',
          hasActiveAssignment: false,
        }),
      endShift: () => {
        stopGpsInterval()
        set({ dutyStatus: 'offline', gpsActive: false, hasActiveAssignment: false, assignmentStage: 'dispatched' })
      },
      submitReport: async (form) => {
        const payload = {
          report_id: generateUuid(),
          incident_id: FR_ASSIGNMENT.incident_id,
          vehicle_id: FR_OFFICER.vehicle_id,
          responder_id: FR_OFFICER.user_id,
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
        try {
          await submitFieldReport(payload)
        } catch (err) {
          // Fallback: push to mock array so UI doesn't break offline
          mockFieldReports.push(payload)
          throw err
        }
        set({
          reportSubmitted: true,
          dutyStatus: 'available',
          assignmentStage: 'incident_clear',
          hasActiveAssignment: false,
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
        gpsActive: state.gpsActive,
        dutyStatus: state.dutyStatus,
        assignmentStage: state.assignmentStage,
        hasActiveAssignment: state.hasActiveAssignment,
        messages: state.messages,
        outstandingReports: state.outstandingReports,
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
