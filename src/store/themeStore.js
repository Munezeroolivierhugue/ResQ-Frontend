import { create } from 'zustand'

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('resq-theme', theme)
}

const saved = localStorage.getItem('resq-theme') || 'light'
applyTheme(saved)

export const useThemeStore = create((set) => ({
  theme: saved,
  setTheme: (theme) => {
    if (theme !== 'light' && theme !== 'dark') return
    applyTheme(theme)
    set({ theme })
  },
  toggle: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    return { theme: next }
  }),
}))
