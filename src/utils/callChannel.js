/**
 * callChannel.js
 * STOMP over SockJS WebSocket wrapper with dev-mode mock fallback.
 */
import { connect as wsConnect, subscribe, disconnect as wsDisconnect } from '../lib/wsClient'
import { getAccessToken } from './authSession'

let _unsubs = []
let _mockTimer = null

// ── Real STOMP connection ─────────────────────────────────────────────────────
export function connect(handlers) {
  const token = getAccessToken()
  wsConnect(token, (client) => {
    // Subscribe to incoming calls broadcast
    const unsub1 = subscribe('/topic/calls', (payload) => {
      if (payload.type === 'incoming_call' && handlers.onIncomingCall) {
        handlers.onIncomingCall({
          call_id: payload.sessionId,
          session_id: payload.sessionId,
          phone_number: payload.callerPhone,
          destination_number: payload.destinationNumber,
          incident_type_hint: payload.incidentTypeHint,
          rough_lat: payload.roughLat,
          rough_lng: payload.roughLng,
          started_at: new Date().toISOString(),
        })
      }
    })
    _unsubs.push(unsub1)
  })
}

/** Emit an event by calling the REST API (STOMP is server→client only for calls). */
export function emit(event, payload) {
  // No-op here — call claim/pass/miss via REST API in the store actions
  console.info('[callChannel] emit →', event, payload)
}

export function disconnect() {
  _unsubs.forEach((u) => u())
  _unsubs = []
  wsDisconnect()
}

// ── Mock fallback (dev mode, no real WS URL) ─────────────────────────────────
export function connectMock(handlers, phoneGenerator) {
  disconnectMock()
  const fire = () => {
    if (handlers.onIncomingCall) {
      handlers.onIncomingCall({
        call_id: `CALL-MOCK-${Date.now()}`,
        phone_number: phoneGenerator(),
        started_at: new Date().toISOString(),
      })
    }
  }
  _mockTimer = setInterval(fire, 60_000)
  return { fireMock: fire }
}

export function disconnectMock() {
  if (_mockTimer) {
    clearInterval(_mockTimer)
    _mockTimer = null
  }
}
