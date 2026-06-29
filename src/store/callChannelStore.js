import { create } from 'zustand'
import { connect, connectMock, disconnectMock, emit } from '../utils/callChannel'
import { randomRwandanPhone, mockCallerProfiles, mockCallRecords } from '../data/mockCallData'
import { claimCall, passCall } from '../api/calls'
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
      // Update matching call record with recording_url
      const { call_id, recording_url } = payload ?? {}
      if (call_id && recording_url) {
        const rec = mockCallRecords.find((r) => r.call_id === call_id)
        if (rec) {
          rec.recording_url = recording_url
          rec.ended_at = new Date().toISOString()
        }
      }
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

    endCall: () => {
      set({ currentCall: null, endedCallPayload: null })
    },

    clearEndedPayload: () => set({ endedCallPayload: null }),

    /** Called by the dev "Simulate" button on LiveDispatchMap. */
    simulateCall: () => {
      if (_mockRef?.fireMock) {
        _mockRef.fireMock()
      } else {
        // If real WS mode, manually inject a fake call
        handlers.onIncomingCall({
          call_id: `CALL-SIM-${Date.now()}`,
          phone_number: randomRwandanPhone(),
          started_at: new Date().toISOString(),
        })
      }
    },

    /** Look up caller profile by phone number — tries API first, falls back to mock */
    getCallerProfile: async (phone_number) => {
      try {
        return await getCallerByPhone(phone_number)
      } catch {
        return mockCallerProfiles.find((p) => p.phone_number === phone_number) ?? null
      }
    },

    _cleanup: () => disconnectMock(),
  }
})
