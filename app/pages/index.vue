<script setup lang="ts">
// Landing di presentazione (IT/ES) con la CTA che porta al gioco (/play)
import { episodes } from '~/data/episodes'
import { roster } from '~/data/roster'

const { state, t } = useGame()
const asset = useAsset()
const route = useRoute()
const router = useRouter()
const { track } = useAnalytics()
const { canInstall, install, iosTip } = useInstall()
const L = computed(() => t.value.landing)
const ig = INSTAGRAM

// i link dei promo (?clave=FLUJO) vanno dritti al terminale
onMounted(() => {
  if (route.query.clave) router.replace({ path: '/play', query: { clave: route.query.clave } })
})

useHead(() => ({
  htmlAttrs: { lang: state.lang },
  title: state.lang === 'it' ? 'Tortillas Kombat · ¡VUELCO! — il gioco a puntate' : 'Tortillas Kombat · ¡VUELCO! — el juego por galas',
  meta: [{ name: 'description', content: L.value.tagline }]
}))

const cast = ['patato', 'aceituna', 'huevo', 'roto', 'flujo', 'jamonero', 'carxofa', 'chema']
  .map((id) => roster.find((f) => f.id === id)!)
  .filter(Boolean)

function play(where: string) {
  track('landing_cta', { where })
  router.push('/play')
}

function cookiePrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem('tk_vuelco_v1') || '{}')
    raw.consent = null
    localStorage.setItem('tk_vuelco_v1', JSON.stringify(raw))
  } catch { /* ignora */ }
  location.reload()
}
</script>

<template>
  <div class="landing">
    <!-- HERO -->
    <header class="hero">
      <video class="media-fill" :src="asset('media/home/copertina.mp4')" :poster="asset('media/home/copertina.jpg')" autoplay muted loop playsinline />
      <div class="shade" />
      <nav class="top">
        <span class="brand">TK</span>
        <LangSwitch />
      </nav>
      <div class="hero-text">
        <p class="kicker inked">{{ L.kicker }}</p>
        <h1 class="inked">¡VUELCO!<small>El Show</small></h1>
        <p class="tagline">{{ L.tagline }}</p>
        <button class="btn red cta" @click="play('hero')">{{ L.cta }} ▶</button>
        <p class="ctasub">{{ L.ctaSub }}</p>
      </div>
    </header>

    <!-- STORIA -->
    <section class="block paper">
      <h2 class="inked">{{ L.loglineTitle }}</h2>
      <p class="logline">{{ L.logline }}</p>
    </section>

    <!-- COME SI GIOCA -->
    <section class="block">
      <h2 class="inked">{{ L.howTitle }}</h2>
      <ol class="steps">
        <li v-for="(s, k) in L.steps" :key="k">
          <span class="num inked">{{ k + 1 }}</span>
          <div>
            <h3>{{ s.icon }} {{ s.title }}</h3>
            <p>{{ s.text }}</p>
          </div>
        </li>
      </ol>
    </section>

    <!-- CAST -->
    <section class="block dark">
      <h2 class="inked">{{ L.castTitle }}</h2>
      <div class="cast">
        <figure v-for="f in cast" :key="f.id" :style="{ '--c': f.color }">
          <img :src="asset(`media/roster/roster-${f.id}.jpg`)" :alt="f.name" loading="lazy">
          <figcaption><b>{{ f.name }}</b><span>{{ f.epithet[state.lang] }}</span></figcaption>
        </figure>
      </div>
    </section>

    <!-- PUNTATE -->
    <section class="block">
      <h2 class="inked">{{ L.galasTitle }}</h2>
      <p class="sub">{{ L.galasSub }}</p>
      <div class="galas">
        <article v-for="ep in episodes" :key="ep.n">
          <img :src="asset(ep.scenes[0]!.poster)" alt="" loading="lazy">
          <div>
            <span class="pill">{{ ep.n === 6 ? '★' : `${t.episode} ${ep.n}` }}</span>
            <h3>{{ ep.title[state.lang] }}</h3>
          </div>
        </article>
      </div>
    </section>

    <!-- APP -->
    <section class="block paper app">
      <img :src="asset('icons/icon-192.png')" alt="" class="appicon">
      <div>
        <h2 class="inked">{{ L.appTitle }}</h2>
        <p>{{ L.appText }}</p>
        <button v-if="canInstall" class="btn" @click="install">{{ t.install }}</button>
      </div>
    </section>

    <!-- CTA FINALE -->
    <section class="block final">
      <h2 class="inked">{{ L.finalTitle }}</h2>
      <button class="btn red cta" @click="play('final')">{{ L.cta }} ▶</button>
      <NuxtLink to="/play" class="keylink">{{ L.keywordLink }} 🔑</NuxtLink>
    </section>

    <footer>
      <a :href="ig" target="_blank" rel="noopener">📸 {{ L.follow }} · @tortillas.kombat</a>
      <button type="button" class="linkbtn" @click="cookiePrefs">{{ L.cookies }}</button>
      <p>© Tortillas Kombat · ¡VUELCO! El Show</p>
    </footer>

    <IosTip v-if="iosTip" @close="iosTip = false" />
  </div>
</template>

<style scoped>
.landing { min-height: 100dvh; background: var(--ink); overflow-x: hidden; user-select: text; }

