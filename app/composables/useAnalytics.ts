// Google Analytics 4 con consenso: niente cookie né script finché l'utente non accetta.
// L'ID si imposta su Netlify con NUXT_PUBLIC_GA_ID; senza ID gli eventi vengono ignorati.
declare global {
  interface Window { dataLayer: unknown[]; gtag?: (...args: unknown[]) => void }
}

let loaded = false

export function useAnalytics() {
  const { state, setConsent } = useGame()
  const gaId = useRuntimeConfig().public.gaId as string

  function load() {
    if (loaded || !gaId || state.consent !== 'yes' || typeof window === 'undefined') return
    loaded = true
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() { window.dataLayer.push(arguments) } // eslint-disable-line prefer-rest-params
    window.gtag('js', new Date())
    window.gtag('config', gaId, { send_page_view: false, anonymize_ip: true })
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(s)
  }

  /** evento GA4 (solo con consenso) */
  function track(name: string, params: Record<string, unknown> = {}) {
    if (!gaId || state.consent !== 'yes') return
    load()
    window.gtag?.('event', name, {
      lang: state.lang,
      standalone: isStandalone(),
      ...params
    })
  }

  function pageView(path: string) {
    track('page_view', { page_path: path, page_location: location.href, page_title: document.title })
  }

  function accept() { setConsent('yes'); load(); pageView(location.pathname + location.hash) }
  function refuse() { setConsent('no') }

  return { track, pageView, accept, refuse, load, enabled: !!gaId }
}

/** l'app è aperta come app installata? */
export function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
}
