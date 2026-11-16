// Tortillas Kombat Game — ¡VUELCO! El Show
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@vite-pwa/nuxt'],
  // ID di Google Analytics 4: si imposta su Netlify con la variabile NUXT_PUBLIC_GA_ID (es. G-XXXXXXXXXX)
  // NUXT_PUBLIC_MEDIA_URL: se i video stanno su un CDN esterno (es. https://media.tuodominio.com), altrimenti vuoto
  runtimeConfig: { public: { gaId: '', mediaUrl: '' } },
  css: [
    '@fontsource/bangers/400.css',
    '@fontsource/comic-neue/400.css',
    '@fontsource/comic-neue/700.css',
    '~/assets/css/main.css'
  ],
  // PREVIEW=1 → build con percorsi relativi e routing a hash, per l'anteprima
  app: {
    cdnURL: process.env.PREVIEW ? './' : undefined,
    buildAssetsDir: process.env.PREVIEW ? '/static/' : '/_nuxt/',
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'Tortillas Kombat · ¡VUELCO! El Show',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0d0b09' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: '¡VUELCO!' },
        { name: 'description', content: 'El cooking show-picchiaduro del régimen. Introduce la palabra clave y entra en antena.' },
        { property: 'og:title', content: 'Tortillas Kombat · ¡VUELCO! El Show' },
        { property: 'og:image', content: '/icons/og-image.jpg' /* meglio con l'URL completo del dominio */ },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32.png' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }
      ]
    }
  },
  // App installabile (PWA): niente service worker nell'anteprima
  pwa: {
    disable: !!process.env.PREVIEW,
    registerType: 'autoUpdate',
    manifest: {
      name: 'Tortillas Kombat · ¡VUELCO! El Show',
      short_name: '¡VUELCO!',
      description: 'El cooking show-picchiaduro del régimen.',
      lang: 'es',
      start_url: '/play',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#0d0b09',
      theme_color: '#0d0b09',
      categories: ['games', 'entertainment'],
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      // guscio dell'app + grafica e voci leggere: funzionano anche senza rete
      globPatterns: ['**/*.{js,css,html,woff2}', 'icons/*.png', 'media/ui/*.webp', 'media/sprites/*.webp', 'media/voz/*.mp3'],
      navigateFallback: '/',
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      runtimeCaching: [
        {
          // immagini (poster, ritratti, sfondi)
          urlPattern: /^https?:\/\/[^/]+\/media\/.*\.(?:jpg|webp|png)$/,
          handler: 'CacheFirst',
          options: { cacheName: 'tk-img', expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 } }
        },
        {
          // musica: si salva quando la si ascolta
          urlPattern: /^https?:\/\/[^/]+\/media\/.*\.mp3$/,
          handler: 'CacheFirst',
          options: { cacheName: 'tk-audio', rangeRequests: true, cacheableResponse: { statuses: [200] }, expiration: { maxEntries: 60 } }
        },
        {
          // video: serviti dalla cache solo se la puntata è stata scaricata per l'offline
          urlPattern: /^https?:\/\/[^/]+\/media\/.*\.mp4$/,
          handler: 'CacheFirst',
          options: { cacheName: 'tk-video', rangeRequests: true, cacheableResponse: { statuses: [200] } }
        }
      ]
    },
    client: { installPrompt: true },
    devOptions: { enabled: false }
  },
  router: { options: { hashMode: !!process.env.PREVIEW } },
  nitro: {
    prerender: {
      routes: ['/', '/play', '/legal', '/roster', '/puntata/0', '/puntata/1', '/puntata/2', '/puntata/3', '/puntata/4', '/puntata/5', '/puntata/6']
    }
  }
})
