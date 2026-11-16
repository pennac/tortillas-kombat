<script setup lang="ts">
// Minigioco "El Vuelco": tocca quando la tortilla scende dentro il cerchio d'oro.
// variante "duelo" (Puntata 1): più giri, più veloce, Capitán Flujo schizza tuorlo sullo schermo
const props = withDefaults(defineProps<{ background: string; variant?: 'vuelco' | 'duelo' }>(), { variant: 'vuelco' })
const duel = props.variant === 'duelo'
const emit = defineEmits<{ win: [] }>()
const { t } = useGame()
const { track } = useAnalytics()
const { play, playAndWait } = useSfx()

const ROUNDS = duel ? 6 : 5
const NEED = duel ? 4 : 3
const title = computed(() => (duel ? t.value.duelTitle : t.value.vuelcoTitle))
const help = computed(() => (duel ? t.value.duelHelp : t.value.vuelcoHelp))
// macchie di tuorlo di Flujo
const splats = ref<{ id: number; x: number; y: number; s: number }[]>([])
let splatId = 0
let splatTimer: ReturnType<typeof setInterval> | undefined
function splash() {
  if (phase.value !== 'play') return
  const id = ++splatId
  splats.value.push({ id, x: 10 + Math.random() * 80, y: 15 + Math.random() * 55, s: 70 + Math.random() * 70 })
  setTimeout(() => { splats.value = splats.value.filter((k) => k.id !== id) }, 1800)
}
const PAN_Y = 0.84      // posizione della padella di Patato (0 = alto, 1 = basso)
const APEX_Y = 0.10     // punto più alto del lancio
const RING_Y = 0.37     // centro del cerchio d'oro
// sprite: padella di Patato dentro l'immagine (680x660) a x=163, y=435
const sprite = useAsset()
const SPRITES = {
  espera: sprite('media/sprites/patato-espera.webp'),
  vuelco: sprite('media/sprites/patato-vuelco.webp'),
  disco: sprite('media/sprites/tortilla-disco.webp'),
  perfect: sprite('media/sprites/tortilla-perfecta.webp'),
  raw: sprite('media/sprites/tortilla-cruda.webp'),
  burnt: sprite('media/sprites/tortilla-quemada.webp')
}
const pose = ref<'espera' | 'vuelco'>('espera')

type Phase = 'intro' | 'play' | 'won' | 'lost'
const phase = ref<Phase>('intro')
const round = ref(0)
const perfects = ref(0)
const fails = ref(0)
const y = ref(PAN_Y)
const spin = ref(0)
const flying = ref(false)
const feedback = ref<{ text: string; kind: 'good' | 'bad'; icon: string } | null>(null)
const results = ref<('good' | 'bad')[]>([])

const tolerance = computed(() => (fails.value >= 3 ? 0.085 : 0.055))
const ringStyle = computed(() => ({
  top: `${RING_Y * 100}%`,
  height: `${tolerance.value * 2 * 100}%`
}))

let raf = 0
let start = 0
let duration = 1600
let descending = false

async function startGame() {
  round.value = 0
  perfects.value = 0
  results.value = []
  phase.value = 'play'
  if (duel) { clearInterval(splatTimer); splatTimer = setInterval(splash, fails.value >= 3 ? 2600 : 1500) }
  await playAndWait(VOZ.round, 1800)
  play(VOZ.cocinar)
  nextRound()
}

function nextRound() {
  if (perfects.value >= NEED) return finish(true)
  if (round.value >= ROUNDS) return finish(false)
  round.value++
  // ogni giro è più veloce
  duration = (duel ? 1450 : 1700) - (round.value - 1) * (duel ? 120 : 170)
  feedback.value = null
  y.value = PAN_Y
  setTimeout(launch, 650)
}

function launch() {
  pose.value = 'vuelco'
  setTimeout(() => { pose.value = 'espera' }, 380)
  flying.value = true
  descending = false
  start = performance.now()
  raf = requestAnimationFrame(tick)
}

function tick(now: number) {
  const p = (now - start) / duration // 0..1 su tutto il volo
  // parabola: su fino all'apice a metà, poi giù fino alla padella
  const h = 4 * p * (1 - p) // 0 → 1 → 0
  y.value = PAN_Y - (PAN_Y - APEX_Y) * h
  spin.value = p * 720
  descending = p > 0.5
  if (p >= 1) {
    y.value = PAN_Y
    resolve('burnt')
    return
  }
  raf = requestAnimationFrame(tick)
}

