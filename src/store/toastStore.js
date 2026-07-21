import { create } from 'zustand'

let nextId = 1

/**
 * Shared toast/message store. One place to push success/error/warning/info
 * messages that stack visually (rendered by ToastStack.jsx). Replaces the
 * previously-scattered SettingsToast / CallEndedToast / .fr-toast / one-off
 * inline toast implementations across the app.
 */
export const useToastStore = create((set, get) => ({
  toasts: [],

  pushToast: ({ variant = 'info', title, message, duration = 4000 }) => {
    const id = `toast-${nextId++}-${Date.now()}`
    set((s) => ({ toasts: [...s.toasts, { id, variant, title, message }] }))
    if (duration) {
      setTimeout(() => {
        get().dismissToast(id)
      }, duration)
    }
    return id
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))
