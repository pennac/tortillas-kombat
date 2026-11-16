<script setup lang="ts">
import { episodes, nextKeyword, speakerNames, type Choice, type Line } from '~/data/episodes'

const route = useRoute()
const router = useRouter()
const { state, t, setLast, completeEpisode, setMuted } = useGame()
const { play: sfx } = useSfx()
const tostada = useTostada()
const showBite = ref(false)
const asset = useAsset()
const vsrc = useLiteVideo()

const n = Number(route.params.n)
const ep = episodes[n]

// si entra solo con la parola chiave (la Puntata 0 è libera)
onMounted(() => {
  if (!ep || !ep.available || (n > 0 && state.unlocked < n)) router.replace('/')
})

const started = ref(false)
const sceneIdx = ref(state.last?.ep === n ? Math.min(state.last.scene, (ep?.scenes.length ?? 1) - 1) : 0)
const lineIdx = ref(0)
const typed = ref('')
const typing = ref(false)
const showGame = ref(false)
const finished = ref(false)
const staticOn = ref(false)
const copied = ref(false)
const video = ref<HTMLVideoElement | null>(null)
const music = ref<HTMLAudioElement | null>(null)
const gameMusic = ref<HTMLAudioElement | null>(null)
const showService = ref(false)
const soundOn = computed(() => !state.muted)
/** quale traccia deve suonare adesso */
const serviceMusic = ref<HTMLAudioElement | null>(null)
/** loop del minigioco: quello della scena se c'è, altrimenti quello della puntata */
const curGameMusic = computed(() => scene.value?.gameMusic || ep?.gameMusic || '')
function syncMusic() {
  const inGame = showGame.value
  const inService = showService.value
  for (const [el, active, vol] of [[music.value, !inGame && !inService, 0.6], [gameMusic.value, inGame, 0.55], [serviceMusic.value, inService, 0.5]] as const) {
    if (!el) continue
    if (active && started.value && soundOn.value) { el.volume = vol; el.play().catch(() => {}) }
    else el.pause()
  }
}
function toggleSound() {
  setMuted(!state.muted)
  syncMusic()
}

const scene = computed(() => ep?.scenes[sceneIdx.value])
// scelta di dialogo: dopo le battute compaiono i bottoni, poi la risposta di Patato
const showChoices = ref(false)
const chosenReply = ref<Line | null>(null)
const line = computed(() => chosenReply.value ?? scene.value?.lines[lineIdx.value])
const gameBg = computed(() => asset(scene.value?.gameBackground || (scene.value?.game === 'vuelco' && ep?.gameBackground) || scene.value?.poster || ''))
const nextScene = computed(() => ep?.scenes[sceneIdx.value + 1])
const speakerName = computed(() => line.value ? speakerNames[line.value.speaker][state.lang] : '')

let typeTimer: ReturnType<typeof setInterval> | undefined
function typeLine() {
  clearInterval(typeTimer)
  const full = line.value ? line.value[state.lang] : ''
  if (line.value?.audio) sfx(line.value.audio)
  typed.value = ''
  typing.value = true
  let i = 0
  typeTimer = setInterval(() => {
    i++
    typed.value = full.slice(0, i)
    if (i >= full.length) { clearInterval(typeTimer); typing.value = false }
  }, 32)
}
function completeLine() {
  clearInterval(typeTimer)
  typed.value = line.value ? line.value[state.lang] : ''
  typing.value = false
}
// se si cambia lingua a metà battuta
watch(() => state.lang, () => { if (started.value) completeLine() })

function playScene() {
  lineIdx.value = 0
  chosenReply.value = null
  showChoices.value = false
  setLast(n, sceneIdx.value)
  nextTick(() => {
    video.value?.play().catch(() => {})
    setTimeout(typeLine, 600)
  })
}

const { track } = useAnalytics()

