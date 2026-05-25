import { create } from 'zustand'

export const useOpsManagerStore = create((set) => ({
  handoverBannerDismissed: sessionStorage.getItem('resq-ops-handover-dismissed') === 'true',
  handoverRead: sessionStorage.getItem('resq-ops-handover-read') === 'true',
  dismissHandoverBanner: () => {
    sessionStorage.setItem('resq-ops-handover-dismissed', 'true')
    set({ handoverBannerDismissed: true })
  },
  markHandoverRead: () => {
    sessionStorage.setItem('resq-ops-handover-read', 'true')
    set({ handoverRead: true, handoverBannerDismissed: true })
  },
}))
