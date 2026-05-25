import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSidebarStore } from '../../store/sidebarStore'

export default function SidebarToggle() {
  const { collapsed, toggle } = useSidebarStore()

  return (
    <button
      type="button"
      className="sidebar-toggle-btn"
      onClick={toggle}
      aria-label={collapsed ? 'Show menu labels' : 'Hide menu labels'}
      title={collapsed ? 'Show menu labels' : 'Hide menu labels'}
    >
      {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
    </button>
  )
}
