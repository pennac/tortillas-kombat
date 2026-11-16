<script setup lang="ts">
// Boss "Huevo-Tron" (Puntata 5), in 3 fasi:
// 1) tocca a sinistra/destra per schivare i riflettori (Giro de Guion: comandi invertiti 5 s)
// 2) tocca gli sfiati quando si aprono
// 3) tieni premuto e lascia quando la barra è nell'oro: Gran Vuelco
const props = defineProps<{ background: string }>()
const emit = defineEmits<{ win: [] }>()
const { t } = useGame()
const { track } = useAnalytics()
const { play, playAndWait } = useSfx()
const { tone, siren } = useSynth()
const asset = useAsset()

type Phase = 'intro' | 'p1' | 'p2' | 'p3' | 'won' | 'lost'
const phase = ref<Phase>('intro')
const lives = ref(5)
const fails = ref(0)
const banner = ref('')
const shout = ref<{ text: string; good: boolean } | null>(null)
const MAXL = computed(() => (fails.value >= 3 ? 7 : 5))

// fase 1
const lane = ref(1)
const warn = ref<number | null>(null)
const fire = ref<number | null>(null)
const dodged = ref(0)
const inverted = ref(false)
const NEED1 = 10
// fase 2
const vents = ref<boolean[]>([false, false, false, false, false, false])
const closed = ref(0)
const NEED2 = 8
// fase 3
const power = ref(0)
const holding = ref(false)
const GOLD: [number, number] = [0.78, 0.94]

let timers: ReturnType<typeof setTimeout>[] = []
let raf = 0
function later(fn: () => void, ms: number) { timers.push(setTimeout(fn, ms)) }
function clearAll() { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf) }

async function startGame() {
  clearAll()
  lives.value = MAXL.value
  await playAndWait(VOZ.round, 1800)
  play(VOZ.cocinar)
  startP1()
}

function say(text: string) { banner.value = text; later(() => (banner.value = ''), 1600) }
function flash(text: string, good: boolean) { shout.value = { text, good }; later(() => (shout.value = null), 600) }
function hurt() {
  lives.value--
  tone(110, 0.3, 'sawtooth', 0.16)
  flash(t.value.struck, false)
  if (lives.value <= 0) finish(false)
}

// ---- fase 1: riflettori
function startP1() {
  phase.value = 'p1'; dodged.value = 0; lane.value = 1; inverted.value = false
  say(`${t.value.phase} 1 · ${t.value.dodge}`)
  later(beam, 1500)
}
function beam() {
  if (phase.value !== 'p1') return
  if (dodged.value >= NEED1) return startP2()
  // Giro de Guion a metà fase
  if (dodged.value === 4 && !inverted.value) {
    inverted.value = true
    siren(); say(t.value.inverted)
    later(() => { inverted.value = false }, 5000)
  }
  const target = Math.random() < 0.6 ? lane.value : Math.floor(Math.random() * 3)
  warn.value = target
  const w = fails.value >= 3 ? 950 : 750
  later(() => {
    warn.value = null; fire.value = target
    tone(220, 0.25, 'square', 0.08)
    if (lane.value === target) hurt(); else dodged.value++
    later(() => { fire.value = null; beam() }, 380)
  }, w)
}
function p1Tap(e: PointerEvent) {
  const right = e.clientX > window.innerWidth / 2
  const dir = (right ? 1 : -1) * (inverted.value ? -1 : 1)
  lane.value = Math.max(0, Math.min(2, lane.value + dir))
}

// ---- fase 2: sfiati
function startP2() {
  phase.value = 'p2'; closed.value = 0; vents.value = vents.value.map(() => false)
  say(`${t.value.phase} 2 · ${t.value.vents}`)
  later(openVent, 1400)
}
function openVent() {
  if (phase.value !== 'p2') return
  if (closed.value >= NEED2) return startP3()
  const free = vents.value.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0)
  const i = free[Math.floor(Math.random() * free.length)]!
  vents.value[i] = true
  tone(500, 0.06, 'square', 0.05)
  const life = (fails.value >= 3 ? 1500 : 1150) - closed.value * 40
  later(() => { if (phase.value === 'p2' && vents.value[i]) { vents.value[i] = false; hurt() } }, life)
  later(openVent, 650 + Math.random() * 350)
}
function closeVent(i: number) {
  if (phase.value !== 'p2' || !vents.value[i]) return
  vents.value[i] = false
  closed.value++
  tone(880, 0.07, 'triangle', 0.12)
}

