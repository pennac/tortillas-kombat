<script setup lang="ts">
// Minigioco "Il Mercato Nero" (Puntata 2): tieni premuto per avanzare,
// lascia quando la luce di un drone passa su Patato. Trova 3 ingredienti autentici.
const props = defineProps<{ background: string }>()
const emit = defineEmits<{ win: [] }>()
const { t } = useGame()
const { track } = useAnalytics()
const { play } = useSfx()
const { siren, tone } = useSynth()
const asset = useAsset()

const X0 = 8, X1 = 92          // percorso di Patato in % di larghezza
const SPEED = 0.085            // percorso al secondo mentre tieni premuto
const ITEMS = [
  { at: 0.3, img: asset('media/sprites/ing-patata.webp') },
  { at: 0.62, img: asset('media/sprites/ing-uovo.webp') },
  { at: 0.95, img: asset('media/sprites/ing-cipolla.webp') }
]

type Phase = 'intro' | 'play' | 'won' | 'lost'
const phase = ref<Phase>('intro')
const progress = ref(0)
const checkpoint = ref(0)
const found = ref(0)
const lives = ref(3)
const fails = ref(0)
const holding = ref(false)
const caught = ref(false)
const shout = ref('')
const time = ref(0)

// droni: centro del fascio = base + ampiezza * sin(t * vel + fase)
const drones = computed(() => {
  const slow = fails.value >= 3 ? 0.7 : 1
  const list = [{ base: 50, amp: 40, vel: 0.9 * slow, ph: 0, w: 9 }]
  if (found.value >= 1) list.push({ base: 55, amp: 35, vel: 1.35 * slow, ph: 2.1, w: 8 })
  if (found.value >= 2) list.push({ base: 70, amp: 22, vel: 1.9 * slow, ph: 4.2, w: 7 })
  return list.map((d) => ({ ...d, x: d.base + d.amp * Math.sin(time.value * d.vel + d.ph) }))
})
const px = computed(() => X0 + (X1 - X0) * progress.value)

let raf = 0
let last = 0

function startGame() {
  progress.value = 0; checkpoint.value = 0; found.value = 0; lives.value = 3
  caught.value = false; shout.value = ''
  phase.value = 'play'
  last = performance.now()
  raf = requestAnimationFrame(tick)
}

function tick(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  time.value += dt
  if (phase.value === 'play' && !caught.value) {
    if (holding.value) {
      progress.value = Math.min(1, progress.value + SPEED * dt)
      // la luce vede solo chi si muove
      if (drones.value.some((d) => Math.abs(d.x - px.value) < d.w)) spotted()
    }
    const next = ITEMS[found.value]
    if (next && progress.value >= next.at) collect()
  }
  raf = requestAnimationFrame(tick)
}

function collect() {
  found.value++
  checkpoint.value = progress.value
  tone(880, 0.08); setTimeout(() => tone(1320, 0.12), 90)
  flash(t.value.found)
  if (found.value >= ITEMS.length) {
    phase.value = 'won'
    holding.value = false
    play(VOZ.dale)
    setTimeout(() => emit('win'), 2300)
  }
}

function spotted() {
  caught.value = true
  holding.value = false
  siren()
  lives.value--
  flash(t.value.caught)
  setTimeout(() => {
    caught.value = false
    progress.value = checkpoint.value
    if (lives.value <= 0) {
      fails.value++
      phase.value = 'lost'; track('minigame_lose', { game: 'stealth', attempt: fails.value })
      play(VOZ.eliminado)
    }
  }, 1100)
}

let shoutTimer: ReturnType<typeof setTimeout> | undefined
function flash(text: string) {
  shout.value = text
  clearTimeout(shoutTimer)
  shoutTimer = setTimeout(() => (shout.value = ''), 900)
}

function down() { if (phase.value === 'play' && !caught.value) holding.value = true }
function up() { holding.value = false }

onBeforeUnmount(() => { cancelAnimationFrame(raf); clearTimeout(shoutTimer) })
</script>

