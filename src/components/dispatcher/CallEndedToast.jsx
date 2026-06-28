import { useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { useCallChannelStore } from '../../store/callChannelStore'

/** Auto-dismisses after 5s. Renders nothing when no ended call payload. */
export default function CallEndedToast() {
  const { endedCallPayload, clearEndedPayload } = useCallChannelStore()

  useEffect(() => {
    if (!endedCallPayload) return
    const t = setTimeout(clearEndedPayload, 5000)
    return () => clearTimeout(t)
  }, [endedCallPayload, clearEndedPayload])

  if (!endedCallPayload) return null

  return (
    <div
      className="animate-fade-in-up"
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.75rem 1.25rem',
        borderRadius: 10,
        background: 'var(--status-low-bg)',
        border: '1px solid var(--status-low)',
        color: 'var(--status-low)',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        boxShadow: 'var(--shadow-card)',
        whiteSpace: 'nowrap',
      }}
      role="status"
    >
      <CheckCircle size={15} />
      Call ended. Recording attached.
    </div>
  )
}
