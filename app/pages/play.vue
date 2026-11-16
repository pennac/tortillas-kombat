<script setup lang="ts">
import { episodes } from '~/data/episodes'

const { state, t, resolveKeyword, unlock, setLast } = useGame()
const asset = useAsset()
const { playAndWait } = useSfx()
const tostada = useTostada()
let titleTaps = 0
function tapTitle() {
  titleTaps++
  if (titleTaps >= 3) { titleTaps = 0; tostada.show() }
}
const route = useRoute()
const router = useRouter()
const { track } = useAnalytics()

const { canInstall, install, iosTip } = useInstall()

// Copertina animata: clip in loop, con un "colpo" di rumore TV ogni tanto
const cover = { src: 'media/home/copertina.mp4', poster: 'media/home/copertina.jpg' }
const staticOn = ref(false)
const video = ref<HTMLVideoElement | null>(null)
let zapTimer: ReturnType<typeof setInterval> | undefined
function zap() {
  staticOn.value = false
  requestAnimationFrame(() => { staticOn.value = true })
}

// Form parola chiave
const word = ref('')
const message = ref('')
const errors = ref(0)
const shake = ref(false)
const busy = ref(false)
const entering = ref(false)

const lastEp = computed(() => {
  const l = state.last
  if (!l) return null
  const ep = episodes[l.ep]
  return ep && ep.available ? ep : null
})

async function submit() {
  if (busy.value) return
  busy.value = true
  message.value = ''
  const ep = await resolveKeyword(word.value)
  busy.value = false
  if (!ep) {
    errors.value++
    const list = t.value.wrong
    message.value = list[(errors.value - 1) % list.length]
    if (errors.value >= 3) message.value += ' ' + t.value.wrongHint
    track('keyword_wrong', { attempt: errors.value })
    shake.value = false
    requestAnimationFrame(() => { shake.value = true })
    return
  }
  if (!ep.available) {
    message.value = ep.releaseDate ? `${t.value.onAirFrom} ${ep.releaseDate}` : t.value.comingSoon
    return
  }
  unlock(ep.n)
  setLast(ep.n, 0)
  track('unlock_episode', { episode: ep.n, via: route.query.clave ? 'link' : 'keyword' })
  entering.value = true
  await playAndWait(VOZ.vuelco, 1600)
  router.push(`/puntata/${ep.n}`)
}

function resume() {
  if (lastEp.value) track('resume', { episode: lastEp.value.n })
  if (lastEp.value) router.push(`/puntata/${lastEp.value.n}`)
}

onMounted(() => {
  zapTimer = setInterval(zap, 7250)
  video.value?.play().catch(() => {})
  // link diretto dal promo: /?clave=FLUJO
  const clave = (route.query.clave || route.query.parola) as string | undefined
  if (clave) {
    word.value = clave.toUpperCase()
    submit()
  }
})
onBeforeUnmount(() => clearInterval(zapTimer))
</script>

<template>
  <main class="stage crt home" :class="{ entering }">
    <video
      ref="video"
      class="media-fill cover"
      :src="asset(cover.src)"
      :poster="asset(cover.poster)"
      autoplay muted playsinline loop
    />
    <div class="shade" />
    <div class="static" :class="{ on: staticOn }" />

    <section class="title" @click="tapTitle">
      <p class="tk inked">TORTILLAS KOMBAT <span>{{ t.presents }}</span></p>
      <h1 class="vuelco inked">¡VUELCO! <small>El Show</small></h1>
    </section>

    <form class="panel" :class="{ shake }" @submit.prevent="submit" @animationend="shake = false">
      <div class="panel-top">
        <label for="kw">{{ t.keywordLabel }}</label>
        <LangSwitch />
      </div>
      <div class="console">
        <div class="screen" :style="{ backgroundImage: `url(${asset('media/ui/terminal-schermo.webp')})` }">
          <input
            id="kw"
            v-model="word"
            :placeholder="t.keywordPlaceholder"
            autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20"
          >
        </div>
        <button class="redbtn" type="submit" :disabled="busy || entering" :aria-label="t.enter">
          <img :src="asset('media/ui/terminal-pulsante.webp')" alt="">
          <span class="inked">{{ t.enter }}</span>
        </button>
      </div>
      <p v-if="message" class="msg">{{ message }}</p>
      <p v-else class="hint">{{ t.startHint }} <b @click="word = 'CASTING'">CASTING</b></p>
      <button v-if="lastEp" type="button" class="resume" @click="resume">
        ▶ {{ t.continue }}: {{ t.episode }} {{ lastEp.n }} · {{ lastEp.title[state.lang] }}
      </button>
      <NuxtLink to="/roster" class="rosterlink">☰ {{ t.roster }}</NuxtLink>
      <button v-if="canInstall" type="button" class="installbtn" @click="install">{{ t.install }}</button>
    </form>
    <IosTip v-if="iosTip" @close="iosTip = false" />
    <TostadaEgg />
  </main>
</template>

