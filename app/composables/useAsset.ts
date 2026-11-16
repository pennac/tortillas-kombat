/**
 * Percorso di un file pubblico. Funziona su Netlify, nell'anteprima con percorsi relativi
 * e, se è impostato NUXT_PUBLIC_MEDIA_URL, prende i file di media/ da un CDN esterno (es. Cloudflare R2).
 */
export function useAsset() {
  const config = useRuntimeConfig()
  const base = config.app.cdnURL || config.app.baseURL || '/'
  const media = ((config.public.mediaUrl as string) || '').replace(/\/$/, '')
  return (path: string) => {
    const p = path.replace(/^\//, '')
    if (media && p.startsWith('media/')) return `${media}/${p}`
    return (base.endsWith('/') ? base : base + '/') + p
  }
}

let lite: boolean | null = null
/** con rete lenta o "risparmio dati" i video delle scene usano la versione leggera (540p) */
export function useLiteVideo() {
  if (lite === null && typeof navigator !== 'undefined') {
    // senza rete si usa la scelta fatta l'ultima volta (è quella scaricata per l'offline)
    const saved = (() => { try { return localStorage.getItem('tk_lite') } catch { return null } })()
    if (!navigator.onLine && saved !== null) {
      lite = saved === '1'
    } else {
      const c = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string; downlink?: number } }).connection
      lite = !!c && (!!c.saveData || ['slow-2g', '2g', '3g'].includes(c.effectiveType || '') || (typeof c.downlink === 'number' && c.downlink > 0 && c.downlink < 2.5))
      try { localStorage.setItem('tk_lite', lite ? '1' : '0') } catch { /* ignora */ }
    }
  }
  return (path: string) => (lite ? path.replace(/\.mp4$/, '.lite.mp4') : path)
}