// schermo sempre acceso mentre si guarda/gioca
let wakeLock: { release: () => Promise<void> } | null = null
async function keepAwake() {
  try { wakeLock = await (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null } catch { /* non supportato */ }
}
// app in background (chiamata, cambio app): si ferma tutto; al ritorno riparte la musica
function onVisibility() {
  if (document.hidden) {
    document.querySelectorAll('audio, video').forEach((m) => (m as HTMLMediaElement).pause())
  } else {
    syncMusic()
    if (started.value) keepAwake()
    const v = document.querySelector('video.scene-video') as HTMLVideoElement | null
    if (v && !v.ended) v.play().catch(() => {})
  }
}
onMounted(() => document.addEventListener('visibilitychange', onVisibility))
onBeforeUnmount(() => { document.removeEventListener('visibilitychange', onVisibility); wakeLock?.release().catch(() => {}) })

// puntata disponibile offline: scarica video, poster e musica nella cache del service worker
const offlineState = ref<'idle' | 'doing' | 'done' | 'error'>('idle')
const canOffline = ref(false)
onMounted(async () => {
  canOffline.value = 'caches' in window && !!navigator.serviceWorker?.controller
  if (canOffline.value && ep) {
    const c = await caches.open('tk-video')
    if (await c.match(asset(vsrc(ep.scenes[ep.scenes.length - 1]!.video)))) offlineState.value = 'done'
  }
})
async function downloadOffline() {
  if (!ep || offlineState.value === 'doing') return
  offlineState.value = 'doing'
  try {
    const vids = await caches.open('tk-video')
    const other = await caches.open('tk-audio')
    const imgs = await caches.open('tk-img')
    for (const sc of ep.scenes) {
      await vids.add(asset(vsrc(sc.video)))
      await imgs.add(asset(sc.poster))
    }
    const tracks = [ep.music, ep.gameMusic, ...ep.scenes.map((s) => s.gameMusic)].filter(Boolean) as string[]
    for (const m of new Set(tracks)) await other.add(asset(m))
    offlineState.value = 'done'
    track('offline_download', { episode: n })
  } catch {
    offlineState.value = 'error'
  }
}

// titolo della puntata detto dalla Voz del Horno (se il file c'è)
onMounted(() => { if (ep) sfx(`media/voz/voz-titolo-p${String(n).padStart(2, '0')}.mp3`) })

function begin() {
  track('episode_start', { episode: n, scene: sceneIdx.value })
  keepAwake()
  started.value = true
  syncMusic()
  sfx(VOZ.vuelco)
  playScene()
}

function advance() {
  if (!started.value || showGame.value || finished.value || showChoices.value) return
  if (typing.value) return completeLine()
  if (!chosenReply.value && scene.value && lineIdx.value < scene.value.lines.length - 1) {
    lineIdx.value++
    return typeLine()
  }
  if (scene.value?.choices && !chosenReply.value) {
    showChoices.value = true
    return
  }
  if (scene.value?.game) {
    showGame.value = true
    nextTick(syncMusic)
    return
  }
  goNext()
}

function goNext() {
  if (!ep) return
  if (sceneIdx.value < ep.scenes.length - 1) {
    staticOn.value = false
    requestAnimationFrame(() => { staticOn.value = true })
    sceneIdx.value++
    typed.value = ''
    if (sceneIdx.value >= 3) tostada.maybe(0.12)
    playScene()
  } else if (ep.service && !showService.value) {
    showService.value = true
    nextTick(syncMusic)
  } else {
    finishEpisode()
  }
}

function finishEpisode() {
  track('episode_complete', { episode: n, pesetas: state.pesetas, hype: state.hype })
  showService.value = false
  nextTick(syncMusic)
  finished.value = true
  completeEpisode(n)
  // dopo i titoli dell'epilogo: ¡Tostada!
  if (!nextKeyword[n]) setTimeout(() => tostada.show(), 1200)
}

function onWin() {
  track('minigame_win', { game: scene.value?.game, episode: n })
  showGame.value = false
  if (gameMusic.value) gameMusic.value.currentTime = 0
  nextTick(syncMusic)
  goNext()
}

function choose(c: Choice) {
  showChoices.value = false
  chosenReply.value = { speaker: 'patato', it: c.reply.it, es: c.reply.es }
  typeLine()
}

async function copyKeyword() {
  try { await navigator.clipboard.writeText(nextKeyword[n] ?? '') } catch { /* ignora */ }
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

onBeforeUnmount(() => { clearInterval(typeTimer); music.value?.pause(); gameMusic.value?.pause(); serviceMusic.value?.pause() })
</script>

<template>
  <main v-if="ep && scene" class="stage crt player" @click="advance">
    <video
      ref="video"
      :key="scene.id"
      class="media-fill scene-video"
      :src="asset(vsrc(scene.video))"
      :poster="asset(scene.poster)"
      muted playsinline preload="auto"
    />
    <!-- precarica la scena successiva -->
    <video v-if="nextScene" :key="'pre-' + nextScene.id" :src="asset(vsrc(nextScene.video))" muted preload="auto" class="preload" />
    <div class="static" :class="{ on: staticOn }" />

    <header class="bar" @click.stop>
      <NuxtLink to="/play" class="pill homebtn">◀ {{ t.home }}</NuxtLink>
      <span class="pill ep">{{ t.episode }} {{ ep.n }} · {{ ep.title[state.lang] }}</span>
      <div class="right">
        <button class="pill sound" :aria-label="soundOn ? 'mute' : 'audio'" @click="toggleSound">{{ soundOn ? '♪' : '✕' }}</button>
        <LangSwitch />
      </div>
    </header>
    <audio v-if="ep.music" ref="music" :src="asset(ep.music)" loop preload="auto" />
    <audio v-if="curGameMusic" ref="gameMusic" :src="asset(curGameMusic)" loop preload="auto" />
    <audio v-if="ep.service" ref="serviceMusic" :src="asset('media/musica/loop-tartana.mp3')" loop preload="none" />

    <!-- fumetto -->
    <div v-if="started && !finished && !showService && !showChoices && line && typed" class="bubble" :class="[scene.pos, line.speaker]">
      <span v-if="speakerName" class="who">{{ speakerName }}</span>
      <p>{{ typed }}<span v-if="typing" class="caret">▌</span></p>
      <span v-if="!typing" class="next">▼ {{ t.tapToContinue }}</span>
    </div>

    <button v-if="started && !showGame && !showService && !finished" class="skip pill" @click.stop="goNext">{{ t.skip }} ▶▶</button>

    <!-- schermata d'ingresso -->
    <div v-if="!started" class="intro" @click.stop="begin">
      <p class="tk inked">¡VUELCO!</p>
      <h1 class="inked">{{ t.episode }} {{ ep.n }}</h1>
      <h2 class="inked">{{ ep.title[state.lang] }}</h2>
      <p class="tap">{{ t.tapToStart }}</p>
      <button v-if="canOffline" type="button" class="offline" :disabled="offlineState === 'doing' || offlineState === 'done'" @click.stop="downloadOffline">
        {{ offlineState === 'done' ? t.offlineDone : offlineState === 'doing' ? t.offlineDoing : offlineState === 'error' ? t.offlineNo : t.offline }}
      </button>
    </div>

    <!-- scelta di dialogo -->
    <div v-if="showChoices && scene.choices" class="choices" @click.stop>
      <p class="inked">{{ t.choose }}</p>
      <button v-for="(c, k) in scene.choices" :key="k" class="btn" :class="{ red: k === 1 }" @click="choose(c)">{{ c[state.lang] }}</button>
    </div>

    <template v-if="showGame">
      <VuelcoGame v-if="scene.game === 'vuelco' || scene.game === 'duelo'" :background="gameBg" :variant="scene.game" @win="onWin" />
      <StealthGame v-else-if="scene.game === 'stealth'" :background="gameBg" @win="onWin" />
      <RhythmGame v-else-if="scene.game === 'rhythm'" :background="gameBg" @win="onWin" />
      <HackGame v-else-if="scene.game === 'hack'" :background="gameBg" @win="onWin" />
      <SliceGame v-else-if="scene.game === 'slice'" :background="gameBg" @win="onWin" />
      <CatchGame v-else-if="scene.game === 'catch'" :background="gameBg" @win="onWin" />
      <ParryGame v-else-if="scene.game === 'parry'" :background="gameBg" @win="onWin" />
      <BossGame v-else-if="scene.game === 'boss'" :background="gameBg" @win="onWin" />
    </template>
    <TartanaService v-if="showService" @done="finishEpisode" />

    <!-- fine puntata -->
    <div v-if="finished" class="end" @click.stop>
      <h1 class="inked">{{ nextKeyword[n] ? t.episodeCleared : t.seasonEnd }}</h1>
      <template v-if="nextKeyword[n]">
        <p>{{ t.nextKeyword }}</p>
        <div class="kw" :style="{ backgroundImage: `url(${asset('media/ui/cartello-luci.webp')})` }"><span>{{ nextKeyword[n] }}</span></div>
        <button class="btn ghost" @click="copyKeyword">{{ copied ? t.copied : t.copy }}</button>
        <p class="small">{{ t.nextSoon }}</p>
      </template>
      <button class="btn" @click="showBite = true">{{ t.biteBonus }}</button>
      <div class="endrow">
        <NuxtLink to="/roster" class="btn ghost">{{ t.roster }}</NuxtLink>
        <NuxtLink to="/play" class="btn red">{{ t.home }}</NuxtLink>
      </div>
    </div>
    <BiteBonus v-if="showBite" @close="showBite = false" />
    <TostadaEgg />
  </main>
</template>

<style scoped>
.player { cursor: pointer; }
.bar {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  padding: 10px 10px 0;
  z-index: 20;
}
.right { display: inline-flex; gap: 6px; align-items: center; }
.sound { background: var(--yolk); color: var(--ink); box-shadow: 2px 2px 0 var(--ink); min-width: 2.2em; }
.homebtn { background: var(--paper); color: var(--ink); text-decoration: none; box-shadow: 2px 2px 0 var(--ink); }
.ep {
  background: rgba(20,17,13,.75); color: var(--yolk);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 45%;
}

.bubble {
  position: absolute; left: 14px; right: 14px;
  z-index: 15;
  padding: 14px 16px 12px;
  background: #fffaf0;
  color: var(--ink);
  border: 3px solid var(--ink);
  border-radius: 18px;
  box-shadow: 5px 5px 0 var(--ink);
  animation: bubbleIn .25s ease-out;
}
.bubble.top { top: 64px; }
.bubble.bottom { bottom: 64px; }
.bubble p { margin: 0; font-size: 1.35rem; font-weight: 700; line-height: 1.25; min-height: 1.25em; }
.who {
  position: absolute; top: -16px; left: 14px;
  font-family: var(--title); letter-spacing: .06em; font-size: 1.05rem;
  padding: .05em .6em;
  border: 2px solid var(--ink); border-radius: 8px;
  background: var(--yolk);
  color: var(--ink);
}
.preload { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.patato .who { background: #d9a441; }
.aceituna .who { background: #9bb04a; }
.chema .who { background: #c9ccd1; }
.roto .who { background: var(--gold); }
.mystery { background: #1d1a15; color: var(--gold); border-color: var(--gold); box-shadow: 5px 5px 0 #000; }
.mystery p { font-style: italic; }
.mystery .who { background: var(--gold); }
.flujo .who { background: #3f6fa8; color: var(--paper); }
.jamonero .who { background: #b8324a; color: var(--paper); }
.cebolla .who { background: #8e4a9e; color: var(--paper); }
.katana .who { background: #2f4a2a; color: var(--paper); }
.huevo .who { background: #ffd23f; }
.voz { background: #2a0f0b; color: #ffb199; border-color: #ff4d3a; box-shadow: 5px 5px 0 #000, 0 0 18px rgba(255,77,58,.5); }
.voz p { font-family: var(--title); letter-spacing: .05em; font-size: 1.7rem; }
.voz .who { background: #ff4d3a; color: var(--paper); }
.choices {
  position: absolute; left: 18px; right: 18px; bottom: 70px; z-index: 22;
  display: grid; gap: 10px; text-align: center;
}
.choices p { margin: 0 0 .2em; font-size: 1.8rem; color: var(--yolk); }
.choices .btn { font-size: 1.4rem; }
.tv .who { background: #8f8f8f; color: var(--paper); }
.roto { background: #1d1a15; color: var(--gold); border-color: var(--gold); box-shadow: 5px 5px 0 #000; }
.roto p { font-style: italic; }
.narrator { background: var(--yolk); border-radius: 4px; }
.narrator p { font-size: 1.15rem; text-transform: uppercase; letter-spacing: .03em; }
.tv { background: #e9e7e1; border-style: dashed; }
.next { display: block; text-align: right; font-size: .8rem; opacity: .55; margin-top: 4px; animation: blink 1.2s steps(2) infinite; }
.caret { animation: blink .6s steps(2) infinite; }
@keyframes blink { 50% { opacity: .1; } }
@keyframes bubbleIn { from { transform: scale(.92) translateY(6px); opacity: 0; } }

.skip {
  position: absolute; right: 12px; bottom: 16px;
  z-index: 20;
  background: rgba(20,17,13,.7); color: var(--paper);
}

.intro, .end {
  position: absolute; inset: 0;
  z-index: 25;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  text-align: center;
  padding: 24px;
  background: radial-gradient(ellipse at center, rgba(20,17,13,.55), rgba(10,8,6,.92));
}
.intro .offline {
  margin-top: 1.2em; background: rgba(0,0,0,.35); border: 2px dashed rgba(239,230,210,.5); border-radius: 10px;
  color: var(--paper); font-weight: 700; font-size: .9rem; padding: .5em .9em;
}
.intro .tk { margin: 0; font-size: 2rem; color: var(--yolk); }
.intro h1 { margin: 0; font-size: 3.4rem; color: var(--paper); }
.intro h2 { margin: 0; font-size: 2.6rem; color: var(--yolk); transform: rotate(-3deg); }
.tap { margin-top: 1.4em; font-weight: 700; font-size: 1.1rem; animation: blink 1.3s steps(2) infinite; }
.end h1 { margin: 0 0 .4em; font-size: 2.8rem; color: var(--yolk); }
.end p { margin: 0; font-weight: 700; font-size: 1.1rem; }
.end .small { font-size: .95rem; opacity: .8; max-width: 300px; }
.kw {
  width: 88%; aspect-ratio: 520 / 425;
  background-size: 100% 100%;
  display: flex; align-items: center; justify-content: center;
  padding-bottom: 12%;
}
.kw span {
  font-family: var(--title); font-size: 2.6rem; letter-spacing: .12em;
  color: var(--ink); text-shadow: 0 0 10px rgba(255, 220, 140, .9);
}
.endrow { display: flex; gap: 10px; }
.end .btn { font-size: 1.2rem; }
.end .btn { text-decoration: none; }
</style>
