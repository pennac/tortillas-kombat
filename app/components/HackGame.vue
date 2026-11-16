<script setup lang="ts">
// Minigioco "Televoto" (Puntata 3): Aceituna ruota i tubi a vapore per collegare
// l'ingresso a sinistra all'uscita a destra. 3 griglie a tempo.
// Più Hype del Barrio = più tubi già a posto.
const props = defineProps<{ background: string }>()
const emit = defineEmits<{ win: [] }>()
const { t, state } = useGame()
const { track } = useAnalytics()
const { play } = useSfx()
const { tone } = useSynth()
const asset = useAsset()

// direzioni: 0 su, 1 destra, 2 giù, 3 sinistra
type Kind = 'I' | 'L'
interface Cell { kind: Kind; rot: number; path: boolean }
const OPEN: Record<Kind, number[]> = { I: [1, 3], L: [0, 1] } // a rotazione 0
const DR = [-1, 0, 1, 0]
const DC = [0, 1, 0, -1]
function openings(c: Cell) { return OPEN[c.kind].map((d) => (d + c.rot) % 4) }

const SIZES = [4, 4, 5]
type Phase = 'intro' | 'play' | 'won' | 'lost'
const phase = ref<Phase>('intro')
const level = ref(0)
const size = ref(4)
const grid = ref<Cell[][]>([])
const entry = ref(0)
const exit = ref(0)
const timeLeft = ref(0)
const fails = ref(0)
const flow = ref<Set<string>>(new Set())
const solved = ref(false)

function rnd(n: number) { return Math.floor(Math.random() * n) }

function build(n: number) {
  const g: Cell[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => ({ kind: (Math.random() < 0.5 ? 'I' : 'L') as Kind, rot: rnd(4), path: false })))
  // percorso: per ogni colonna scende/sale fino a una riga a caso, poi va a destra
  const r0 = rnd(n)
  let r = r0
  let from = 3 // entra da sinistra
  const cells: { r: number; c: number; a: number; b: number }[] = []
  for (let c = 0; c < n; c++) {
    const target = c === n - 1 ? rnd(n) : rnd(n)
    while (r !== target) {
      const dir = target > r ? 2 : 0
      cells.push({ r, c, a: from, b: dir })
      r += DR[dir]!
      from = (dir + 2) % 4
    }
    cells.push({ r, c, a: from, b: 1 })
    from = 3
  }
  entry.value = r0
  exit.value = r
  for (const p of cells) {
    const straight = (p.a + 2) % 4 === p.b
    const kind: Kind = straight ? 'I' : 'L'
    let rot = 0
    for (; rot < 4; rot++) {
      const o = OPEN[kind].map((d) => (d + rot) % 4)
      if (o.includes(p.a) && o.includes(p.b)) break
    }
    g[p.r]![p.c] = { kind, rot, path: true }
  }
  // mescola, lasciando a posto alcuni tubi del percorso in base all'Hype
  const keep = Math.min(cells.length - 2, Math.floor(state.hype / 8) + (fails.value >= 3 ? 2 : 0))
  const kept = new Set(cells.slice().sort(() => Math.random() - 0.5).slice(0, keep).map((p) => `${p.r},${p.c}`))
  g.forEach((row, ri) => row.forEach((cell, ci) => {
    if (!kept.has(`${ri},${ci}`)) cell.rot = (cell.rot + 1 + rnd(3)) % 4
  }))
  grid.value = g
  size.value = n
  computeFlow()
}

function computeFlow() {
  const n = size.value
  const seen = new Set<string>()
  let ok = false
  const start = grid.value[entry.value]![0]!
  if (openings(start).includes(3)) {
    const stack: [number, number][] = [[entry.value, 0]]
    while (stack.length) {
      const [r, c] = stack.pop()!
      const key = `${r},${c}`
      if (seen.has(key)) continue
      seen.add(key)
      const o = openings(grid.value[r]![c]!)
      if (r === exit.value && c === n - 1 && o.includes(1)) ok = true
      for (const d of o) {
        const nr = r + DR[d]!, nc = c + DC[d]!
        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue
        if (openings(grid.value[nr]![nc]!).includes((d + 2) % 4)) stack.push([nr, nc])
      }
    }
  }
  flow.value = seen
  return ok
}

function rotate(r: number, c: number) {
  if (phase.value !== 'play' || solved.value) return
  const cell = grid.value[r]![c]!
  cell.rot = (cell.rot + 1) % 4
  tone(320 + rnd(80), 0.05, 'square', 0.06)
  if (computeFlow()) {
    solved.value = true
    tone(660, 0.1); setTimeout(() => tone(990, 0.15), 110)
    setTimeout(nextLevel, 900)
  }
}

function nextLevel() {
  solved.value = false
  if (level.value >= SIZES.length - 1) return finish(true)
  level.value++
  build(SIZES[level.value]!)
}

