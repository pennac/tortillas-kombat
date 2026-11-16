<script setup lang="ts">
// Minigioco "Noche Flamenca" (Puntata 3): le fette di jamón scendono,
// tocca quando arrivano sulla linea, a tempo con le palmas. Batti El Jamonero.
const props = defineProps<{ background: string }>()
const emit = defineEmits<{ win: [] }>()
const { t } = useGame()
const { track } = useAnalytics()
const { play, playAndWait } = useSfx()
const { clap, tone } = useSynth()
const asset = useAsset()

const FALL = 1.6          // secondi dall'alto alla linea
const HIT_Y = 0.74        // linea di taglio (0 = alto)
const LEAD = 2.0          // attesa prima della prima nota

// spartito: parte A a 108 bpm, poi cambio di compás a 138 bpm con accenti di bulería
function buildChart() {
  const beats: number[] = []
  const notes: number[] = []
  let tt = LEAD
  const a = 60 / 108
  for (let i = 0; i < 16; i++) {
    beats.push(tt)
    if (i % 2 === 0 || i % 8 === 7) notes.push(tt)
    if (i === 11 || i === 13) notes.push(tt + a / 2)
    tt += a
  }
  const compasAt = tt
  const b = 60 / 138
  const accents = [2, 5, 7, 9, 11] // 12 tempi, accenti sul 3-6-8-10-12
  for (let i = 0; i < 24; i++) {
    beats.push(tt)
    if (accents.includes(i % 12)) notes.push(tt)
    tt += b
  }
  return { beats, notes, compasAt, end: tt + 0.6 }
}
const chart = buildChart()

type Phase = 'intro' | 'play' | 'won' | 'lost'
const phase = ref<Phase>('intro')
const now = ref(0)
const judged = ref<Record<number, 'good' | 'miss'>>({})
const hits = ref(0)
const fails = ref(0)
const shout = ref<{ text: string; good: boolean } | null>(null)
const compas = ref(false)
const cutFx = ref(0)

const target = computed(() => Math.ceil(chart.notes.length * (fails.value >= 3 ? 0.55 : 0.7)))
const rival = computed(() => Math.min(target.value, Math.floor((now.value / chart.end) * target.value)))
/** note visibili sul nastro */
const visible = computed(() => chart.notes
  .map((at, i) => ({ i, at, y: HIT_Y - ((at - now.value) / FALL) * HIT_Y }))
  .filter((n) => n.y > -0.1 && n.y < 1.05 && !judged.value[n.i]))

let raf = 0
let t0 = 0
let beatIdx = 0

async function startGame() {
  judged.value = {}; hits.value = 0; beatIdx = 0; now.value = 0; compas.value = false
  phase.value = 'play'
  await playAndWait(VOZ.round, 1800)
  play(VOZ.cocinar)
  t0 = performance.now()
  raf = requestAnimationFrame(tick)
}

function tick(ts: number) {
  now.value = (ts - t0) / 1000
  // palmas sul tempo
  while (beatIdx < chart.beats.length && now.value >= chart.beats[beatIdx]!) {
    clap(chart.beats[beatIdx]! >= chart.compasAt ? 0.4 : 0.3)
    beatIdx++
  }
  if (!compas.value && now.value >= chart.compasAt - 0.8) { compas.value = true; flash(t.value.compas, true) }
  // note mancate
  chart.notes.forEach((at, i) => {
    if (!judged.value[i] && now.value - at > 0.17) { judged.value[i] = 'miss'; flash(t.value.miss, false) }
  })
  if (now.value >= chart.end) return finish()
  raf = requestAnimationFrame(tick)
}

function tap() {
  if (phase.value !== 'play') return
  let best = -1, bestD = 1
  chart.notes.forEach((at, i) => {
    const d = Math.abs(at - now.value)
    if (!judged.value[i] && d < bestD) { best = i; bestD = d }
  })
  if (best >= 0 && bestD <= 0.17) {
    judged.value[best] = 'good'
    hits.value++
    cutFx.value++
    tone(bestD <= 0.08 ? 1046 : 784, 0.07, 'triangle', 0.15)
    flash(t.value.good, true)
  }
}

let shoutTimer: ReturnType<typeof setTimeout> | undefined
function flash(text: string, good: boolean) {
  shout.value = { text, good }
  clearTimeout(shoutTimer)
  shoutTimer = setTimeout(() => (shout.value = null), 600)
}

function finish() {
  cancelAnimationFrame(raf)
  if (hits.value >= target.value) {
    phase.value = 'won'
    play(VOZ.dale)
    setTimeout(() => emit('win'), 2300)
  } else {
    fails.value++
    phase.value = 'lost'; track('minigame_lose', { game: 'rhythm', attempt: fails.value })
    play(VOZ.eliminado)
  }
}

