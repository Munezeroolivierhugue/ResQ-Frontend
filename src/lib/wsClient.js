import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = import.meta.env.VITE_WS_URL ?? `${window.location.origin}/ws`

let _client = null
let _reconnectDelay = 1000
const MAX_DELAY = 30000

// Subscriptions requested before the STOMP handshake is complete are queued
// and drained once onConnect fires.
const _pendingSubs = []

function _doSubscribe(topic, handler) {
  const sub = _client.subscribe(topic, (message) => {
    try {
      handler(JSON.parse(message.body))
    } catch {
      handler(message.body)
    }
  })
  return () => sub.unsubscribe()
}

export function connect(token, onConnected) {
  if (_client?.active) {
    // Already activating/connected — call onConnected immediately if already up
    if (_client.connected && onConnected) onConnected(_client)
    return _client
  }

  _client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: _reconnectDelay,
    onConnect: () => {
      _reconnectDelay = 1000
      // Drain any subscriptions that were queued before connection was ready
      _pendingSubs.splice(0).forEach(({ topic, handler, setUnsub }) => {
        setUnsub(_doSubscribe(topic, handler))
      })
      if (onConnected) onConnected(_client)
    },
    onDisconnect: () => {
      _reconnectDelay = Math.min(_reconnectDelay * 2, MAX_DELAY)
    },
    onStompError: (frame) => {
      console.error('[wsClient] STOMP error', frame)
    },
  })

  _client.activate()
  return _client
}

export function subscribe(topic, handler) {
  if (_client?.connected) {
    // STOMP handshake complete — subscribe immediately
    return _doSubscribe(topic, handler)
  }

  if (_client?.active) {
    // Client is activating but handshake not yet done — queue the subscription
    let unsub = () => {}
    _pendingSubs.push({ topic, handler, setUnsub: (fn) => { unsub = fn } })
    return () => unsub()
  }

  console.warn('[wsClient] subscribe called before connect — call connect() first:', topic)
  return () => {}
}

export function disconnect() {
  if (_client?.active) _client.deactivate()
  _client = null
  _reconnectDelay = 1000
  _pendingSubs.length = 0
}

export function getClient() {
  return _client
}
