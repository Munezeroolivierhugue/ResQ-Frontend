/** Voice channel audio log panel — renders inside the ActiveIncident Field Comms tab. */


import { useState, useRef, useEffect } from 'react'
import { Play, Square, Radio, Mic } from 'lucide-react'
import { UNIT_COLORS } from '../../data/mockActiveIncidentData'
import { fmtDuration } from '../../data/mockAudioCommsData'

// A deterministic fake waveform: 28 bars of varying heights
const WAVEFORM_HEIGHTS = [
  40, 65, 80, 55, 90, 70, 45, 85, 60, 75,
  50, 95, 65, 40, 80, 70, 55, 85, 45, 75,
  60, 90, 50, 65, 80, 55, 70, 45,
]

function Waveform({ progress, durationS }) {
  // progress = elapsed seconds (fractional OK)
  const pct = durationS > 0 ? Math.min(progress / durationS, 1) : 0
  const filledBars = Math.round(pct * WAVEFORM_HEIGHTS.length)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        height: '28px',
        flex: 1,
      }}
    >
      {WAVEFORM_HEIGHTS.map((h, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: `${h}%`,
            borderRadius: '2px',
            background: i < filledBars
              ? 'var(--accent)'
              : 'var(--border)',
            transition: 'background 0.05s',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

function AudioClip({ clip, unitColors }) {
  const [playing, setPlaying] = useState(false)
  // progress in seconds (fractional)
  const [progress, setProgress] = useState(0)
  const [listened, setListened] = useState(!clip.isNew)
  const intervalRef = useRef(null)

  // Clean up interval on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const startPlay = () => {
    if (playing) return
    setPlaying(true)
    setListened(true)
    setProgress(0)
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.1
        if (next >= clip.durationS) {
          clearInterval(intervalRef.current)
          setPlaying(false)
          return clip.durationS
        }
        return next
      })
    }, 100)
  }

  const stopPlay = () => {
    clearInterval(intervalRef.current)
    setPlaying(false)
    setProgress(0)
  }

  const isDispatch = clip.from === 'dispatch'
  const unitColor = isDispatch
    ? 'var(--accent)'
    : (unitColors[clip.unitType] || 'var(--text-secondary)')

  return (
    <div className="audio-clip" style={{ borderLeftColor: unitColor }}>
      {/* Header row */}
      <div className="audio-clip-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!listened && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--status-critical)',
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
          )}
          <span
            className="audio-clip-from"
            style={{ color: unitColor }}
          >
            {isDispatch ? 'DISPATCH [you]' : clip.unitId}
          </span>
        </div>
        <span className="audio-clip-time" style={{ fontFamily: 'var(--font-mono)' }}>
          {clip.time}
        </span>
      </div>

      {/* Waveform + controls */}
      <div className="audio-clip-body">
        <button
          type="button"
          className="audio-play-btn"
          onClick={playing ? stopPlay : startPlay}
          aria-label={playing ? 'Stop' : 'Play'}
          style={{
            background: playing ? 'var(--status-critical)' : 'var(--accent)',
          }}
        >
          {playing ? <Square size={12} /> : <Play size={12} />}
        </button>
        <Waveform progress={progress} durationS={clip.durationS} />
        <span className="audio-clip-dur" style={{ fontFamily: 'var(--font-mono)' }}>
          {fmtDuration(clip.durationS)}
        </span>
      </div>

      {/* Caption / transcript summary */}
      <p className="audio-clip-label">{clip.label}</p>
    </div>
  )
}

export default function CommsAudioLog({ clips, onRecord }) {
  const [recording, setRecording] = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)
  const recRef = useRef(null)

  /**
   * PTT (Push-to-Talk) hold simulation.
   * In production this would open a WebRTC media stream.
   * Here we just tick a timer to show how long the dispatcher has been talking.
   */
  const startRecord = () => {
    setRecording(true)
    setRecSeconds(0)
    recRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000)
  }

  const stopRecord = () => {
    clearInterval(recRef.current)
    setRecording(false)
    setRecSeconds(0)
    onRecord?.()
  }

  useEffect(() => () => clearInterval(recRef.current), [])

  const newCount = clips.filter((c) => c.isNew).length

  return (
    <div className="audio-log-root">
      {/* Panel header */}
      <div className="audio-log-header">
        <Radio size={13} className="text-(--accent)" />
        <span
          className="text-[10px] font-bold tracking-[0.12em] text-(--text-secondary) uppercase"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Voice Channel
        </span>
        {newCount > 0 && (
          <span className="audio-unread-badge">{newCount} new</span>
        )}
        <span className="text-[9px] font-bold uppercase tracking-wider text-(--status-low) flex items-center gap-1 ml-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-(--status-low)" />
          Encrypted link active
        </span>
      </div>

      {/* Scrollable clip list */}
      <div className="audio-log-list">
        {clips.map((clip) => (
          <AudioClip key={clip.id} clip={clip} unitColors={UNIT_COLORS} />
        ))}
      </div>

      {/* PTT bar at the bottom */}
      <div className="audio-ptt-bar">
        {recording && (
          <div className="audio-recording-indicator">
            <span
              className="audio-rec-dot"
              style={{ background: 'var(--status-critical)' }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--status-critical)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              REC {recSeconds}s — release to send
            </span>
          </div>
        )}
        <button
          type="button"
          id="dispatcher-ptt-btn"
          className={`audio-ptt-btn${recording ? ' audio-ptt-btn--active' : ''}`}
          onMouseDown={startRecord}
          onMouseUp={stopRecord}
          onTouchStart={startRecord}
          onTouchEnd={stopRecord}
        >
          <Mic size={16} />
          {recording ? 'Release to Send' : 'Hold to Talk'}
        </button>
        <p className="audio-ptt-hint">
          Recorded clips are saved to the incident log automatically
        </p>
      </div>
    </div>
  )
}
