import { create } from 'zustand'

const saved = localStorage.getItem('resq-theme') || 'dark'
document.documentElement.setAttribute('data-theme', saved)

export const useThemeStore = create((set) => ({
  theme: saved,
  toggle: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('resq-theme', next)
    return { theme: next }
  }),
}))