/* HERO: alto quanto lo schermo, testo in basso sopra il video */
.hero { position: relative; height: 100svh; min-height: 560px; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; }
.hero video { object-position: center 30%; }
.shade { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(20,17,13,.55) 0%, transparent 25%, transparent 45%, rgba(20,17,13,.92) 78%, var(--ink) 100%); }
.top {
  position: absolute; top: 0; left: 0; right: 0; z-index: 2;
  display: flex; justify-content: space-between; align-items: center;
  padding: calc(12px + env(safe-area-inset-top)) 16px 0;
}
.brand { font-family: var(--title); font-size: 1.6rem; color: var(--yolk); text-shadow: 2px 2px 0 var(--ink); letter-spacing: .05em; }
.hero-text { position: relative; z-index: 2; padding: 0 20px calc(28px + env(safe-area-inset-bottom)); text-align: center; max-width: 640px; margin: 0 auto; width: 100%; }
.kicker { margin: 0; color: var(--paper); font-size: 1.1rem; letter-spacing: .12em; }
h1 { margin: 0; font-size: clamp(3.6rem, 18vw, 6.5rem); line-height: .9; color: var(--yolk); transform: rotate(-3deg); }
h1 small { display: block; font-size: .38em; color: var(--paper); transform: rotate(2deg); }
.tagline { font-size: 1.15rem; font-weight: 700; margin: .9em 0 1.1em; text-shadow: 1px 1px 0 var(--ink); }
.cta { font-size: 1.8rem; padding: .45em 1.2em; width: 100%; max-width: 360px; }
.ctasub { margin: .6em 0 0; font-size: .85rem; opacity: .8; }

/* blocchi */
.block { padding: 44px 20px; max-width: 720px; margin: 0 auto; }
.block h2 { margin: 0 0 .5em; font-size: 2.3rem; color: var(--yolk); }
.block.paper { background: var(--paper); color: var(--ink); max-width: none; }
.block.paper > * { max-width: 680px; margin-left: auto; margin-right: auto; }
.block.paper h2 { color: var(--red); }
.block.dark { max-width: none; background: #1d1913; }
.block.dark > * { max-width: 980px; margin-left: auto; margin-right: auto; }
.logline { font-size: 1.15rem; line-height: 1.45; font-weight: 700; margin: 0; }
.sub { margin: -.3em 0 1.2em; opacity: .85; }

.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.steps li { display: flex; gap: 14px; align-items: flex-start; background: rgba(239,230,210,.06); border: 2px solid rgba(239,230,210,.18); border-radius: 14px; padding: 14px; }
.num { flex: 0 0 auto; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--yolk); color: var(--ink); font-size: 1.6rem; }
.steps h3 { margin: 0 0 .2em; font-family: var(--title); letter-spacing: .05em; font-size: 1.3rem; color: var(--paper); }
.steps p { margin: 0; line-height: 1.35; }

/* cast: scorrimento orizzontale col pollice */
.cast { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 4px 4px 14px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.cast::-webkit-scrollbar { display: none; }
.cast figure { flex: 0 0 44%; max-width: 200px; margin: 0; scroll-snap-align: start; border: 3px solid var(--ink); border-radius: 12px; overflow: hidden; background: var(--c); box-shadow: 4px 4px 0 #000; }
.cast img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; display: block; }
.cast figcaption { padding: 8px 10px 10px; background: var(--ink); }
.cast b { display: block; font-family: var(--title); letter-spacing: .05em; font-size: 1.15rem; color: var(--yolk); }
.cast span { font-size: .82rem; line-height: 1.2; display: block; }

.galas { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.galas article { position: relative; border-radius: 12px; overflow: hidden; border: 3px solid var(--ink); aspect-ratio: 3 / 4; box-shadow: 4px 4px 0 #000; }
.galas img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.galas article > div { position: absolute; left: 0; right: 0; bottom: 0; padding: 30px 10px 10px; background: linear-gradient(transparent, rgba(20,17,13,.95)); }
.galas article:last-child { grid-column: 1 / -1; aspect-ratio: 16 / 9; }
.galas article:last-child img { object-position: center 35%; }
.galas h3 { margin: .3em 0 0; font-family: var(--title); letter-spacing: .04em; font-size: 1.2rem; color: var(--paper); line-height: 1.05; }

.app { display: flex; gap: 16px; align-items: center; justify-content: center; }
.app > div { margin: 0; }
.appicon { width: 84px; height: 84px; border-radius: 20px; border: 3px solid var(--ink); box-shadow: 3px 3px 0 var(--ink); flex: 0 0 auto; margin: 0 !important; }
.app p { margin: 0 0 .8em; font-weight: 700; line-height: 1.35; }

.final { text-align: center; padding-bottom: 30px; }
.final h2 { font-size: 2.8rem; }
.keylink { display: block; margin-top: 1em; color: var(--paper); font-weight: 700; }

footer { text-align: center; padding: 20px 20px calc(30px + env(safe-area-inset-bottom)); border-top: 1px solid rgba(239,230,210,.15); font-size: .9rem; }
footer a { color: var(--yolk); font-weight: 700; text-decoration: none; }
footer p { opacity: .5; margin: .8em 0 0; }
.linkbtn { display: block; margin: .8em auto 0; background: none; border: 0; color: var(--paper); opacity: .7; text-decoration: underline; font-size: .85rem; }

/* tablet e desktop */
@media (min-width: 760px) {
  .galas { grid-template-columns: repeat(4, 1fr); }
  .galas article:last-child { grid-column: span 1; aspect-ratio: 3 / 4; }
  .app > div { max-width: 520px; }
  .cast figure { flex-basis: 23%; }
  .steps { grid-template-columns: repeat(3, 1fr); }
  .steps li { flex-direction: column; }
  .block { padding: 64px 32px; }
}
</style>
