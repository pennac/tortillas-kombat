// Installazione come app: Android/desktop usano il prompt del browser, iPhone mostra le istruzioni
export function useInstall() {
  const { track } = useAnalytics()
  const pwa = useNuxtApp().$pwa
  const isIOS = ref(false)
  const iosTip = ref(false)
  onMounted(() => { isIOS.value = /iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone() })
  const canInstall = computed(() => !!pwa?.showInstallPrompt || isIOS.value)
  async function install() {
    track('pwa_install_click', { ios: isIOS.value })
    if (pwa?.showInstallPrompt) await pwa.install()
    else iosTip.value = true
  }
  return { canInstall, install, iosTip }
}

export const INSTAGRAM = 'https://www.instagram.com/tortillas.kombat/'
