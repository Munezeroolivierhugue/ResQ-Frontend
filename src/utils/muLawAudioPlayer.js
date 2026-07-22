// Decodes Twilio's inbound Media Stream audio (mulaw, 8-bit, 8000Hz mono)
// and plays it back live through the Web Audio API, one ~20ms frame at a time.

const MULAW_DECODE_TABLE = (() => {
  const table = new Int16Array(256)
  for (let i = 0; i < 256; i++) {
    let muVal = ~i & 0xff
    const sign = muVal & 0x80
    const exponent = (muVal >> 4) & 0x07
    const mantissa = muVal & 0x0f
    let sample = ((mantissa << 3) + 0x84) << exponent
    sample -= 0x84
    table[i] = sign ? -sample : sample
  }
  return table
})()

function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

// Encodes one 16-bit PCM sample to an 8-bit mulaw byte (inverse of the decode
// table above) — standard G.711 mu-law encoding.
function encodeMuLawSample(sample) {
  const MULAW_MAX = 0x1fff
  const MULAW_BIAS = 33
  let sign = (sample >> 8) & 0x80
  if (sign !== 0) sample = -sample
  if (sample > MULAW_MAX) sample = MULAW_MAX
  sample += MULAW_BIAS
  let exponent = 7
  for (let mask = 0x4000; (sample & mask) === 0 && exponent > 0; mask >>= 1) exponent--
  const mantissa = (sample >> (exponent + 3)) & 0x0f
  return ~(sign | (exponent << 4) | mantissa) & 0xff
}

export class MuLawAudioPlayer {
  constructor() {
    this.ctx = null
    this.nextStartTime = 0
  }

  _ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 8000 })
      this.nextStartTime = this.ctx.currentTime
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  /** Feed one base64-encoded mulaw frame; schedules it right after whatever's already queued. */
  pushChunk(base64Payload) {
    const ctx = this._ensureContext()
    const muBytes = base64ToBytes(base64Payload)
    const pcm = new Float32Array(muBytes.length)
    for (let i = 0; i < muBytes.length; i++) {
      pcm[i] = MULAW_DECODE_TABLE[muBytes[i]] / 32768
    }

    const buffer = ctx.createBuffer(1, pcm.length, 8000)
    buffer.copyToChannel(pcm, 0)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    const startAt = Math.max(this.nextStartTime, ctx.currentTime)
    source.start(startAt)
    this.nextStartTime = startAt + buffer.duration
  }

  stop() {
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}

// Frame size Twilio expects: 160 samples = 20ms at 8000Hz.
const FRAME_SAMPLES = 160

/**
 * Captures the dispatcher's mic, downsamples to 8000Hz mono, mulaw-encodes it,
 * and hands base64 frames to `onFrame` — feeds the dispatcher's voice back
 * into the live Twilio call (see CallAudioController on the backend).
 */
export class MicUplinkRecorder {
  constructor(onFrame) {
    this.onFrame = onFrame
    this.ctx = null
    this.stream = null
    this.processor = null
    this.source = null
    this._carry = []
    this.muted = false
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.source = this.ctx.createMediaStreamSource(this.stream)

    // ScriptProcessorNode is deprecated but has the broadest browser support
    // for this kind of raw-sample access without shipping an AudioWorklet module.
    this.processor = this.ctx.createScriptProcessor(2048, 1, 1)
    const ratio = this.ctx.sampleRate / 8000

    this.processor.onaudioprocess = (e) => {
      if (this.muted) return
      const input = e.inputBuffer.getChannelData(0)
      // Naive decimation (pick every Nth sample) — adequate for voice-band
      // speech intelligibility at mulaw's already-lossy 8-bit encoding.
      for (let i = 0; i < input.length; i += ratio) {
        const sample = Math.max(-1, Math.min(1, input[Math.floor(i)]))
        this._carry.push(encodeMuLawSample(Math.round(sample * 32767)))
        if (this._carry.length >= FRAME_SAMPLES) {
          const frame = new Uint8Array(this._carry.splice(0, FRAME_SAMPLES))
          this.onFrame(bytesToBase64(frame))
        }
      }
    }

    // Some browsers only fire onaudioprocess if the node is connected through
    // to the destination — route through a zero-gain node so nothing is heard.
    const silentGain = this.ctx.createGain()
    silentGain.gain.value = 0
    this.source.connect(this.processor)
    this.processor.connect(silentGain)
    silentGain.connect(this.ctx.destination)
  }

  setMuted(muted) {
    this.muted = muted
  }

  stop() {
    this.processor?.disconnect()
    this.source?.disconnect()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.ctx?.close()
    this.processor = null
    this.source = null
    this.stream = null
    this.ctx = null
    this._carry = []
  }
}