// ---- fase 3: Gran Vuelco
let t3 = 0
function startP3() {
  phase.value = 'p3'; power.value = 0; holding.value = false
  say(`${t.value.phase} 3`)
}
function p3Down() { if (phase.value === 'p3' && !holding.value) { holding.value = true; t3 = performance.now(); raf = requestAnimationFrame(p3Tick) } }
function p3Tick(now: number) {
  const s = (now - t3) / 1000
  power.value = (1 - Math.cos(s * (fails.value >= 3 ? 2.2 : 3))) / 2 // 0 → 1 → 0 ...
  raf = requestAnimationFrame(p3Tick)
}
function p3Up() {
  if (phase.value !== 'p3' || !holding.value) return
  holding.value = false
  cancelAnimationFrame(raf)
  if (power.value >= GOLD[0] && power.value <= GOLD[1]) {
    finish(true)
  } else {
    hurt()
    power.value = 0
  }
}

function onDown(e: PointerEvent) {
  if (phase.value === 'p1') p1Tap(e)
  else if (phase.value === 'p3') p3Down()
}

function finish(won: boolean) {
  clearAll()
  warn.value = null; fire.value = null
  if (won) { phase.value = 'won'; play(VOZ.dale); later(() => emit('win'), 2400) }
  else { fails.value++; phase.value = 'lost'; track('minigame_lose', { game: 'boss', attempt: fails.value }); play(VOZ.eliminado) }
}

const laneX = (i: number) => 18 + i * 32
onBeforeUnmount(clearAll)
</script>

