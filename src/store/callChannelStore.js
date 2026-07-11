import { create } from 'zustand'
import { connect, connectMock, disconnectMock, emit } from '../utils/callChannel'
import { randomRwandanPhone } from '../data/mockCallData'
import { claimCall, passCall, recordOutcome as recordCallOutcome } from '../api/calls'
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
      const payload = {
        call_id: `CALL-SIM-${Date.now()}`,
        phone_number: randomRwandanPhone(),
        started_at: new Date().toISOString(),
      }
      if (_mockRef?.fireMock) {
        _mockRef.fireMock()
      } else {
        set({ incomingCall: payload, showIncomingBanner: true })
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
