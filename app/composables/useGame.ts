import { episodes, type Lang } from '~/data/episodes'
import { ui } from '~/data/ui'

const STORE = 'tk_vuelco_v1'

interface SaveData {
  lang: Lang
  /** puntata più alta sbloccata */
  unlocked: number
  /** ultima posizione giocata */
  last: { ep: number; scene: number } | null
  /** audio spento da tutto il gioco */
  muted: boolean
  /** guadagni e popolarità del servizio alla Tartana */
  pesetas: number
  hype: number
  /** consenso ai cookie di analisi */
  consent: 'yes' | 'no' | null
}

const state = reactive<SaveData>({ lang: 'es', unlocked: -1, last: null, muted: false, pesetas: 0, hype: 0, consent: null })
let loaded = false

function load() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const raw = localStorage.getItem(STORE)
    if (raw) Object.assign(state, JSON.parse(raw))
    else state.lang = navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'es'
  } catch { /* storage non disponibile */ }
}

function save() {
  try { localStorage.setItem(STORE, JSON.stringify(state)) } catch { /* ignora */ }
}

export function normalizeKeyword(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase()
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export function useGame() {
  load()

  const t = computed(() => ui[state.lang])

  function setConsent(c: 'yes' | 'no') {
    state.consent = c
    save()
  }

  function setLang(l: Lang) {
    state.lang = l
    document.documentElement.lang = l
    save()
  }

  /** restituisce la puntata della parola, oppure null */
  async function resolveKeyword(input: string) {
    const word = normalizeKeyword(input)
    if (!word) return null
    const h = await sha256(word)
    return episodes.find(e => e.keywordHash === h) ?? null
  }

  function unlock(n: number) {
    if (n > state.unlocked) state.unlocked = n
    save()
  }

  function setLast(ep: number, scene: number) {
    state.last = { ep, scene }
    save()
  }

  function completeEpisode(n: number) {
    unlock(n + 1)
    state.last = { ep: n + 1, scene: 0 }
    save()
  }

  function setMuted(m: boolean) {
    state.muted = m
    save()
  }

  function addEarnings(pesetas: number, hype: number) {
    state.pesetas = Math.max(0, state.pesetas + pesetas)
    state.hype = Math.max(0, state.hype + hype)
    save()
  }

  return { state: readonly(state), t, setLang, setConsent, resolveKeyword, unlock, setLast, completeEpisode, setMuted, addEarnings }
}