<style scoped>
.cover { filter: saturate(.85) contrast(1.05); }
.shade {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(10,8,6,.75) 0%, rgba(10,8,6,0) 16%, rgba(10,8,6,0) 58%, rgba(10,8,6,.85) 74%, rgba(10,8,6,.95) 100%);
  z-index: 1;
}
.home.entering .cover { animation: zoomIn 1.4s ease-in forwards; }
@keyframes zoomIn { to { transform: scale(1.25); filter: brightness(1.6) saturate(1.3); } }

.title {
  position: absolute; left: 0; right: 0; top: 10px;
  text-align: center;
  z-index: 10;
  cursor: pointer;
}
.tk {
  margin: 0;
  font-size: clamp(1.25rem, 6vw, 1.7rem);
  color: var(--paper);
  animation: flicker 6s infinite;
}
.tk span { font-size: .7em; color: var(--yolk); letter-spacing: .2em; margin-left: .3em; }
.vuelco {
  margin: -.1em 0 0;
  font-size: clamp(2.8rem, 14vw, 4.2rem);
  line-height: 1;
  color: var(--yolk);
  -webkit-text-stroke: 3px var(--ink);
  text-shadow: 4px 4px 0 var(--red), 7px 7px 0 var(--ink);
  transform: rotate(-3deg);
  animation: sizzle 2.4s ease-in-out infinite;
}
.vuelco small { font-size: .42em; color: var(--paper); text-shadow: 3px 3px 0 var(--ink); -webkit-text-stroke: 2px var(--ink); }
@keyframes sizzle {
  0%, 100% { transform: rotate(-3deg) scale(1); }
  50% { transform: rotate(-2deg) scale(1.04); }
  52% { transform: rotate(-4deg) scale(1.03) translateX(-2px); }
  54% { transform: rotate(-2deg) scale(1.04) translateX(2px); }
}
@keyframes flicker {
  0%, 92%, 100% { opacity: 1; }
  93% { opacity: .4; }
  94% { opacity: 1; }
  96% { opacity: .6; }
}

.panel {
  position: absolute; left: 14px; right: 14px; bottom: 18px;
  z-index: 10;
  display: flex; flex-direction: column; align-items: stretch; gap: 8px;
  padding: 10px 12px 10px;
  background: linear-gradient(#5a4321, #3a2a15);
  border: 3px solid var(--ink);
  border-radius: 14px;
  box-shadow: 0 0 0 2px var(--gold) inset, 5px 5px 0 var(--ink);
}
.panel.shake { animation: shake .4s; }
@keyframes shake {
  20% { transform: translateX(-8px); } 40% { transform: translateX(8px); }
  60% { transform: translateX(-5px); } 80% { transform: translateX(5px); }
}
.panel-top { display: flex; align-items: center; justify-content: space-between; }
label {
  font-family: var(--title);
  letter-spacing: .12em;
  color: var(--yolk);
  font-size: 1.1rem;
}
.console { display: flex; align-items: center; gap: 8px; }
.screen {
  flex: 1;
  background-size: 100% 100%;
  padding: 8% 9%;
  aspect-ratio: 374 / 150;
  display: flex; align-items: center;
}
.screen input { background: rgba(10, 26, 16, .55); border-radius: 6px; font-size: 1.35rem; padding: .25em .3em; }
.screen input::placeholder { font-size: .8rem; letter-spacing: .06em; }
.redbtn {
  position: relative; flex: 0 0 31%;
  background: none; border: 0; padding: 0;
  display: flex; flex-direction: column; align-items: center;
}
.redbtn img { width: 100%; border: 3px solid var(--ink); border-radius: 10px; box-shadow: 3px 3px 0 var(--ink); transition: transform .08s; }
.redbtn:active img { transform: translate(2px, 2px) scale(.97); box-shadow: 1px 1px 0 var(--ink); }
.redbtn span { margin-top: -10px; font-size: 1.05rem; color: var(--paper); white-space: nowrap; }
.installbtn {
  align-self: center; background: none; border: 2px dashed rgba(239,230,210,.6); border-radius: 10px;
  color: var(--yolk); font-family: var(--title); letter-spacing: .08em; font-size: 1rem; padding: .3em .8em;
}
.rosterlink { text-align: center; color: var(--paper); font-family: var(--title); letter-spacing: .08em; font-size: 1rem; text-decoration: none; opacity: .9; }
input {
  width: 100%;
  background: transparent;
  border: 0; outline: none;
  padding: .3em .5em;
  font-family: var(--title);
  font-size: 1.6rem;
  letter-spacing: .14em;
  text-align: center;
  text-transform: uppercase;
  color: #8dffb0;
  text-shadow: 0 0 8px rgba(120, 255, 160, .7);
}
input::placeholder { color: rgba(141, 255, 176, .35); font-size: 1.1rem; letter-spacing: .1em; }
.msg, .hint {
  margin: 0;
  text-align: center;
  font-size: .95rem;
  font-weight: 700;
  line-height: 1.25;
}
.msg { color: #ffb9a8; }
.hint { color: var(--paper); opacity: .85; }
.hint b { color: var(--yolk); letter-spacing: .08em; text-decoration: underline; cursor: pointer; }
.resume {
  background: transparent;
  border: 2px dashed var(--yolk);
  color: var(--yolk);
  border-radius: 8px;
  padding: .45em;
  font-weight: 700;
  font-size: .95rem;
}
</style>
