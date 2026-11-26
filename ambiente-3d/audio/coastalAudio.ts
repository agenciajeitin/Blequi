/**
 * Lightweight 100% procedural Web Audio synthesizer for Coastal Blequi ambiance & tactile UI pops.
 * Zero external audio files — gentle filtered ocean surf + playful tropical marimba clicks.
 */
class CoastalAudioEngine {
  private ctx: AudioContext | null = null
  private oceanGain: GainNode | null = null
  private oceanSource: AudioBufferSourceNode | null = null
  private lfo: OscillatorNode | null = null
  private enabled = false

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return null
      this.ctx = new AudioCtx()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  setEnabled(on: boolean) {
    this.enabled = on
    if (on) {
      this.startOceanAmbiance()
      this.playPop(580, 0.08)
    } else {
      this.stopOceanAmbiance()
    }
  }

  private startOceanAmbiance() {
    const ctx = this.ensureContext()
    if (!ctx || this.oceanSource) return

    const bufferSize = ctx.sampleRate * 4
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = data[i]
      data[i] *= 2.4
    }

    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 340
    filter.Q.value = 0.7

    const gain = ctx.createGain()
    gain.gain.value = 0.045

    // Gentle wave swell LFO
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.14
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.022
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    source.start()
    lfo.start()

    this.oceanSource = source
    this.oceanGain = gain
    this.lfo = lfo
  }

  private stopOceanAmbiance() {
    try {
      this.oceanSource?.stop()
      this.lfo?.stop()
      this.oceanSource?.disconnect()
      this.oceanGain?.disconnect()
    } catch {}
    this.oceanSource = null
    this.oceanGain = null
    this.lfo = null
  }

  playPop(freq = 520, duration = 0.07) {
    if (!this.enabled) return
    const ctx = this.ensureContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.42, now + duration)
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration)
  }

  playChime() {
    if (!this.enabled) return
    this.playPop(523.25, 0.09)
    setTimeout(() => this.playPop(659.25, 0.11), 65)
    setTimeout(() => this.playPop(783.99, 0.14), 130)
  }
}

export const coastalAudio = new CoastalAudioEngine()
