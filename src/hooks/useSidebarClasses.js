import { useSidebarStore } from '../store/sidebarStore'

export function useSidebarClasses(mobileOpen) {
  const collapsed = useSidebarStore((s) => s.collapsed)
  const expanded = mobileOpen || !collapsed
  return [
    'sidebar',
    expanded ? 'sidebar--expanded' : 'sidebar--collapsed',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ')
}
