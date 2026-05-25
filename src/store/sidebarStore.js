import { create } from 'zustand'

/** Default expanded so new users see labels until they choose to collapse. */
const saved = localStorage.getItem('resq-sidebar-collapsed') === 'true'

export const useSidebarStore = create((set) => ({
  collapsed: saved,
  toggle: () => set((s) => {
    const next = !s.collapsed
    localStorage.setItem('resq-sidebar-collapsed', String(next))
    return { collapsed: next }
  }),
}))
