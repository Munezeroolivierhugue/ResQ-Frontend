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

// ── Dispatcher audio preferences (volume + per-priority tone) ──────────────
// Saved from Dispatcher Settings → Audio. Same localStorage pattern as
// SOUND_MUTE_KEY above and resq-dispatcher-notification-prefs elsewhere.
export const AUDIO_PREFS_KEY = 'resq-dispatcher-audio-prefs'
const DEFAULT_AUDIO_PREFS = {
  volume: 75,
  toneCritical: 'siren',
  toneHigh: 'beep',
  toneMed: 'beep',
}

export function getAudioPrefs() {
  try {
    const raw = localStorage.getItem(AUDIO_PREFS_KEY)
    return raw ? { ...DEFAULT_AUDIO_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_AUDIO_PREFS }
  } catch {
    return { ...DEFAULT_AUDIO_PREFS }
  }
}

export function setAudioPrefs(partial) {
  try {
    const next = { ...getAudioPrefs(), ...partial }
    localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(next))
    return next
  } catch {
    return getAudioPrefs()
  }
}

// Maps a priority string (as sent by the backend on the WS notification
// payload) to which saved tone preference applies.
function toneForPriority(priority) {
  const p = (priority ?? '').toLowerCase()
  const prefs = getAudioPrefs()
  if (p === 'critical') return prefs.toneCritical
  if (p === 'high') return prefs.toneHigh
  return prefs.toneMed
}

// Each named tone is a distinct oscillator pattern so "Alarm Siren" / "Triple
// Beep" / "Horn Blast" are actually audibly different, not just labels.
function playTonePattern(tone, gainScale) {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  const now = ctx.currentTime

  const fire = (freq, start, duration, peak = 0.18) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, now + start)
    gain.gain.linearRampToValueAtTime(peak * gainScale, now + start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + start)
    osc.stop(now + start + duration + 0.02)
  }

  if (tone === 'siren') {
    // Rising/falling two-sweep wail.
    fire(700, 0, 0.22, 0.22)
    fire(1100, 0.1, 0.28, 0.22)
    fire(700, 0.38, 0.22, 0.22)
  } else if (tone === 'horn') {
    // Single low sustained blast.
    fire(320, 0, 0.4, 0.24)
  } else {
    // 'beep' (default) — short triple beep.
    fire(880, 0, 0.11)
    fire(880, 0.16, 0.11)
    fire(880, 0.32, 0.11)
  }
}

/**
 * Plays a short chime for a newly-arrived live notification. Reads the
 * dispatcher's saved volume + per-priority tone preference (set via
 * Dispatcher Settings → Audio) so what's actually heard reflects what was
 * configured, rather than always playing the same fixed two-tone beep.
 * No-ops silently if the user has muted sound or the browser has no
 * Web Audio support / requires a user gesture that hasn't happened yet.
 */
export function playNotificationSound(priority) {
  if (isNotificationSoundMuted()) return
  try {
    const prefs = getAudioPrefs()
    const gainScale = Math.max(0, Math.min(1, (prefs.volume ?? 75) / 100))
    if (gainScale === 0) return
    const tone = priority ? toneForPriority(priority) : prefs.toneMed
    playTonePattern(tone, gainScale)
  } catch {
    // Never let a sound failure break notification delivery.
  }
}

/**
 * Plays a one-off preview of a given tone at the current saved volume —
 * used by the "Test" button next to each tone picker in Dispatcher
 * Settings → Audio.
 */
export function previewTone(tone) {
  if (isNotificationSoundMuted()) return
  try {
    const prefs = getAudioPrefs()
    const gainScale = Math.max(0, Math.min(1, (prefs.volume ?? 75) / 100))
    if (gainScale === 0) return
    playTonePattern(tone, gainScale)
  } catch {
    // Never let a sound failure break the settings preview.
  }
}

/**
 * Plays a longer alternating-tone "ringing" pattern (2-3 cycles) for the
 * dispatcher "Simulate Call" action — meant to sound like an incoming phone
 * call rather than the short two-tone notification chime above. Same raw
 * Web Audio API approach as playNotificationSound(): no external asset.
 */
export function playRingtone() {
  if (isNotificationSoundMuted()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})

    const now = ctx.currentTime
    const cycles = 3
    const cycleDuration = 0.6 // one "ring" cycle
    const toneA = 440
    const toneB = 480

    for (let i = 0; i < cycles; i++) {
      const start = i * cycleDuration
      ;[
        { freq: toneA, offset: 0, duration: 0.2 },
        { freq: toneB, offset: 0.22, duration: 0.2 },
      ].forEach(({ freq, offset, duration }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, now + start + offset)
        gain.gain.linearRampToValueAtTime(0.2, now + start + offset + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + offset + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + start + offset)
        osc.stop(now + start + offset + duration + 0.02)
      })
    }
  } catch {
    // Never let a sound failure break the simulate-call action.
  }
}
