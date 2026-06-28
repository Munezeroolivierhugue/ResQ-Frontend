import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'

let _client = null
let _reconnectDelay = 1000
const MAX_DELAY = 30000

export function connect(token, onConnected) {
  if (_client?.active) return _client

  _client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: _reconnectDelay,
    onConnect: () => {
      _reconnectDelay = 1000 // reset backoff on successful connect
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
  if (!_client?.active) {
    console.warn('[wsClient] subscribe called before connect:', topic)
    return () => {}
  }
  const sub = _client.subscribe(topic, (message) => {
    try {
      handler(JSON.parse(message.body))
    } catch {
      handler(message.body)
    }
  })
  return () => sub.unsubscribe()
}

export function disconnect() {
  if (_client?.active) _client.deactivate()
  _client = null
  _reconnectDelay = 1000
}

export function getClient() {
  return _client
}