onBeforeUnmount(() => { cancelAnimationFrame(raf); clearTimeout(shoutTimer) })
</script>

<template>
  <div class="mg rhythm" @pointerdown="tap">
    <img class="media-fill mg-bg" :src="props.background" alt="">

    <header class="mg-hud">
      <span class="pill title">{{ t.rhythmTitle }}</span>
    </header>

    <!-- punteggi -->
    <div class="scores">
      <div class="row">
        <span>{{ t.you }}</span>
        <div class="bar"><i :style="{ width: Math.min(100, (hits / target) * 100) + '%' }" /></div>
        <b>{{ hits }}</b>
      </div>
      <div class="row rival">
        <span>{{ t.rival }}</span>
        <div class="bar"><i :style="{ width: (rival / target) * 100 + '%' }" /></div>
        <b>{{ rival }}</b>
      </div>
    </div>

    <!-- nastro con le fette -->
    <div class="lane" :class="{ fast: compas }">
      <div class="line" :style="{ top: HIT_Y * 100 + '%' }" />
      <div v-for="n in visible" :key="n.i" class="slice" :style="{ top: n.y * 100 + '%' }" />
      <div :key="cutFx" class="cut" :class="{ on: cutFx > 0 }" :style="{ top: HIT_Y * 100 + '%' }" />
    </div>

    <div v-if="shout" class="mg-shout small" :style="{ backgroundImage: `url(${asset('media/ui/fumetto-urlo.webp')})`, color: shout.good ? 'var(--yolk)' : '#ff7a5c' }">{{ shout.text }}</div>

    <div v-if="phase === 'intro'" class="mg-card" @pointerdown.stop>
      <h2 class="inked">{{ t.rhythmTitle }}</h2>
      <p>{{ t.rhythmHelp }}</p>
      <button class="btn" @click="startGame">{{ t.go }}</button>
    </div>
    <div v-if="phase === 'won'" class="mg-card win" @pointerdown.stop><h2 class="inked">{{ t.win }}</h2></div>
    <div v-if="phase === 'lost'" class="mg-card" @pointerdown.stop>
      <h2 class="inked">{{ t.lose }}</h2>
      <p>{{ t.you }} {{ hits }} · {{ t.rival }} {{ target }}</p>
      <p v-if="fails >= 3">{{ t.help }}</p>
      <button class="btn" @click="startGame">{{ t.retry }}</button>
    </div>
  </div>
</template>

<style scoped>
.scores {
  position: absolute; top: 58px; left: 14px; right: 14px; z-index: 6;
  display: grid; gap: 6px;
}
.row { display: grid; grid-template-columns: 6.5em 1fr 2em; align-items: center; gap: 8px; font-family: var(--title); letter-spacing: .05em; text-shadow: 2px 2px 0 var(--ink); }
.row b { text-align: right; font-size: 1.2rem; }
.bar { height: 12px; border: 2px solid var(--ink); border-radius: 6px; background: rgba(0,0,0,.45); overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--yolk); transition: width .2s; }
.rival .bar i { background: #d4566b; }
.lane {
  position: absolute; left: 50%; top: 0; bottom: 0; width: 44%;
  transform: translateX(-50%); z-index: 3;
  background: linear-gradient(to bottom, rgba(20,17,13,0), rgba(20,17,13,.55) 25%, rgba(20,17,13,.55));
  border-left: 2px solid rgba(201,162,39,.4); border-right: 2px solid rgba(201,162,39,.4);
}
.lane.fast { border-color: rgba(212,86,107,.7); }
.line {
  position: absolute; left: -12%; right: -12%; height: 6px; transform: translateY(-50%);
  background: var(--gold); box-shadow: 0 0 16px var(--gold); border-radius: 3px;
}
.slice {
  position: absolute; left: 50%; width: 78%; aspect-ratio: 2.4;
  transform: translate(-50%, -50%) rotate(-6deg);
  border: 3px solid var(--ink); border-radius: 50% 46% 52% 48% / 60% 55% 45% 40%;
  background:
    linear-gradient(170deg, transparent 58%, #fbeedd 60% 72%, transparent 74%),
    radial-gradient(ellipse at 30% 40%, #e98a8f, #b8324a 70%, #8a1f33);
  box-shadow: 3px 4px 0 rgba(0,0,0,.45);
}
.cut {
  position: absolute; left: -20%; right: -20%; height: 4px; transform: translateY(-50%); opacity: 0;
  background: #fff; box-shadow: 0 0 18px #fff;
}
.cut.on { animation: cut .25s ease-out; }
@keyframes cut { 0% { opacity: 1; transform: translateY(-50%) scaleX(.2); } 100% { opacity: 0; transform: translateY(-50%) scaleX(1.2); } }
.mg-shout.small { top: auto; bottom: 8%; font-size: 1.6rem; }
</style>
