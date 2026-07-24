import { create } from 'zustand'
import { subscribe, publish } from '../lib/wsClient'
import { endCall as endCallApi } from '../api/calls'
import { MuLawAudioPlayer, MicUplinkRecorder } from '../utils/muLawAudioPlayer'
import { useCallChannelStore } from './callChannelStore'

// Plain module-level handles — not reactive state, just lifecycle objects
// the store methods below create/tear down.
let timerInterval = null
let statusUnsub = null
let audioUnsub = null
let micRecorder = null
let audioPlayer = null
let clearCardTimer = null

/**
 * Tracks the dispatcher's currently-active call — timer, mute state, and the
 * live two-way audio pipe — independent of which page is mounted. Previously
 * all of this lived as local state inside NewIncident.jsx, so navigating to
 * any other page while a call was in progress made it vanish entirely: no
 * indication a call was still live, no way to mute or end it, and the mic
 * uplink itself kept running invisibly with no UI to stop it from.
 */
export const useCallAudioStore = create((set, get) => ({
  callId: null,
  callPhone: null,
  callElapsed: 0,
  isMuted: false,
  callHasEnded: false,
  audioStarted: false,
  audioListening: false,
  micError: null,

  /** Idempotent — safe to call from anywhere a callId becomes known. */
  initCall: (callId, callPhone) => {
    if (!callId || get().callId === callId) return
    get()._cleanup()
    clearTimeout(clearCardTimer)
    set({
      callId, callPhone, callElapsed: 0, isMuted: false, callHasEnded: false,
      audioStarted: false, audioListening: false, micError: null,
    })
    timerInterval = setInterval(() => {
      if (!get().callHasEnded) set((s) => ({ callElapsed: s.callElapsed + 1 }))
    }, 1000)
    statusUnsub = subscribe(`/topic/calls/${callId}/status`, (evt) => {
      if (evt?.type === 'call_ended') get()._onCallEnded()
    })
  },

  startAudio: () => {
    const { callId, audioStarted } = get()
    if (!callId || audioStarted) return
    audioPlayer = new MuLawAudioPlayer()
    micRecorder = new MicUplinkRecorder((base64Frame) => {
      publish(`/app/calls/${callId}/audio`, { payload: base64Frame })
    })
    micRecorder.start().catch(() => set({ micError: 'Could not access microphone' }))
    audioUnsub = subscribe(`/topic/calls/${callId}/audio`, (msg) => {
      if (msg?.type === 'audio_chunk' && msg.payload && audioPlayer) {
        audioPlayer.pushChunk(msg.payload)
        set({ audioListening: true })
      }
    })
    set({ audioStarted: true })
  },

  toggleMute: () => {
    const next = !get().isMuted
    micRecorder?.setMuted(next)
    set({ isMuted: next })
  },

  /** Dispatcher clicked "End call". */
  endCurrentCall: () => {
    const { callId } = get()
    if (callId) endCallApi(callId).catch(() => {})
    try {
      sessionStorage.removeItem('resq-active-call')
      if (callId) sessionStorage.removeItem(`resq-intake-${callId}`)
    } catch {}
    get()._onCallEnded()
  },

  /** Caller hanging up, or the dispatcher ending it — same cleanup either way. */
  _onCallEnded: () => {
    if (get().callHasEnded) return
    set({ callHasEnded: true })
    micRecorder?.stop(); micRecorder = null
    audioPlayer?.stop(); audioPlayer = null
    audioUnsub?.(); audioUnsub = null
    clearInterval(timerInterval); timerInterval = null
    // callChannelStore.currentCall gates whether a *new* incoming call can
    // even show its ringing banner ("ignore if a call is already active") —
    // leaving it set after this call ended would silently block every call
    // that came in afterward.
    useCallChannelStore.getState().endCall()
    // Show "Call ended" briefly, then the card disappears on its own instead
    // of lingering indefinitely with dead Mute/End call buttons.
    clearCardTimer = setTimeout(() => {
      if (get().callHasEnded) get()._cleanup()
    }, 4000)
  },

  _cleanup: () => {
    clearInterval(timerInterval); timerInterval = null
    statusUnsub?.(); statusUnsub = null
    audioUnsub?.(); audioUnsub = null
    micRecorder?.stop(); micRecorder = null
    audioPlayer?.stop(); audioPlayer = null
    set({
      callId: null, callPhone: null, callElapsed: 0, isMuted: false,
      callHasEnded: false, audioStarted: false, audioListening: false, micError: null,
    })
  },
}))
