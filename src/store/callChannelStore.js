import { create } from 'zustand'
import { connect, connectMock, disconnectMock, emit } from '../utils/callChannel'
import { randomRwandanPhone } from '../data/mockCallData'
import { claimCall, passCall, missCall, simulateCall as simulateCallApi, recordOutcome as recordCallOutcome } from '../api/calls'
import { getCallerByPhone } from '../api/callers'

// ── Store ─────────────────────────────────────────────────────────────────────
export const useCallChannelStore = create((set, get) => {
  // Handlers forwarded from the WebSocket / mock layer
  const handlers = {
    onIncomingCall: (payload) => {
      // Ignore if a call is already active
      if (get().currentCall) return
      set({ incomingCall: payload, showIncomingBanner: true })
    },
    onCallEnded: (payload) => {
      set({
        currentCall: null,
        incomingCall: null,
        showIncomingBanner: false,
        endedCallPayload: payload,
      })
    },
  }

  // Start connector: use STOMP if WS URL is configured, otherwise mock
  let _mockRef = null
  const wsUrl = import.meta.env.VITE_WS_URL
  if (wsUrl) {
    connect(handlers)
  } else {
    _mockRef = connectMock(handlers, randomRwandanPhone)
  }

  return {
    // ── State ────────────────────────────────────────────────────────────────
    incomingCall: null,       // { call_id, phone_number, started_at }
    currentCall: null,        // same shape, set after answer
    showIncomingBanner: false,
    endedCallPayload: null,   // populated briefly after call_ended for toast

    // ── Actions ──────────────────────────────────────────────────────────────
    receiveCall: (payload) => handlers.onIncomingCall(payload),

    answerCall: async () => {
      const { incomingCall } = get()
      if (!incomingCall) return
      const sessionId = incomingCall.session_id ?? incomingCall.call_id
      // Fire REST claim — don't block UI transition on this
      if (sessionId && !sessionId.startsWith('CALL-MOCK-') && !sessionId.startsWith('CALL-SIM-')) {
        claimCall(sessionId).catch(console.error)
      } else {
        emit('call_claimed', { call_id: sessionId })
      }
      set({
        currentCall: incomingCall,
        incomingCall: null,
        showIncomingBanner: false,
      })
    },

    declineCall: async () => {
      const { incomingCall } = get()
      if (!incomingCall) return
      const sessionId = incomingCall.session_id ?? incomingCall.call_id
      if (sessionId && !sessionId.startsWith('CALL-MOCK-') && !sessionId.startsWith('CALL-SIM-')) {
        passCall(sessionId).catch(console.error)
      } else {
        emit('call_passed', { call_id: sessionId })
      }
      set({ incomingCall: null, showIncomingBanner: false })
    },

    // Ring timed out with nobody answering — a genuine miss, distinct from a
    // dispatcher explicitly clicking Decline (which cascades to the next dispatcher).
    expireCall: async () => {
      const { incomingCall } = get()
      if (!incomingCall) return
      const sessionId = incomingCall.session_id ?? incomingCall.call_id
      if (sessionId && !sessionId.startsWith('CALL-MOCK-') && !sessionId.startsWith('CALL-SIM-')) {
        missCall(sessionId).catch(console.error)
      } else {
        emit('call_ended', { call_id: sessionId, status: 'MISSED' })
      }
      set({ incomingCall: null, showIncomingBanner: false })
    },

    recordOutcome: async (outcome) => {
      const { currentCall } = get()
      if (!currentCall) return
      const sessionId = currentCall.session_id ?? currentCall.call_id
      if (sessionId && !sessionId.startsWith('CALL-MOCK-') && !sessionId.startsWith('CALL-SIM-')) {
        await recordCallOutcome(sessionId, outcome)
      }
    },

    endCall: () => {
      set({ currentCall: null, endedCallPayload: null })
    },

    clearEndedPayload: () => set({ endedCallPayload: null }),

    /** Called by the "Simulate" button on LiveDispatchMap. */
    simulateCall: () => {
      // Clear any stale call state so the banner always fires
      set({ currentCall: null, incomingCall: null, showIncomingBanner: false })
      if (wsUrl) {
        // Real backend + WebSocket are connected — create an actual CallRecord
        // so claim/pass/miss (and the resulting MissedCall on a real miss) work
        // exactly like a live call, instead of a client-only banner that can
        // never be persisted. The broadcast on /topic/calls (handled by
        // handlers.onIncomingCall above) is what actually populates the banner.
        simulateCallApi().catch(console.error)
      } else if (_mockRef?.fireMock) {
        _mockRef.fireMock()
      } else {
        set({
          incomingCall: {
            call_id: `CALL-MOCK-${Date.now()}`,
            phone_number: randomRwandanPhone(),
            started_at: new Date().toISOString(),
          },
          showIncomingBanner: true,
        })
      }
    },

    getCallerProfile: async (phone_number) => {
      try {
        return await getCallerByPhone(phone_number)
      } catch {
        return null
      }
    },

    _cleanup: () => disconnectMock(),
  }
})
