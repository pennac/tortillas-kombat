// page_view a ogni cambio di pagina (l'app è una SPA) + installazione della PWA
export default defineNuxtPlugin(() => {
  const { pageView, track, load } = useAnalytics()
  load()
  const router = useRouter()
  router.afterEach((to) => { nextTick(() => pageView(to.fullPath)) })
  window.addEventListener('appinstalled', () => track('pwa_install'))
})
