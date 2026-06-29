import { create } from 'zustand'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  resolveHref,
} from '../api/notifications'
import { connect, subscribe } from '../lib/wsClient'

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
    // Optimistic update
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }))
    try {
      await markAllNotificationsRead()
    } catch {
      // Revert not strictly needed — just log
      console.error('[notificationsStore] markAllRead API failed')
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
      get().addNotification({
        id: payload.notificationId ?? `ws-${Date.now()}`,
        type: payload.type,
        title: payload.message?.split(': ')[0] ?? payload.message ?? '',
        desc: payload.message?.split(': ').slice(1).join(': ') ?? '',
        time: payload.createdAt ?? new Date().toISOString(),
        read: false,
        priority: payload.priority ?? 'normal',
        href: resolveHref(payload.type),
        details: null,
      })
    })
    return unsub
  },
}))
