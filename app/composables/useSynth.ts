// Piccoli suoni sintetizzati (palmas, sirena, bip) senza file audio.
let ctx: AudioContext | null = null

export function useSynth() {
  const { state } = useGame()

  function ac() {
    if (typeof window === 'undefined' || state.muted) return null
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!C) return null
      ctx = new C()
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  }

  /** nota breve */
  function tone(freq: number, dur = 0.12, type: OscillatorType = 'square', vol = 0.12) {
    // vibrazione sui telefoni Android: breve sui colpi riusciti, più lunga sugli errori
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(freq < 200 ? 90 : freq > 600 ? 12 : 0) } catch { /* ignora */ }
    }
    const c = ac(); if (!c) return
    const o = c.createOscillator(); const g = c.createGain()
    o.type = type; o.frequency.value = freq
    g.gain.setValueAtTime(vol, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
    o.connect(g).connect(c.destination)
    o.start(); o.stop(c.currentTime + dur)
  }

  /** battito di mani flamenco (rumore filtrato) */
  function clap(vol = 0.35) {
    const c = ac(); if (!c) return
    const len = Math.floor(c.sampleRate * 0.12)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
    const s = c.createBufferSource(); s.buffer = buf
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.8
    const g = c.createGain(); g.gain.value = vol
    s.connect(f).connect(g).connect(c.destination)
    s.start()
  }

  /** sirena della Guardia */
  function siren(dur = 0.9) {
    const c = ac(); if (!c) return
    const o = c.createOscillator(); const g = c.createGain()
    o.type = 'sawtooth'
    const t0 = c.currentTime
    for (let i = 0; i < 4; i++) {
      o.frequency.setValueAtTime(i % 2 ? 620 : 880, t0 + (i * dur) / 4)
    }
    g.gain.setValueAtTime(0.09, t0); g.gain.linearRampToValueAtTime(0.001, t0 + dur)
    o.connect(g).connect(c.destination)
    o.start(); o.stop(t0 + dur)
  }

  return { tone, clap, siren }
}
