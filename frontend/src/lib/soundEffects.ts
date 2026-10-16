/**
 * Web Audio API synthesizer for clean, pleasant UI notifications.
 *
 * Generates an ethereal dual-tone harmonic chime without needing external mp3 files.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('aiva_sound_muted') === 'true'
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('aiva_sound_muted', muted ? 'true' : 'false')
}

export function toggleSoundMuted(): boolean {
  const current = isSoundMuted()
  setSoundMuted(!current)
  return !current
}

/**
 * Plays a soft, elegant glass-like notification chime.
 * Tone: E5 (659.25 Hz) followed smoothly by B5 (987.77 Hz) with gentle exponential decay.
 */
export function playChime(): void {
  if (isSoundMuted()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // First tone (E5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(659.25, now)
    gain1.gain.setValueAtTime(0.08, now)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.6)

    // Second tone (B5 harmonic) slightly delayed
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(987.77, now + 0.08)
    gain2.gain.setValueAtTime(0.06, now + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.08)
    osc2.stop(now + 0.8)
  } catch {
    // Graceful silence if audio permissions or browser blocks autoplay
  }
}
