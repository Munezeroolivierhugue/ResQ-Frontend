// Programmatically generated notification chime — no audio asset, no
// licensing concern. Uses the Web Audio API to play a short two-tone
// beep (~250ms) whenever a live notification arrives over the WebSocket.

export const SOUND_MUTE_KEY = 'resq-notification-sound-muted'

export function isNotificationSoundMuted() {
  try {
    return localStorage.getItem(SOUND_MUTE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setNotificationSoundMuted(muted) {
  try {
    localStorage.setItem(SOUND_MUTE_KEY, muted ? 'true' : 'false')
  } catch {
    // ignore storage failures (private browsing, etc.)
  }
}

let sharedCtx = null
function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!sharedCtx) sharedCtx = new Ctx()
  return sharedCtx
}

/**
 * Plays a short two-tone chime for a newly-arrived live notification.
 * No-ops silently if the user has muted sound or the browser has no
 * Web Audio support / requires a user gesture that hasn't happened yet.
 */
export function playNotificationSound() {
  if (isNotificationSoundMuted()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})

    const now = ctx.currentTime
    const tones = [
      { freq: 880, start: 0, duration: 0.11 },
      { freq: 1175, start: 0.12, duration: 0.14 },
    ]

    tones.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + start)
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + duration + 0.02)
    })
  } catch {
    // Never let a sound failure break notification delivery.
  }
}
