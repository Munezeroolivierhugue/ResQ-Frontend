import { Check } from 'lucide-react'

export default function SettingsToast({ show, message = 'Settings saved' }) {
  if (!show) return null
  return (
    <div
      className="fixed bottom-6 right-6 z-[300] flex items-center gap-2 px-4 py-3 rounded-lg shadow-[var(--shadow-dropdown)]"
      style={{
        background: 'var(--status-low-bg)',
        border: '1px solid var(--status-low)',
      }}
    >
      <Check size={16} style={{ color: 'var(--status-low)' }} />
      <span className="text-[13px] font-medium text-(--text-primary)">{message}</span>
    </div>
  )
}
