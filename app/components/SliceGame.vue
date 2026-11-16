<script setup lang="ts">
// Minigioco "Taglio al volo" (Puntata 4, vs Katana Carxofa): trascina il dito
// per tagliare gli ingredienti in volo, evita le lame-petalo.
// Giro de Guion: il pavimento ruota e ogni 20 s parte la pubblicità.
const props = defineProps<{ background: string }>()
const emit = defineEmits<{ win: [] }>()
const { t } = useGame()
const { track } = useAnalytics()
const { play, playAndWait } = useSfx()
const { tone } = useSynth()
const asset = useAsset()

const ING = ['patata', 'uovo', 'cipolla', 'olio', 'peperone-verde', 'peperone-rosso'].map((n) => asset(`media/sprites/ing-${n}.webp`))
interface Item { id: number; x: number; y: number; vx: number; vy: number; rot: number; vr: number; blade: boolean; img: string; cut: number }

type Phase = 'intro' | 'play' | 'won' | 'lost'
const phase = ref<Phase>('intro')
const items = ref<Item[]>([])
const cuts = ref(0)
const hits = ref(0)
const fails = ref(0)
const ad = ref(false)
const shout = ref('')
const trail = ref<{ x: number; y: number; at: number }[]>([])
const spin = ref(0)
const box = ref<HTMLElement | null>(null)

const NEED = computed(() => (fails.value >= 3 ? 24 : 30))
const R = 0.075 // raggio di taglio in frazione di larghezza

let raf = 0, last = 0, spawnIn = 0, adIn = 20, adLeft = 0, id = 0, clock = 0

async function startGame() {
  items.value = []; cuts.value = 0; hits.value = 0; ad.value = false; spawnIn = 0.5; adIn = 20; clock = 0
  phase.value = 'play'
  await playAndWait(VOZ.round, 1800)
  play(VOZ.cocinar)
  last = performance.now()
  raf = requestAnimationFrame(tick)
}

function spawn() {
  const blade = Math.random() < (fails.value >= 3 ? 0.18 : 0.26)
  const x = 0.15 + Math.random() * 0.7
  items.value.push({
    id: ++id, x, y: 1.08,
    vx: (0.5 - x) * (0.35 + Math.random() * 0.3),
    vy: -(1.25 + Math.random() * 0.35),
    rot: Math.random() * 360, vr: (Math.random() - 0.5) * 400,
    blade, img: ING[Math.floor(Math.random() * ING.length)]!, cut: 0
  })
}

function tick(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now
  if (phase.value !== 'play') return
  clock += dt
  spin.value = Math.sin(clock * 0.6) * 10
  spawnIn -= dt
  if (spawnIn <= 0) {
    spawn(); if (Math.random() < 0.35) spawn()
    spawnIn = Math.max(0.45, 0.85 - clock * 0.006)
  }
  // pubblicità
  if (ad.value) { adLeft -= dt; if (adLeft <= 0) ad.value = false }
  else { adIn -= dt; if (adIn <= 0) { ad.value = true; adLeft = fails.value >= 3 ? 1.6 : 2.4; adIn = 20 } }
  const G = 1.15
  for (const it of items.value) {
    it.vy += G * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt
  }
  items.value = items.value.filter((it) => it.y < 1.2 && (!it.cut || now - it.cut < 600))
  trail.value = trail.value.filter((p) => now - p.at < 140)
  raf = requestAnimationFrame(tick)
}

let prev: { x: number; y: number } | null = null
function pt(e: PointerEvent) {
  const r = box.value!.getBoundingClientRect()
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, w: r.width, h: r.height }
}
function down(e: PointerEvent) { if (phase.value === 'play') { const p = pt(e); prev = p } }
function up() { prev = null }
function move(e: PointerEvent) {
  if (phase.value !== 'play' || !prev) return
  const p = pt(e)
  trail.value.push({ x: p.x, y: p.y, at: performance.now() })
  // distanza punto-segmento in pixel
  const ax = prev.x * p.w, ay = prev.y * p.h, bx = p.x * p.w, by = p.y * p.h
  for (const it of items.value) {
    if (it.cut) continue
    const cx = it.x * p.w, cy = it.y * p.h
    const dx = bx - ax, dy = by - ay
    const l2 = dx * dx + dy * dy || 1
    const k = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / l2))
    const d = Math.hypot(ax + k * dx - cx, ay + k * dy - cy)
    if (d < R * p.w) slash(it)
  }
  prev = p
}

function slash(it: Item) {
  it.cut = performance.now()
  if (it.blade) {
    hits.value++
    tone(140, 0.2, 'sawtooth', 0.15)
    flash(t.value.struck)
    if (hits.value >= 3) return finish(false)
  } else {
    cuts.value++
    tone(900 + Math.random() * 300, 0.05, 'triangle', 0.12)
    if (cuts.value >= NEED.value) finish(true)
  }
}