let timer: ReturnType<typeof setInterval> | undefined
function startGame() {
  level.value = 0
  solved.value = false
  timeLeft.value = fails.value >= 3 ? 100 : 75
  build(SIZES[0]!)
  phase.value = 'play'
  play(VOZ.cocinar)
  clearInterval(timer)
  timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 10) tone(1200, 0.04, 'square', 0.05)
    if (timeLeft.value <= 0) finish(false)
  }, 1000)
}

function finish(won: boolean) {
  clearInterval(timer)
  if (won) {
    phase.value = 'won'
    play(VOZ.dale)
    setTimeout(() => emit('win'), 2400)
  } else {
    fails.value++
    phase.value = 'lost'; track('minigame_lose', { game: 'hack', attempt: fails.value })
    play(VOZ.eliminado)
  }
}

/** linee del tubo dentro la cella (viewBox 0..100) */
function segs(c: Cell) {
  return openings(c).map((d) => [[50, 0], [100, 50], [50, 100], [0, 50]][d]!)
}

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="mg hack">
    <img class="media-fill mg-bg" :src="props.background" alt="">

    <header class="mg-hud">
      <span class="pill title">{{ t.hackTitle }}</span>
      <span class="mg-stat" :class="{ hurry: timeLeft <= 10 }">⏱ {{ timeLeft }}s</span>
    </header>
    <p class="sub mg-stat">{{ t.grid }} {{ level + 1 }}/3 · Hype {{ state.hype }}</p>

    <div v-if="phase !== 'intro'" class="board" :class="{ solved }" :style="{ '--n': size }">
      <span class="port in" :style="{ top: ((entry + 0.5) / size) * 100 + '%' }">▶</span>
      <span class="port out" :style="{ top: ((exit + 0.5) / size) * 100 + '%' }">📺</span>
      <template v-for="(row, r) in grid" :key="r">
        <button
          v-for="(cell, c) in row" :key="c"
          class="cell" :class="{ live: flow.has(`${r},${c}`) }"
          @pointerdown.prevent="rotate(r, c)"
        >
          <svg viewBox="0 0 100 100">
            <line v-for="(p, k) in segs(cell)" :key="k" x1="50" y1="50" :x2="p[0]" :y2="p[1]" class="pipe-o" />
            <line v-for="(p, k) in segs(cell)" :key="'i' + k" x1="50" y1="50" :x2="p[0]" :y2="p[1]" class="pipe" />
            <circle cx="50" cy="50" r="11" class="joint" />
          </svg>
        </button>
      </template>
    </div>

    <div v-if="solved" class="mg-shout" :style="{ backgroundImage: `url(${asset('media/ui/fumetto-urlo.webp')})`, color: 'var(--yolk)' }">{{ t.votesIn }}</div>

    <div v-if="phase === 'intro'" class="mg-card">
      <h2 class="inked">{{ t.hackTitle }}</h2>
      <p>{{ t.hackHelp }}</p>
      <button class="btn" @click="startGame">{{ t.go }}</button>
    </div>
    <div v-if="phase === 'won'" class="mg-card win"><h2 class="inked">{{ t.win }}</h2></div>
    <div v-if="phase === 'lost'" class="mg-card">
      <h2 class="inked">{{ t.hackFail }}</h2>
      <p v-if="fails >= 3">{{ t.help }}</p>
      <button class="btn" @click="startGame">{{ t.retry }}</button>
    </div>
  </div>
</template>

<style scoped>
.sub { position: absolute; top: 52px; left: 0; right: 0; text-align: center; margin: 0; z-index: 6; font-size: 1rem; }
.hurry { color: #ff7a5c; animation: hurry .5s steps(2) infinite; }
@keyframes hurry { 50% { opacity: .4; } }
.board {
  position: absolute; left: 50%; top: 52%; transform: translate(-50%, -50%);
  width: min(76vw, 360px); aspect-ratio: 1; z-index: 4;
  display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 3px;
  padding: 6px; border: 4px solid var(--ink); border-radius: 12px;
  background: #2b241b; box-shadow: 6px 6px 0 var(--ink), inset 0 0 30px rgba(0,0,0,.7);
}
.board.solved { box-shadow: 0 0 30px var(--yolk), 6px 6px 0 var(--ink); }
.cell {
  padding: 0; border: 1px solid #4a3d2a; border-radius: 6px; background: #3a3024; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.cell svg { width: 100%; height: 100%; display: block; transition: transform .1s; }
.cell:active svg { transform: scale(.92); }
.pipe-o { stroke: var(--ink); stroke-width: 30; stroke-linecap: round; }
.pipe { stroke: #8b6f3d; stroke-width: 20; stroke-linecap: round; }
.joint { fill: #a9874a; stroke: var(--ink); stroke-width: 4; }
.cell.live .pipe { stroke: var(--yolk); }
.cell.live .joint { fill: #ffe08a; }
.cell.live { background: #4b3a22; box-shadow: inset 0 0 12px rgba(242,182,50,.5); }
.port { position: absolute; transform: translateY(-50%); font-size: 1.4rem; text-shadow: 0 0 8px var(--yolk); }
.port.in { left: -1.4em; color: var(--yolk); }
.port.out { right: -1.6em; }
</style>
