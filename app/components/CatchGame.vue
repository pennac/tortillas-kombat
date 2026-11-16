<script setup lang="ts">
// Minigioco "L'Ofrenda del Pueblo" (Puntata 5): trascina Patato per prendere
// con la padella gli ingredienti lanciati dal pubblico; evita la Nutripasta.
const props = defineProps<{ background: string }>()
const emit = defineEmits<{ win: [] }>()
const { t } = useGame()
const { track } = useAnalytics()
const { play } = useSfx()
const { tone } = useSynth()
const asset = useAsset()

const ING = ['patata', 'uovo', 'cipolla', 'olio', 'peperone-verde', 'peperone-rosso', 'sale'].map((n) => asset(`media/sprites/ing-${n}.webp`))
const GREY = asset('media/sprites/ing-nutripasta.webp')
const PAN_Y = 0.8
interface Drop { id: number; x: number; y: number; v: number; bad: boolean; img: string; rot: number }

type Phase = 'intro' | 'play' | 'won' | 'lost'
const phase = ref<Phase>('intro')
const drops = ref<Drop[]>([])
const panX = ref(0.5)
const got = ref(0)
const lives = ref(3)
const fails = ref(0)
const pop = ref<{ id: number; good: boolean } | null>(null)
const box = ref<HTMLElement | null>(null)
const NEED = 10

let raf = 0, last = 0, spawnIn = 0, id = 0, clock = 0

function startGame() {
  drops.value = []; got.value = 0; lives.value = 3; clock = 0; spawnIn = 0.4
  phase.value = 'play'
  play(VOZ.cocinar)
  last = performance.now()
  raf = requestAnimationFrame(tick)
}

function tick(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now
  if (phase.value !== 'play') return
  clock += dt
  spawnIn -= dt
  if (spawnIn <= 0) {
    const bad = Math.random() < Math.min(0.45, (fails.value >= 3 ? 0.2 : 0.28) + clock * 0.004)
    drops.value.push({ id: ++id, x: 0.1 + Math.random() * 0.8, y: -0.08, v: 0.32 + Math.random() * 0.2 + clock * 0.004, bad, img: bad ? GREY : ING[Math.floor(Math.random() * ING.length)]!, rot: Math.random() * 360 })
    spawnIn = 0.55 + Math.random() * 0.35
  }
  const keep: Drop[] = []
  for (const d of drops.value) {
    d.y += d.v * dt; d.rot += 120 * dt
    if (d.y >= PAN_Y - 0.02 && d.y <= PAN_Y + 0.03 && Math.abs(d.x - panX.value) < 0.12) { catchIt(d); continue }
    if (d.y < 1.1) keep.push(d)
  }
  drops.value = keep
  raf = requestAnimationFrame(tick)
}

function catchIt(d: Drop) {
  pop.value = { id: d.id, good: !d.bad }
  if (d.bad) {
    lives.value--
    tone(150, 0.25, 'sawtooth', 0.15)
    if (lives.value <= 0) finish(false)
  } else {
    got.value++
    tone(700 + got.value * 40, 0.08, 'triangle', 0.15)
    if (got.value >= NEED) finish(true)
  }
}

function move(e: PointerEvent) {
  if (phase.value !== 'play') return
  const r = box.value!.getBoundingClientRect()
  panX.value = Math.max(0.08, Math.min(0.92, (e.clientX - r.left) / r.width))
}

function finish(won: boolean) {
  cancelAnimationFrame(raf)
  if (won) { phase.value = 'won'; play(VOZ.dale); setTimeout(() => emit('win'), 2300) }
  else { fails.value++; phase.value = 'lost'; track('minigame_lose', { game: 'catch', attempt: fails.value }); play(VOZ.eliminado) }
}

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div ref="box" class="mg catch" @pointerdown="move" @pointermove="move">
    <img class="media-fill mg-bg" :src="props.background" alt="">

    <header class="mg-hud">
      <span class="pill title">{{ t.catchTitle }}</span>
      <span class="mg-stat">{{ t.caught2 }} {{ got }}/{{ NEED }} · <b v-for="k in 3" :key="k" class="life" :class="{ off: k > lives }">●</b></span>
    </header>

    <img
      v-for="d in drops" :key="d.id" class="drop" :class="{ bad: d.bad }" :src="d.img" alt=""
      :style="{ left: d.x * 100 + '%', top: d.y * 100 + '%', transform: `translate(-50%,-50%) rotate(${d.rot}deg)` }"
    >

    <div class="patato" :style="{ left: panX * 100 + '%', top: PAN_Y * 100 + '%' }">
      <img :src="asset('media/sprites/patato-espera.webp')" alt="">
    </div>
    <div v-if="pop" :key="pop.id" class="pop" :class="{ good: pop.good }" :style="{ left: panX * 100 + '%', top: PAN_Y * 100 + '%' }">{{ pop.good ? '+1' : '✕' }}</div>

    <div v-if="phase === 'intro'" class="mg-card" @pointerdown.stop>
      <h2 class="inked">{{ t.catchTitle }}</h2>
      <p>{{ t.catchHelp }}</p>
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
.life { color: var(--red); margin-left: 2px; }
.life.off { color: rgba(255,255,255,.2); }
.drop { position: absolute; width: 14%; z-index: 3; pointer-events: none; filter: drop-shadow(3px 4px 0 rgba(0,0,0,.5)); }
.drop.bad { filter: drop-shadow(0 0 8px rgba(255,60,60,.9)) grayscale(.3); }
.patato {
  position: absolute; width: 60%; aspect-ratio: 680 / 660; z-index: 4; pointer-events: none;
  /* la padella dello sprite (163,435 su 680x660) cade sul punto (panX, PAN_Y) */
  transform: translate(-23.97%, -65.9%);
}
.patato img { width: 100%; height: 100%; filter: drop-shadow(4px 6px 0 rgba(0,0,0,.45)); }
.pop {
  position: absolute; z-index: 5; transform: translate(-50%, -150%); pointer-events: none;
  font-family: var(--title); font-size: 2rem; color: #ff7a5c; -webkit-text-stroke: 2px var(--ink);
  animation: up .6s ease-out forwards;
}
.pop.good { color: var(--yolk); }
@keyframes up { to { transform: translate(-50%, -300%); opacity: 0; } }
</style>
