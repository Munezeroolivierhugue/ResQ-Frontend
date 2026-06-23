import { create } from 'zustand'
import { mockNotifications } from '../data/mockNotificationsData'

export const useNotificationsStore = create((set) => ({
  items: mockNotifications.map((n) => ({ ...n })),
  markAllRead: () =>
    set((s) => ({
      items: s.items.map((n) => ({ ...n, read: true })),
    })),
  markRead: (id) =>
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  addNotification: (notification) =>
    set((s) => ({
      items: [notification, ...s.items],
    })),
}))
