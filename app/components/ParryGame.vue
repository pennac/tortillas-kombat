<script setup lang="ts">
// Minigioco "Duelo Final" (Puntata 5, vs Roto). Fase 1: Roto attacca, tocca quando
// il cerchio si chiude sul bersaglio per parare (3 parate). Fase 2: metti nella
// tortilla patata, uovo, cipolla e olio, senza Nutripasta.
const props = defineProps<{ background: string }>()
const emit = defineEmits<{ win: [] }>()
const { t } = useGame()
const { track } = useAnalytics()
const { play, playAndWait } = useSfx()
const { tone } = useSynth()
const asset = useAsset()

type Phase = 'intro' | 'parry' | 'cook' | 'won' | 'lost'
const phase = ref<Phase>('intro')
const lives = ref(3)
const parries = ref(0)
const fails = ref(0)
const ring = ref(0)          // scala del cerchio d'attacco (3 → 1 → oltre)
const attacking = ref(false)
const shout = ref<{ text: string; good: boolean } | null>(null)
const NEED_PARRY = 3
const WINDOW = computed(() => (fails.value >= 3 ? 0.22 : 0.15))

const RECIPE = ['patata', 'uovo', 'cipolla', 'olio']
const tray = ref<{ id: string; img: string; bad: boolean; used: boolean }[]>([])
const inPan = ref<string[]>([])

let raf = 0, t0 = 0, dur = 1200, waitTimer: ReturnType<typeof setTimeout> | undefined

async function startGame() {
  lives.value = 3; parries.value = 0; inPan.value = []
  phase.value = 'parry'
  await playAndWait(VOZ.round, 1800)
  play(VOZ.cocinar)
  nextAttack()
}

function nextAttack() {
  if (phase.value !== 'parry') return
  if (parries.value >= NEED_PARRY) return startCook()
  waitTimer = setTimeout(() => {
    attacking.value = true
    dur = (fails.value >= 3 ? 1350 : 1150) - parries.value * 120
    t0 = performance.now()
    tone(330, 0.15, 'sawtooth', 0.08)
    raf = requestAnimationFrame(tick)
  }, 600 + Math.random() * 900)
}

function tick(now: number) {
  const p = (now - t0) / dur
  ring.value = 3 - 2 * p // a p=1 il cerchio è sul bersaglio
  if (ring.value < 1 - WINDOW.value) return resolve(false)
  raf = requestAnimationFrame(tick)
}

function tap() {
  if (phase.value !== 'parry' || !attacking.value) return
  resolve(Math.abs(ring.value - 1) <= WINDOW.value)
}

function resolve(ok: boolean) {
  cancelAnimationFrame(raf)
  attacking.value = false
  if (ok) {
    parries.value++
    tone(1200, 0.08, 'square', 0.1); setTimeout(() => tone(1600, 0.1, 'square', 0.08), 70)
    flash(t.value.parry, true)
  } else {
    lives.value--
    tone(120, 0.3, 'sawtooth', 0.15)
    flash(t.value.struck, false)
    if (lives.value <= 0) return finish(false)
  }
  nextAttack()
}

function startCook() {
  phase.value = 'cook'
  const all = [...RECIPE.map((n) => ({ id: n, bad: false })), { id: 'np1', bad: true }, { id: 'np2', bad: true }]
  tray.value = all.sort(() => Math.random() - 0.5).map((x) => ({
    ...x, used: false,
    img: asset(`media/sprites/ing-${x.bad ? 'nutripasta' : x.id}.webp`)
  }))
}

function pick(it: { id: string; bad: boolean; used: boolean }) {
  if (phase.value !== 'cook' || it.used) return
  it.used = true
  if (it.bad) {
    lives.value--
    tone(120, 0.3, 'sawtooth', 0.15)
    flash(t.value.struck, false)
    if (lives.value <= 0) finish(false)
    return
  }
  inPan.value.push(it.id)
  tone(600 + inPan.value.length * 120, 0.08, 'triangle', 0.15)
  if (inPan.value.length >= RECIPE.length) setTimeout(() => finish(true), 500)
}

let shoutTimer: ReturnType<typeof setTimeout> | undefined
function flash(text: string, good: boolean) {
  shout.value = { text, good }
  clearTimeout(shoutTimer)
  shoutTimer = setTimeout(() => (shout.value = null), 650)
}

function finish(won: boolean) {
  cancelAnimationFrame(raf); clearTimeout(waitTimer)
  attacking.value = false
  if (won) { phase.value = 'won'; play(VOZ.dale); setTimeout(() => emit('win'), 2300) }
  else { fails.value++; phase.value = 'lost'; track('minigame_lose', { game: 'parry', attempt: fails.value }); play(VOZ.eliminado) }
}

onBeforeUnmount(() => { cancelAnimationFrame(raf); clearTimeout(waitTimer); clearTimeout(shoutTimer) })
</script>