function tap() {
  if (phase.value !== 'play' || !flying.value) return
  const d = Math.abs(y.value - RING_Y)
  if (descending && d <= tolerance.value) resolve('perfect')
  else if (descending && y.value > RING_Y) resolve('burnt')
  else resolve('raw')
}

function resolve(kind: 'perfect' | 'raw' | 'burnt') {
  cancelAnimationFrame(raf)
  flying.value = false
  if (kind === 'perfect') {
    perfects.value++
    results.value.push('good')
    feedback.value = { text: t.value.perfect, kind: 'good', icon: SPRITES.perfect }
  } else {
    results.value.push('bad')
    feedback.value = { text: kind === 'raw' ? t.value.raw : t.value.burnt, kind: 'bad', icon: kind === 'raw' ? SPRITES.raw : SPRITES.burnt }
  }
  // la tortilla ricade nella padella
  y.value = PAN_Y
  setTimeout(nextRound, 900)
}

function finish(won: boolean) {
  feedback.value = null
  clearInterval(splatTimer)
  splats.value = []
  if (won) {
    play(VOZ.dale)
    phase.value = 'won'
    setTimeout(() => emit('win'), 2300)
  } else {
    fails.value++
    play(VOZ.eliminado)
    phase.value = 'lost'; track('minigame_lose', { game: props.variant, attempt: fails.value })
  }
}

onBeforeUnmount(() => { cancelAnimationFrame(raf); clearInterval(splatTimer) })
</script>

<template>
  <div class="game" @pointerdown="tap">
    <img class="media-fill bg" :src="props.background" alt="">
    <div class="dim" />

    <header class="hud">
      <span class="pill title">{{ title }}</span>
      <span class="score">
        {{ t.perfects }}:
        <i v-for="k in NEED" :key="k" :class="{ on: k <= perfects }" />
      </span>
    </header>
    <div class="rounds">
      <i v-for="k in ROUNDS" :key="k" :class="results[k - 1] ?? (k === round ? 'now' : '')" />
    </div>

    <!-- cerchio d'oro -->
    <div class="ring" :style="ringStyle" />

    <!-- Patato-Pan: la sua padella è il punto di lancio -->
    <div class="patato" :style="{ top: `${PAN_Y * 100}%` }">
      <img :src="SPRITES.espera" alt="" :class="{ hide: pose !== 'espera' }">
      <img :src="SPRITES.vuelco" alt="" :class="{ hide: pose !== 'vuelco' }">
    </div>

    <!-- tortilla -->
    <img
      class="tortilla" :src="SPRITES.disco" alt=""
      :style="{ top: `${y * 100}%`, transform: `translate(-50%, -50%) rotateX(${spin}deg)` }"
    >

    <i v-for="k in splats" :key="k.id" class="splat" :style="{ left: k.x + '%', top: k.y + '%', width: k.s + 'px', height: k.s + 'px' }" />

    <div v-if="feedback" class="feedback" :class="feedback.kind" :style="{ '--shout': `url(${sprite('media/ui/fumetto-urlo.webp')})` }">
      <img :src="feedback.icon" alt="">
      <p class="inked">{{ feedback.text }}</p>
    </div>

    <div v-if="phase === 'intro'" class="card" @pointerdown.stop>
      <h2 class="inked">{{ title }}</h2>
      <p>{{ help }}</p>
      <button class="btn" @click="startGame">{{ t.vuelcoStart }}</button>
    </div>

    <div v-if="phase === 'won'" class="card win" @pointerdown.stop>
      <h2 class="inked big">{{ t.win }}</h2>
    </div>

    <div v-if="phase === 'lost'" class="card" @pointerdown.stop>
      <h2 class="inked">{{ t.lose }}</h2>
      <p v-if="fails >= 3">{{ t.help }}</p>
      <button class="btn" @click="startGame">{{ t.retry }}</button>
    </div>
  </div>
</template>

<style scoped>
.game {
  position: absolute; inset: 0;
  z-index: 30;
  touch-action: manipulation;
  overflow: hidden;
}
.bg { filter: blur(3px) brightness(.55) saturate(.8); transform: scale(1.06); }
.dim { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 60%, transparent 30%, rgba(0,0,0,.6)); }