let shoutTimer: ReturnType<typeof setTimeout> | undefined
function flash(text: string) {
  shout.value = text
  clearTimeout(shoutTimer)
  shoutTimer = setTimeout(() => (shout.value = ''), 700)
}

function finish(won: boolean) {
  cancelAnimationFrame(raf)
  ad.value = false
  if (won) { phase.value = 'won'; play(VOZ.dale); setTimeout(() => emit('win'), 2300) }
  else { fails.value++; phase.value = 'lost'; track('minigame_lose', { game: 'slice', attempt: fails.value }); play(VOZ.eliminado) }
}

const trailPath = computed(() => trail.value.map((p) => `${p.x * 100},${p.y * 100}`).join(' '))
onBeforeUnmount(() => { cancelAnimationFrame(raf); clearTimeout(shoutTimer) })
</script>

<template>
  <div ref="box" class="mg slice" @dragstart.prevent @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @pointerleave="up">
    <img class="media-fill mg-bg floor" :src="props.background" alt="" :style="{ transform: `scale(1.35) rotate(${spin}deg)` }">

    <header class="mg-hud">
      <span class="pill title">{{ t.sliceTitle }}</span>
      <span class="mg-stat">{{ t.cuts }} {{ cuts }}/{{ NEED }} · {{ t.hits }} <b v-for="k in 3" :key="k" class="life" :class="{ off: k <= hits }">●</b></span>
    </header>

    <template v-for="it in items" :key="it.id">
      <div v-if="!it.cut" class="it" :class="{ blade: it.blade }" :style="{ left: it.x * 100 + '%', top: it.y * 100 + '%', transform: `translate(-50%,-50%) rotate(${it.rot}deg)` }">
        <img v-if="!it.blade" :src="it.img" alt="">
      </div>
      <template v-else-if="!it.blade">
        <img class="half l" :src="it.img" alt="" :style="{ left: it.x * 100 + '%', top: it.y * 100 + '%' }">
        <img class="half r" :src="it.img" alt="" :style="{ left: it.x * 100 + '%', top: it.y * 100 + '%' }">
      </template>
    </template>

    <svg class="trail" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline :points="trailPath" /></svg>

    <div v-if="ad" class="ad">
      <img :src="asset('media/sprites/ing-nutripasta.webp')" alt="">
      <p class="inked">{{ t.ad }}</p>
      <small>Nutripasta. No sabe a nada.</small>
    </div>

    <div v-if="shout" class="mg-shout" :style="{ backgroundImage: `url(${asset('media/ui/fumetto-urlo.webp')})`, color: '#ff7a5c' }">{{ shout }}</div>

    <div v-if="phase === 'intro'" class="mg-card" @pointerdown.stop>
      <h2 class="inked">{{ t.sliceTitle }}</h2>
      <p>{{ t.sliceHelp }}</p>
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
.floor { transition: none; }
.life { color: #ff7a5c; margin-left: 2px; }
.life.off { color: rgba(255,255,255,.2); }
.it { position: absolute; width: 17%; aspect-ratio: 1; z-index: 3; pointer-events: none; }
.it img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(3px 4px 0 rgba(0,0,0,.5)); }
.it.blade {
  width: 13%;
  background: linear-gradient(120deg, #e8f3e6 0 18%, #3f7a3a 22%, #24461f 80%);
  border: 3px solid var(--ink);
  border-radius: 50% 0 50% 0;
  box-shadow: 0 0 14px rgba(160,255,150,.6);
}
.half { position: absolute; width: 17%; z-index: 3; pointer-events: none; transform: translate(-50%,-50%); }
.half.l { clip-path: inset(0 50% 0 0); animation: hl .6s ease-in forwards; }
.half.r { clip-path: inset(0 0 0 50%); animation: hr .6s ease-in forwards; }
@keyframes hl { to { transform: translate(-90%, 10%) rotate(-40deg); opacity: 0; } }
@keyframes hr { to { transform: translate(-10%, 10%) rotate(40deg); opacity: 0; } }
.trail { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 4; pointer-events: none; }
.trail polyline { fill: none; stroke: #fffbe8; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; stroke-width: 6px; filter: drop-shadow(0 0 4px #fff); }
.ad {
  position: absolute; left: 6%; right: 6%; top: 24%; height: 46%; z-index: 7;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  background: repeating-linear-gradient(45deg, #9a9a9a 0 14px, #8a8a8a 14px 28px);
  border: 4px solid var(--ink); border-radius: 12px; box-shadow: 6px 6px 0 var(--ink);
  color: #eee; animation: adIn .25s ease-out; pointer-events: none;
}
.ad img { width: 34%; }
.ad p { margin: 0; font-size: 2.2rem; color: #f1f1f1; }
.ad small { font-weight: 700; }
@keyframes adIn { from { transform: scale(.6); opacity: 0; } }
</style>