<template>
  <div class="mg parry" @pointerdown="tap">
    <img class="media-fill mg-bg" :src="props.background" alt="">

    <header class="mg-hud">
      <span class="pill title">{{ t.parryTitle }}</span>
      <span class="mg-stat"><b v-for="k in 3" :key="k" class="life" :class="{ off: k > lives }">♥</b></span>
    </header>

    <template v-if="phase === 'parry' || phase === 'intro'">
      <img class="roto" :src="asset('media/roster/roster-roto.jpg')" alt="">
      <div class="pips"><i v-for="k in NEED_PARRY" :key="k" :class="{ on: k <= parries }" /></div>
      <div class="target">
        <span class="ladle">🥄</span>
        <div v-if="attacking" class="ring" :class="{ near: Math.abs(ring - 1) <= WINDOW }" :style="{ transform: `translate(-50%,-50%) scale(${ring})` }" />
      </div>
    </template>

    <template v-if="phase === 'cook'">
      <p class="cookhint mg-stat">{{ t.cook }}</p>
      <div class="pan">
        <img v-for="(id, k) in inPan" :key="id" :src="asset(`media/sprites/ing-${id}.webp`)" alt="" :style="{ transform: `rotate(${k * 90}deg) translateY(-34%)` }">
      </div>
      <div class="tray" @pointerdown.stop>
        <button v-for="it in tray" :key="it.id" class="slot" :class="{ used: it.used }" @click="pick(it)">
          <img :src="it.img" alt="">
        </button>
      </div>
    </template>

    <div v-if="shout" class="mg-shout" :style="{ backgroundImage: `url(${asset('media/ui/fumetto-urlo.webp')})`, color: shout.good ? 'var(--yolk)' : '#ff7a5c' }">{{ shout.text }}</div>

    <div v-if="phase === 'intro'" class="mg-card" @pointerdown.stop>
      <h2 class="inked">{{ t.parryTitle }}</h2>
      <p>{{ t.parryHelp }}</p>
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
.life { color: var(--red); margin-left: 3px; font-size: 1.3rem; }
.life.off { color: rgba(255,255,255,.2); }
.roto {
  position: absolute; top: 64px; left: 50%; transform: translateX(-50%); z-index: 3;
  width: 40%; aspect-ratio: 1; object-fit: cover; object-position: top;
  border-radius: 50%; border: 4px solid var(--gold); box-shadow: 0 0 24px rgba(201,162,39,.7), 4px 4px 0 var(--ink);
}
.pips { position: absolute; top: calc(64px + 42vw); left: 0; right: 0; display: flex; justify-content: center; gap: 8px; z-index: 3; }
.pips i { width: 26px; height: 8px; border-radius: 4px; background: rgba(255,255,255,.25); }
.pips i.on { background: var(--yolk); }
.target {
  position: absolute; left: 50%; top: 66%; width: 30%; aspect-ratio: 1; transform: translate(-50%, -50%); z-index: 4;
  border-radius: 50%; border: 5px solid var(--yolk); background: rgba(20,17,13,.55);
  box-shadow: 0 0 20px rgba(242,182,50,.6);
  display: flex; align-items: center; justify-content: center;
}
.ladle { font-size: 2.6rem; filter: drop-shadow(2px 2px 0 var(--ink)); }
.ring {
  position: absolute; left: 50%; top: 50%; width: 100%; height: 100%;
  border-radius: 50%; border: 6px solid #ff4d3a; box-shadow: 0 0 18px #ff4d3a;
}
.ring.near { border-color: #fff; box-shadow: 0 0 26px #fff; }
.cookhint { position: absolute; top: 64px; left: 14px; right: 14px; text-align: center; margin: 0; z-index: 4; font-size: 1.25rem; }
.pan {
  position: absolute; left: 50%; top: 40%; width: 58%; aspect-ratio: 1; transform: translate(-50%, -50%); z-index: 3;
  border-radius: 50%; border: 10px solid #2a2622; background: radial-gradient(#5a4a35, #2a2219);
  box-shadow: 6px 8px 0 var(--ink);
  display: grid; place-items: center;
}
.pan img { grid-area: 1 / 1; width: 34%; filter: drop-shadow(2px 3px 0 rgba(0,0,0,.5)); animation: drop .3s ease-out; }
@keyframes drop { from { opacity: 0; scale: 1.6; } }
.tray {
  position: absolute; left: 12px; right: 12px; bottom: 8%; z-index: 5;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
}
.slot { aspect-ratio: 1; padding: 8px; border: 3px solid var(--ink); border-radius: 12px; background: var(--paper); box-shadow: 3px 3px 0 var(--ink); }
.slot img { width: 100%; height: 100%; object-fit: contain; }
.slot.used { opacity: .25; }
</style>
