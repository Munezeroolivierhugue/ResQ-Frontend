import { Mic, MicOff, PhoneCall } from 'lucide-react'
import { useCallAudioStore } from '../../store/callAudioStore'

function fmtCallTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

/**
 * Mounted once in AppShell — visible on every dispatcher page while a call
 * is active, not just on New Incident. Previously the call bar (timer, mute,
 * end call) only existed inside NewIncident.jsx's own markup, so navigating
 * anywhere else during a live call made it disappear entirely.
 */
export default function GlobalCallCard() {
  const { callId, callPhone, callElapsed, isMuted, callHasEnded, toggleMute, endCurrentCall } =
    useCallAudioStore()

  if (!callId) return null

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 rounded-2xl border-2 px-5 py-3.5 flex items-center gap-4 animate-fade-in-up"
      style={{
        top: '4.75rem',
        // Leaflet's map panes/popups run up to z-index 700 — this needs to
        // clear that plus every other overlay in the app, not sit at 250
        // where the live dispatch map could paint over it while scrolling.
        zIndex: 9999,
        background: 'var(--bg-surface)',
        borderColor: callHasEnded ? 'var(--status-critical)' : 'var(--status-low)',
        boxShadow: 'var(--shadow-modal)',
        minWidth: 380,
      }}
    >
      <span
        className="inline-flex items-center justify-center w-10 h-10 rounded-full shrink-0"
        style={{ background: callHasEnded ? 'var(--status-critical)' : 'var(--status-low)', color: '#fff' }}
      >
        <PhoneCall size={17} />
      </span>
      <div className="min-w-0">
        <p
          className="m-0 text-[11px] font-bold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-display)', color: callHasEnded ? 'var(--status-critical)' : 'var(--status-low)' }}
        >
          {callHasEnded ? 'Call ended' : 'Call active'}
        </p>
        <p className="m-0 text-[15px] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
          {callPhone}
        </p>
      </div>

      {!callHasEnded && (
        <>
          <span className="text-[15px] font-bold shrink-0" style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-low)' }}>
            {fmtCallTime(callElapsed)}
          </span>
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border cursor-pointer text-[12px] font-bold shrink-0"
            style={{
              fontFamily: 'var(--font-display)',
              background: isMuted ? 'color-mix(in srgb, var(--status-warning) 12%, transparent)' : 'var(--bg-elevated)',
              color: isMuted ? 'var(--status-warning)' : 'var(--text-secondary)',
              borderColor: isMuted ? 'var(--status-warning)' : 'var(--border)',
            }}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            {isMuted ? 'Muted' : 'Mute'}
          </button>
          <button
            type="button"
            onClick={endCurrentCall}
            className="text-[12px] font-bold px-3.5 py-2 rounded-lg border-none cursor-pointer shrink-0"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'var(--status-critical-bg)',
              color: 'var(--status-critical)',
              border: '1px solid var(--status-critical)',
            }}
          >
            End call
          </button>
        </>
      )}
    </div>
  )
}
