import { create } from 'zustand'
import { FR_DISPATCH_MESSAGES } from '../data/mockFieldResponderData'

const STAGES = ['dispatched', 'en_route', 'on_scene', 'incident_clear']

export const useFieldResponderStore = create((set, get) => ({
  gpsActive: true,
  dutyStatus: 'offline',
  assignmentStage: 'dispatched',
  hasActiveAssignment: true,
  messages: [...FR_DISPATCH_MESSAGES],
  reportSubmitted: false,
  outstandingReports: [],
  toast: null,

  setGpsActive: (gpsActive) => set({ gpsActive }),
  goAvailable: () => set({ dutyStatus: 'available', gpsActive: true }),
  acceptAssignment: () => set({ assignmentStage: 'en_route', dutyStatus: 'available' }),
  markOnScene: () =>
    set({ assignmentStage: 'on_scene', dutyStatus: 'on_scene' }),
  clearIncident: () =>
    set({
      assignmentStage: 'incident_clear',
      dutyStatus: 'available',
      hasActiveAssignment: false,
    }),
  endShift: () =>
    set({
      dutyStatus: 'offline',
      gpsActive: false,
      hasActiveAssignment: false,
      assignmentStage: 'dispatched',
    }),
  submitReport: () =>
    set({
      reportSubmitted: true,
      dutyStatus: 'available',
      assignmentStage: 'incident_clear',
      hasActiveAssignment: false,
    }),
  addMessage: (text, from = 'officer') => {
    const now = new Date()
    const time = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
    set((s) => ({
      messages: [
        ...s.messages,
        { id: `m-${Date.now()}`, from, time, text },
      ],
    }))
  },
  showToast: (message, variant = 'success') => {
    set({ toast: { message, variant } })
    const ms = variant === 'critical' ? 4000 : 3000
    setTimeout(() => set({ toast: null }), ms)
  },
  stageIndex: () => STAGES.indexOf(get().assignmentStage),
}))