<template>
  <div class="mg stealth" :class="{ caught }" @pointerdown="down" @pointerup="up" @pointercancel="up" @pointerleave="up" @contextmenu.prevent>
    <img class="media-fill mg-bg" :src="props.background" alt="">

    <header class="mg-hud">
      <span class="pill title">{{ t.stealthTitle }}</span>
      <span class="mg-stat">{{ t.lives }}: <b v-for="k in 3" :key="k" class="life" :class="{ off: k > lives }">●</b></span>
    </header>

    <!-- ingredienti trovati -->
    <div class="bag">
      <img v-for="(it, k) in ITEMS" :key="k" :src="it.img" alt="" :class="{ got: k < found }">
    </div>

    <!-- fasci di luce dei droni -->
    <div v-for="(d, k) in drones" :key="k" class="beam" :style="{ left: d.x + '%', '--w': d.w * 2 + '%' }">
      <span class="drone">◉</span>
    </div>

    <!-- percorso e ingredienti da raccogliere -->
    <div class="track" />
    <img
      v-for="(it, k) in ITEMS" v-show="k >= found" :key="'i' + k"
      class="item" :src="it.img" alt=""
      :style="{ left: X0 + (X1 - X0) * it.at + '%' }"
    >
    <div class="patato" :class="{ walk: holding }" :style="{ left: px + '%' }">
      <img :src="asset('media/sprites/patato-espera.webp')" alt="">
    </div>

    <p v-if="phase === 'play' && !holding && !caught" class="hint">{{ t.hold }}</p>

    <div v-if="shout" class="mg-shout" :style="{ backgroundImage: `url(${asset('media/ui/fumetto-urlo.webp')})`, color: caught ? '#ff7a5c' : 'var(--yolk)' }">{{ shout }}</div>

    <div v-if="phase === 'intro'" class="mg-card" @pointerdown.stop>
      <h2 class="inked">{{ t.stealthTitle }}</h2>
      <p>{{ t.stealthHelp }}</p>
      <button class="btn" @click="startGame">{{ t.go }}</button>
    </div>
    <div v-if="phase === 'won'" class="mg-card win" @pointerdown.stop><h2 class="inked">{{ t.win }}</h2></div>
    <div v-if="phase === 'lost'" class="mg-card" @pointerdown.stop>
      <h2 class="inked">{{ t.lose }}</h2>
      <p v-if="fails >= 3">{{ t.help }}</p>
      <button class="btn" @click="startGame">{{ t.retry }}</button>
    </div>
  </div>
</template>

<style scoped>
.stealth.caught { animation: alarm .25s steps(2) 4; }
@keyframes alarm { 50% { box-shadow: inset 0 0 80px 30px rgba(220,30,20,.6); } }
.bag {
  position: absolute; top: 56px; left: 0; right: 0; z-index: 6;
  display: flex; justify-content: center; gap: 10px;
}
.bag img {
  width: 44px; height: 44px; object-fit: contain;
  padding: 4px; border: 2px dashed rgba(239,230,210,.5); border-radius: 10px;
  filter: grayscale(1) brightness(.35);
}
.bag img.got { filter: none; border-style: solid; border-color: var(--yolk); background: rgba(242,182,50,.2); }
.life { color: var(--red); margin-left: 2px; }
.life.off { color: rgba(255,255,255,.2); }
.beam {
  position: absolute; top: 0; bottom: 12%; width: var(--w);
  transform: translateX(-50%); z-index: 3; pointer-events: none;
  background: linear-gradient(to bottom, rgba(255,250,210,.05), rgba(255,250,210,.38));
  clip-path: polygon(44% 0, 56% 0, 100% 100%, 0 100%);
}
.beam::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -4%; height: 8%;
  border-radius: 50%; background: radial-gradient(rgba(255,250,210,.55), transparent 70%);
}
.drone {
  position: absolute; top: 9%; left: 50%; transform: translateX(-50%);
  font-size: 1.7rem; color: #ff4d3a; text-shadow: 0 0 10px #ff4d3a;
}
.track {
  position: absolute; left: 6%; right: 6%; bottom: 13%; height: 6px; z-index: 2;
  border-radius: 3px; background: repeating-linear-gradient(90deg, rgba(239,230,210,.45) 0 12px, transparent 12px 22px);
}
.item {
  position: absolute; bottom: 15%; width: 13%; transform: translateX(-50%); z-index: 4;
  filter: drop-shadow(0 0 8px rgba(242,182,50,.9));
  animation: bob 1s ease-in-out infinite;
}
@keyframes bob { 50% { transform: translateX(-50%) translateY(-8px); } }
.patato {
  position: absolute; bottom: 10%; width: 34%; z-index: 5;
  /* il personaggio (senza padella) è nella parte sinistra-centrale dello sprite */
  transform: translateX(-38%);
  pointer-events: none;
}
.patato img { width: 100%; filter: drop-shadow(3px 5px 0 rgba(0,0,0,.5)); }
.patato.walk img { animation: walk .32s ease-in-out infinite; }
@keyframes walk { 50% { transform: translateY(-5px) rotate(2deg); } }
.hint {
  position: absolute; left: 0; right: 0; bottom: 3%; z-index: 6; margin: 0;
  text-align: center; font-family: var(--title); letter-spacing: .08em; font-size: 1.3rem;
  text-shadow: 2px 2px 0 var(--ink); animation: blinkHint 1.1s steps(2) infinite;
}
@keyframes blinkHint { 50% { opacity: .3; } }
</style>