<template>
  <div class="mg boss" @pointerdown="onDown" @pointerup="p3Up" @pointercancel="p3Up">
    <img class="media-fill mg-bg" :src="props.background" alt="">

    <header class="mg-hud">
      <span class="pill title">{{ t.bossTitle }}</span>
      <span class="mg-stat"><b v-for="k in MAXL" :key="k" class="life" :class="{ off: k > lives }">♥</b></span>
    </header>
    <div v-if="['p1','p2','p3'].includes(phase)" class="phases">
      <i v-for="k in 3" :key="k" :class="{ on: Number(phase.slice(1)) >= k }" />
    </div>

    <!-- fase 1 -->
    <template v-if="phase === 'p1'">
      <div v-if="warn !== null" class="warn" :style="{ left: laneX(warn) + '%' }" />
      <div v-if="fire !== null" class="fire" :style="{ left: laneX(fire) + '%' }" />
      <div class="runner" :style="{ left: laneX(lane) + '%' }">
        <img :src="asset('media/sprites/patato-espera.webp')" alt="">
      </div>
      <p class="mg-stat count">{{ dodged }}/{{ NEED1 }}</p>
      <div v-if="inverted" class="inv">⇄</div>
    </template>

    <!-- fase 2 -->
    <template v-if="phase === 'p2'">
      <div class="vents" @pointerdown.stop>
        <button v-for="(open, i) in vents" :key="i" class="vent" :class="{ open }" @pointerdown.prevent="closeVent(i)">
          <span v-if="open" class="steam" />
        </button>
      </div>
      <p class="mg-stat count">{{ closed }}/{{ NEED2 }}</p>
    </template>

    <!-- fase 3 -->
    <template v-if="phase === 'p3'">
      <p class="mg-stat hint3">{{ t.granVuelco }}</p>
      <div class="meter">
        <div class="gold" :style="{ bottom: GOLD[0] * 100 + '%', height: (GOLD[1] - GOLD[0]) * 100 + '%' }" />
        <div class="fill" :style="{ height: power * 100 + '%' }" />
      </div>
      <div class="runner big" :class="{ charge: holding }">
        <img :src="asset('media/sprites/patato-vuelco.webp')" alt="">
      </div>
    </template>

    <div v-if="banner" class="banner inked">{{ banner }}</div>
    <div v-if="shout" class="mg-shout" :style="{ backgroundImage: `url(${asset('media/ui/fumetto-urlo.webp')})`, color: shout.good ? 'var(--yolk)' : '#ff7a5c' }">{{ shout.text }}</div>

    <div v-if="phase === 'intro'" class="mg-card" @pointerdown.stop>
      <h2 class="inked">{{ t.bossTitle }}</h2>
      <p>{{ t.bossHelp }}</p>
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
.life { color: var(--red); margin-left: 2px; font-size: 1.15rem; }
.life.off { color: rgba(255,255,255,.2); }
.phases { position: absolute; top: 56px; left: 0; right: 0; display: flex; justify-content: center; gap: 8px; z-index: 6; }
.phases i { width: 40px; height: 8px; border-radius: 4px; background: rgba(255,255,255,.25); }
.phases i.on { background: var(--yolk); }
.count { position: absolute; top: 72px; left: 0; right: 0; text-align: center; z-index: 6; font-size: 1.3rem; margin: 0; }
.warn, .fire { position: absolute; top: 0; bottom: 0; width: 30%; transform: translateX(-50%); z-index: 3; pointer-events: none; }
.warn { background: repeating-linear-gradient(0deg, rgba(255,77,58,.25) 0 18px, transparent 18px 36px); border-left: 3px dashed #ff4d3a; border-right: 3px dashed #ff4d3a; animation: blinkW .18s steps(2) infinite; }
@keyframes blinkW { 50% { opacity: .35; } }
.fire { background: linear-gradient(90deg, transparent, rgba(255,250,210,.95) 30% 70%, transparent); box-shadow: 0 0 40px #fff; }
.runner { position: absolute; bottom: 6%; width: 36%; z-index: 4; transform: translateX(-38%); transition: left .12s ease-out; pointer-events: none; }
.runner img { width: 100%; filter: drop-shadow(3px 5px 0 rgba(0,0,0,.5)); }
.inv { position: absolute; left: 50%; top: 40%; transform: translateX(-50%); font-size: 4rem; color: #ff4d3a; text-shadow: 3px 3px 0 var(--ink); z-index: 5; animation: blinkW .4s steps(2) infinite; pointer-events: none; }
.vents {
  position: absolute; left: 10%; right: 10%; top: 26%; z-index: 4;
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px;
}
.vent {
  position: relative; aspect-ratio: 1.4; border-radius: 50%;
  border: 5px solid var(--ink); background: radial-gradient(#6b5536, #2c2318 70%);
  box-shadow: inset 0 0 0 8px #a9874a, 4px 4px 0 var(--ink);
}
.vent.open { background: radial-gradient(#ffd27a, #c8321e 70%); box-shadow: inset 0 0 0 8px #a9874a, 0 0 24px #ff7a3a, 4px 4px 0 var(--ink); }
.steam { position: absolute; left: 50%; bottom: 60%; width: 60%; aspect-ratio: 1; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(rgba(255,255,255,.9), transparent 70%); animation: puff .5s ease-out infinite; pointer-events: none; }
@keyframes puff { from { transform: translate(-50%, 20%) scale(.5); opacity: 1; } to { transform: translate(-50%, -40%) scale(1.3); opacity: 0; } }
.hint3 { position: absolute; top: 80px; left: 14px; right: 14px; text-align: center; z-index: 6; margin: 0; font-size: 1.2rem; }
.meter {
  position: absolute; right: 10%; top: 22%; bottom: 20%; width: 34px; z-index: 5;
  border: 4px solid var(--ink); border-radius: 10px; background: rgba(0,0,0,.55); overflow: hidden; box-shadow: 4px 4px 0 var(--ink);
}
.gold { position: absolute; left: 0; right: 0; background: rgba(242,182,50,.55); border-top: 3px solid var(--gold); border-bottom: 3px solid var(--gold); }
.fill { position: absolute; left: 4px; right: 4px; bottom: 0; background: linear-gradient(#fff3a8, #ff7a3a); border-radius: 4px; }
.runner.big { left: 38%; width: 70%; bottom: 10%; }
.runner.big.charge img { animation: shake .08s linear infinite; }
@keyframes shake { 50% { transform: translate(2px, -2px) rotate(-1deg); } }
.banner {
  position: absolute; left: 0; right: 0; top: 38%; z-index: 9; text-align: center;
  font-size: 2rem; color: var(--yolk); animation: bn .4s ease-out; pointer-events: none;
}
@keyframes bn { from { transform: scale(.5); opacity: 0; } }
</style>
