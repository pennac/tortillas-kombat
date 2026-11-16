// Voz del Horno e brevi suoni: un elemento <audio> per file, riusato.
const cache = new Map<string, HTMLAudioElement>()

export const VOZ = {
  vuelco: 'media/voz/voz-vuelco.mp3',
  dale: 'media/voz/voz-dale-la-vuelta.mp3',
  fritality: 'media/voz/voz-fritality.mp3',
  tostada: 'media/voz/voz-tostada.mp3',
  round: 'media/voz/voz-round-uno.mp3',
  cocinar: 'media/voz/voz-a-cocinar.mp3',
  eliminado: 'media/voz/voz-concursante-eliminado.mp3',
  expulsion: 'media/voz/voz-sala-de-expulsion.mp3',
  ganador: 'media/voz/voz-ganador.mp3'
} as const

export function useSfx() {
  const asset = useAsset()
  const { state } = useGame()

  function play(path: string, volume = 1) {
    if (typeof window === 'undefined' || state.muted) return Promise.resolve()
    let a = cache.get(path)
    if (!a) {
      a = new Audio(asset(path))
      a.preload = 'auto'
      cache.set(path, a)
    }
    a.volume = volume
    a.currentTime = 0
    return a.play().catch(() => {})
  }

  /** suona e aspetta la fine (o un tempo massimo) */
  function playAndWait(path: string, maxMs = 2500) {
    return new Promise<void>((resolve) => {
      play(path)
      const a = cache.get(path)
      const done = () => resolve()
      const timer = setTimeout(done, maxMs)
      a?.addEventListener('ended', () => { clearTimeout(timer); done() }, { once: true })
    })
  }

  return { play, playAndWait }
}