.hud {
  position: absolute; top: 14px; left: 14px; right: 14px;
  display: flex; justify-content: space-between; align-items: center;
  z-index: 2;
}
.title { background: var(--yolk); color: var(--ink); }
.score {
  font-family: var(--title); letter-spacing: .06em; font-size: 1.1rem;
  display: inline-flex; align-items: center; gap: 6px;
  text-shadow: 2px 2px 0 var(--ink);
}
.score i {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid var(--ink); background: #4a3d2a;
}
.score i.on { background: var(--yolk); box-shadow: 0 0 10px var(--yolk); }
.rounds {
  position: absolute; top: 58px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 8px; z-index: 2;
}
.rounds i { width: 26px; height: 6px; border-radius: 3px; background: rgba(255,255,255,.25); }
.rounds i.now { background: var(--paper); }
.rounds i.good { background: var(--yolk); }
.rounds i.bad { background: var(--red); }

.ring {
  position: absolute; left: 50%;
  width: 46%;
  transform: translate(-50%, -50%);
  border: 4px solid var(--gold);
  border-radius: 50%;
  box-shadow: 0 0 22px rgba(201,162,39,.75), inset 0 0 22px rgba(201,162,39,.5);
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse { 50% { box-shadow: 0 0 34px rgba(242,182,50,.95), inset 0 0 30px rgba(242,182,50,.6); } }

.patato {
  position: absolute; left: 50%;
  width: 82%; aspect-ratio: 680 / 660;
  /* la padella (163,435 su 680x660) cade esattamente su (50%, PAN_Y) */
  transform: translate(-23.97%, -65.9%);
  z-index: 2;
  pointer-events: none;
}
.patato img { position: absolute; inset: 0; width: 100%; height: 100%; filter: drop-shadow(4px 6px 0 rgba(0,0,0,.45)); }
.patato img.hide { visibility: hidden; }
.tortilla {
  position: absolute; left: 50%;
  width: 21%;
  z-index: 3;
  filter: drop-shadow(3px 4px 0 rgba(0,0,0,.55));
  pointer-events: none;
}
.splat {
  position: absolute; z-index: 5; pointer-events: none;
  transform: translate(-50%, -50%);
  border-radius: 46% 54% 40% 60% / 55% 45% 55% 45%;
  background: radial-gradient(circle at 38% 35%, #fff3a8 0 10%, #ffcc1a 22%, #f2a300 70%, #c87800);
  box-shadow: 0 0 0 4px rgba(242,163,0,.35), 8px 10px 0 -2px #f2a300, -12px 6px 0 -6px #ffcc1a;
  animation: splat 1.8s ease-out forwards;
}
@keyframes splat { 0% { transform: translate(-50%,-50%) scale(.2); } 12% { transform: translate(-50%,-50%) scale(1.1); } 70% { opacity: .95; } 100% { transform: translate(-50%,-40%) scale(1); opacity: 0; } }
.feedback {
  position: absolute; left: 0; right: 0; top: 12%;
  display: flex; flex-direction: column; align-items: center;
  z-index: 4;
  animation: pop .5s ease-out;
  pointer-events: none;
}
.feedback img { width: 34%; filter: drop-shadow(3px 4px 0 rgba(0,0,0,.5)); }
.feedback p {
  margin: -.4em 0 0; font-size: 2.3rem; padding: 1.1em 1.3em 1.4em;
  background: var(--shout) center / 100% 100% no-repeat;
}
.feedback.good p { color: var(--yolk); }
.feedback.bad p { color: #ff7a5c; }
@keyframes pop { 0% { transform: scale(.4) rotate(-8deg); opacity: 0; } 60% { transform: scale(1.15) rotate(3deg); opacity: 1; } 100% { transform: scale(1) rotate(-2deg); } }

.card {
  position: absolute; left: 18px; right: 18px; top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  padding: 20px 18px;
  text-align: center;
  background: var(--paper);
  color: var(--ink);
  border: 3px solid var(--ink);
  border-radius: 14px;
  box-shadow: 6px 6px 0 var(--ink);
}
.card h2 { margin: 0 0 .3em; font-size: 2.4rem; color: var(--yolk); }
.card p { margin: 0 0 1em; font-size: 1.1rem; font-weight: 700; line-height: 1.3; }
.card.win { background: var(--red); }
.card.win .big { font-size: 2.8rem; margin: .2em 0; animation: pop .5s ease-out; }
</style>
