/**
 * callChannel.js
 * Thin WebSocket wrapper with a dev-mode mock fallback.
 *
 * Handlers object shape:
 *   { onIncomingCall, onCallEnded, onError }
 */

let _ws = null
let _mockTimer = null

// ── Real WebSocket ────────────────────────────────────────────────────────────
export function connect(url, handlers) {
  disconnect()
  _ws = new WebSocket(url)

  _ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data)
      if (msg.event === 'incoming_call' && handlers.onIncomingCall) {
        handlers.onIncomingCall(msg.payload)
      }
      if (msg.event === 'call_ended' && handlers.onCallEnded) {
        handlers.onCallEnded(msg.payload)
      }
    } catch {
      // ignore malformed frames
    }
  }

  _ws.onerror = (e) => {
    if (handlers.onError) handlers.onError(e)
  }

  return _ws
}

/** Emit an event to the server (no-op in mock mode). */
export function emit(event, payload) {
  if (_ws && _ws.readyState === WebSocket.OPEN) {
    _ws.send(JSON.stringify({ event, payload }))
  } else {
    // Mock / dev mode: just log
    console.info(`[callChannel] mock emit →`, event, payload)
  }
}

// ── Mock fallback ─────────────────────────────────────────────────────────────
/**
 * Fires a fake incoming_call event immediately on mount, then every 60s.
 * phoneGenerator is a () => string function injected by the caller.
 */
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
  return { fireMock: fire }  // expose so the "Simulate" button can call it instantly
}

export function disconnectMock() {
  if (_mockTimer) {
    clearInterval(_mockTimer)
    _mockTimer = null
  }
}

export function disconnect() {
  disconnectMock()
  if (_ws) {
    _ws.close()
    _ws = null
  }
}
