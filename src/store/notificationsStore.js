import { create } from 'zustand'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  resolveHref,
} from '../api/notifications'
import { connect, subscribe } from '../lib/wsClient'
import { playNotificationSound } from '../utils/notificationSound'

// Several backend publishNotification(...) calls push a WS payload with only
// `type` + an id field (no `message`) — the REST fetch always has the real
// message (persisted in the DB), which is why a refresh "fixes" a blank
// live-pushed notification. Mirror the REST transform's humanizeType
// fallback here so the live push reads the same as after a refresh.
function humanizeType(type) {
  if (!type) return 'Notification'
  const words = type.toLowerCase().split('_')
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '')
}

export const useNotificationsStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null })
    try {
      const items = await listNotifications()
      set({ items, loading: false })
    } catch (err) {
      set({ error: err?.message ?? 'Failed to fetch notifications', loading: false })
    }
  },

  markAllRead: async () => {
    // Mark-all-read is a "clear the centre" action here: once every real
    // notification is acknowledged, they're cleared from view rather than
    // sitting around read — matches the "we remain with no notification"
    // requirement. Clear optimistically; re-fetch on failure so the list
    // doesn't lie about server state.
    const previous = get().items
    set({ items: [] })
    try {
      await markAllNotificationsRead()
    } catch {
      console.error('[notificationsStore] markAllRead API failed')
      set({ items: previous })
    }
  },

  markRead: async (id) => {
    // Optimistic update
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
    try {
      await markNotificationRead(id)
    } catch {
      console.error('[notificationsStore] markRead API failed for', id)
    }
  },

  addNotification: (notification) =>
    set((s) => ({
      items: [notification, ...s.items],
    })),

  /** Subscribe to real-time notifications via WebSocket /user/queue/notifications */
  subscribeToWs: () => {
    const token = sessionStorage.getItem('resq-jwt')
    // Ensure the STOMP client is connecting/connected before subscribing.
    // connect() is idempotent — safe to call multiple times.
    connect(token)

    const unsub = subscribe('/user/queue/notifications', (payload) => {
      const referenceId = payload.referenceId ?? payload.incidentId ?? null
      get().addNotification({
        id: payload.notificationId ?? `ws-${Date.now()}`,
        type: payload.type,
        title: payload.message?.split(': ')[0] || humanizeType(payload.type),
        desc: payload.message?.split(': ').slice(1).join(': ') ?? '',
        time: payload.createdAt ?? new Date().toISOString(),
        read: false,
        priority: payload.priority ?? 'normal',
        href: resolveHref(payload.type, referenceId),
        referenceId,
        actorName: payload.actorName ?? payload.responderName ?? null,
        actorPhotoUrl: payload.actorPhotoUrl ?? null,
        details: null,
      })
      // Only for live, newly-arriving pushes — never on the initial
      // fetchNotifications() load, which would replay a sound for every
      // pre-existing unread notification on page load.
      playNotificationSound(payload.priority)
    })
    return unsub
  },
}))
