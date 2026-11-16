<script setup lang="ts">
// Servizio alla Tartana: componi gli ordini sulla piastra e nascondi la cipolla all'ispettore.
const emit = defineEmits<{ done: [] }>()
const { t, addEarnings } = useGame()
const asset = useAsset()
const { play } = useSfx()

type Ing = 'patata' | 'uovo' | 'cipolla' | 'olio' | 'sale' | 'peperone-verde' | 'peperone-rosso'
const INGS: Ing[] = ['patata', 'uovo', 'cipolla', 'olio', 'sale', 'peperone-verde', 'peperone-rosso']
const ingImg = (i: Ing | 'nutripasta') => asset(`media/sprites/ing-${i}.webp`)
const CUSTOMERS = ['patata', 'porro', 'pomodoro', 'uovo'].map(c => asset(`media/sprites/cliente-${c}.webp`))

// ordini: sempre 3 ingredienti; quelli con cipolla valgono più Hype
const RECIPES: Ing[][] = [
  ['patata', 'uovo', 'olio'],
  ['patata', 'uovo', 'cipolla'],
  ['patata', 'uovo', 'peperone-verde'],
  ['uovo', 'peperone-rosso', 'sale'],
  ['patata', 'cipolla', 'sale'],
  ['uovo', 'olio', 'peperone-verde']
]

const GOAL = 8
const DURATION = 60
const PATIENCE = 12

type Phase = 'intro' | 'play' | 'result'
const phase = ref<Phase>('intro')
const timeLeft = ref(DURATION)
const served = ref(0)
const pesetas = ref(0)
const hype = ref(0)
const order = ref<Ing[]>([])
const customer = ref(0)
const patience = ref(PATIENCE)
const griddle = ref<Ing[]>([])
const covered = ref(false)
const toast = ref<{ text: string; kind: 'good' | 'bad' } | null>(null)
const inspector = ref(false)
const inspectorLeft = ref(0)
const customerIn = ref(false)

let tick: ReturnType<typeof setInterval> | undefined
let nextInspector = 0
let toastTimer: ReturnType<typeof setTimeout> | undefined

const complete = computed(() =>
  griddle.value.length === order.value.length && order.value.every(i => griddle.value.includes(i))
)
const hasOnion = computed(() => griddle.value.includes('cipolla'))

function say(text: string, kind: 'good' | 'bad') {
  toast.value = { text, kind }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 1400)
}

function newCustomer() {
  let r: Ing[]
  do { r = RECIPES[Math.floor(Math.random() * RECIPES.length)] } while (r === order.value)
  order.value = [...r]
  customer.value = Math.floor(Math.random() * CUSTOMERS.length)
  patience.value = Math.max(8, PATIENCE - served.value)
  griddle.value = []
  covered.value = false
  customerIn.value = false
  requestAnimationFrame(() => { customerIn.value = true })
}

function start() {
  phase.value = 'play'
  timeLeft.value = DURATION
  served.value = 0
  pesetas.value = 0
  hype.value = 0
  nextInspector = DURATION - 14
  newCustomer()
  play(VOZ.cocinar)
  clearInterval(tick)
  tick = setInterval(step, 100)
}

function step() {
  if (phase.value !== 'play') return
  timeLeft.value = Math.max(0, +(timeLeft.value - 0.1).toFixed(1))
  if (inspector.value) {
    inspectorLeft.value = +(inspectorLeft.value - 0.1).toFixed(1)
    if (inspectorLeft.value <= 0) inspect()
  } else {
    patience.value = +(patience.value - 0.1).toFixed(1)
    if (patience.value <= 0) {
      say(t.value.customerLeft, 'bad')
      hype.value = Math.max(0, hype.value - 1)
      newCustomer()
    }
    if (timeLeft.value <= nextInspector && timeLeft.value > 4) {
      nextInspector = timeLeft.value - 16
      inspector.value = true
      inspectorLeft.value = 3
    }
  }
  if (timeLeft.value <= 0) finish()
}

function inspect() {
  inspector.value = false
  if (hasOnion.value && !covered.value) {
    say(t.value.fined, 'bad')
    pesetas.value = Math.max(0, pesetas.value - 10)
    hype.value = Math.max(0, hype.value - 1)
    griddle.value = []
  } else {
    say(t.value.allClear, 'good')
  }
}

function addIngredient(i: Ing) {
  if (phase.value !== 'play' || covered.value) return
  if (griddle.value.includes(i)) return
  if (!order.value.includes(i)) {
    griddle.value = []
    patience.value = Math.max(1, patience.value - 2)
    say(t.value.wrongDish, 'bad')
    return
  }
  griddle.value = [...griddle.value, i]
}

function coverWithNutripasta() {
  if (phase.value !== 'play') return
  if (hasOnion.value) covered.value = true
}

function serveDish() {
  if (phase.value !== 'play' || inspector.value || !complete.value) return
  served.value++
  const onion = order.value.includes('cipolla')
  pesetas.value += onion ? 15 : 10
  hype.value += onion ? 2 : 1
  say(t.value.happy, 'good')
  newCustomer()
}

function finish() {
  clearInterval(tick)
  phase.value = 'result'
  inspector.value = false
  addEarnings(pesetas.value, hype.value)
  play(served.value >= GOAL ? VOZ.ganador : VOZ.eliminado)
}

onBeforeUnmount(() => { clearInterval(tick); clearTimeout(toastTimer) })
</script>

<template>
  <div class="tartana" @click.stop>
    <img class="media-fill bg" :src="asset('media/tartana/tartana-banco.jpg')" alt="">
    <div class="dim" />

    <header class="hud">
      <span class="pill title">{{ t.served }} {{ served }}/{{ GOAL }}</span>
      <span class="pill coins">₧ {{ pesetas }}</span>
      <span class="pill clock" :class="{ low: timeLeft <= 10 }">{{ Math.ceil(timeLeft) }}s</span>
    </header>

    <!-- cliente o ispettore -->
    <div v-if="phase === 'play'" class="queue">
      <div v-if="!inspector" class="customer" :class="{ in: customerIn }">
        <img :src="CUSTOMERS[customer]" alt="">
        <div class="order">
          <span class="label">{{ t.order }}</span>
          <div class="items">
            <img v-for="i in order" :key="i" :src="ingImg(i)" :class="{ done: griddle.includes(i) }" alt="">
          </div>
          <div class="patience"><i :style="{ width: `${(patience / PATIENCE) * 100}%` }" /></div>
        </div>
      </div>
      <div v-else class="customer inspector in">
        <img :src="asset('media/sprites/ispettore.webp')" alt="">
        <div class="order alarm">
          <span class="label">{{ t.inspector }}</span>
          <p v-if="hasOnion && !covered">{{ t.hideOnion }}</p>
          <div class="patience"><i :style="{ width: `${(inspectorLeft / 3) * 100}%` }" /></div>
        </div>
      </div>
    </div>

    <!-- piastra -->
    <button v-if="phase === 'play'" class="griddle" :class="{ ready: complete && !inspector }" @click="serveDish">
      <img v-for="i in griddle" :key="i" :src="ingImg(i)" alt="">
      <img v-if="covered" class="cover" :src="ingImg('nutripasta')" alt="">
      <span v-if="complete && !inspector" class="hint">{{ t.serve }}</span>
    </button>

    <!-- ingredienti -->
    <nav v-if="phase === 'play'" class="tray">
      <button v-for="i in INGS" :key="i" class="ing" @click="addIngredient(i)">
        <img :src="ingImg(i)" :alt="i">
      </button>
      <button class="ing nutri" :class="{ pulse: inspector && hasOnion && !covered }" @click="coverWithNutripasta">
        <img :src="ingImg('nutripasta')" alt="Nutripasta">
      </button>
    </nav>

    <div v-if="inspector" class="siren" />
    <p v-if="toast" class="toast inked" :class="toast.kind">{{ toast.text }}</p>

    <div v-if="phase === 'intro'" class="card">
      <img class="tartana-ico" :src="asset('media/ui/tartana-icona.webp')" alt="">
      <h2 class="inked">{{ t.tartanaTitle }}</h2>
      <p>{{ t.tartanaHelp }}</p>
      <p class="goal">{{ t.tartanaGoal }}</p>
      <button class="btn" @click="start">{{ t.tartanaStart }}</button>
    </div>

    <div v-if="phase === 'result'" class="card">
      <h2 class="inked">{{ t.resultTitle }}</h2>
      <p>{{ served >= GOAL ? t.resultGood : t.resultBad }}</p>
      <p class="big">{{ t.served }}: {{ served }}/{{ GOAL }}</p>
      <p class="big">{{ t.earned }}: ₧ {{ pesetas }} <small>({{ t.aceitunaCut }})</small></p>
      <p class="big">{{ t.hypeLabel }}: +{{ hype }}</p>
      <div class="row">
        <button v-if="served < GOAL" class="btn ghost" @click="start">{{ t.retry }}</button>
        <button class="btn" @click="emit('done')">{{ t.continueBtn }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tartana { position: absolute; inset: 0; z-index: 30; overflow: hidden; touch-action: manipulation; }
.bg { filter: brightness(.75) saturate(.9); }
.dim { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,.45), transparent 30%, transparent 55%, rgba(0,0,0,.75)); }

.hud { position: absolute; top: 12px; left: 12px; right: 12px; display: flex; justify-content: space-between; gap: 6px; z-index: 5; }
.hud .pill { box-shadow: 2px 2px 0 var(--ink); }
.title { background: var(--yolk); color: var(--ink); }
.coins { background: var(--paper); color: var(--ink); }
.clock { background: var(--ink); color: var(--paper); border-color: var(--paper); }
.clock.low { background: var(--red); animation: blink .6s steps(2) infinite; }
@keyframes blink { 50% { opacity: .4; } }

.queue { position: absolute; left: 0; right: 0; top: 52px; height: 30%; z-index: 4; pointer-events: none; }
.customer { position: absolute; left: 8px; top: 0; height: 100%; display: flex; align-items: flex-start; gap: 6px; transform: translateX(-120%); transition: transform .35s ease-out; }
.customer.in { transform: translateX(0); }
.customer > img { height: 100%; filter: drop-shadow(3px 4px 0 rgba(0,0,0,.6)); }
.order {
  margin-top: 6px; padding: 8px 10px; min-width: 150px;
  background: var(--paper); color: var(--ink);
  border: 3px solid var(--ink); border-radius: 14px; box-shadow: 4px 4px 0 var(--ink);
}
.order .label { font-family: var(--title); letter-spacing: .06em; font-size: 1rem; }
.order p { margin: 2px 0 0; font-weight: 700; font-size: .9rem; max-width: 170px; }
.items { display: flex; gap: 4px; margin-top: 4px; }
.items img { width: 46px; height: 46px; object-fit: contain; }
.items img.done { opacity: .3; filter: grayscale(1); }
.patience { margin-top: 6px; height: 7px; background: #bbb; border-radius: 4px; overflow: hidden; border: 1px solid var(--ink); }
.patience i { display: block; height: 100%; background: var(--olive); transition: width .1s linear; }
.alarm { background: #ffd2c7; }
.alarm .patience i { background: var(--red); }
.inspector > img { height: 115%; }

.griddle {
  position: absolute; left: 50%; top: 50%;
  width: 62%; height: 15%;
  transform: translate(-50%, -50%);
  display: flex; align-items: center; justify-content: center; gap: 4px;
  background: rgba(20,17,13,.35);
  border: 3px dashed rgba(242,182,50,.6);
  border-radius: 16px;
  z-index: 4;
}
.griddle img { width: 22%; max-height: 90%; object-fit: contain; filter: drop-shadow(2px 3px 0 rgba(0,0,0,.6)); animation: drop .25s ease-out; }
.griddle .cover { position: absolute; width: 34%; animation: drop .2s ease-out; }
.griddle.ready { border-style: solid; border-color: var(--yolk); box-shadow: 0 0 24px rgba(242,182,50,.8); animation: glow .8s ease-in-out infinite; }
.griddle .hint { position: absolute; bottom: -1.9em; left: 0; right: 0; font-family: var(--title); letter-spacing: .05em; color: var(--yolk); text-shadow: 2px 2px 0 var(--ink); font-size: 1.15rem; }
@keyframes drop { from { transform: translateY(-30px) scale(1.2); opacity: 0; } }
@keyframes glow { 50% { box-shadow: 0 0 40px rgba(242,182,50,1); } }

.tray {
  position: absolute; left: 8px; right: 8px; bottom: 12px;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
  z-index: 5;
}
.ing {
  aspect-ratio: 1; padding: 4px;
  background: var(--paper); border: 3px solid var(--ink); border-radius: 12px;
  box-shadow: 3px 3px 0 var(--ink);
}
.ing img { width: 100%; height: 100%; object-fit: contain; }
.ing:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--ink); }
.nutri { background: #c9ccd1; }
.nutri.pulse { background: var(--red); animation: shake .3s infinite; }
@keyframes shake { 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } }

.siren { position: absolute; inset: 0; z-index: 3; pointer-events: none; animation: siren .5s steps(2) infinite; }
@keyframes siren { 0% { box-shadow: inset 0 0 60px 20px rgba(220,30,20,.55); } 50% { box-shadow: inset 0 0 60px 20px rgba(30,60,220,.55); } }

.toast { position: absolute; left: 0; right: 0; top: 38%; text-align: center; margin: 0; font-size: 1.9rem; z-index: 6; padding: 0 12px; animation: pop .4s ease-out; pointer-events: none; }
.toast.good { color: var(--yolk); }
.toast.bad { color: #ff7a5c; }
@keyframes pop { from { transform: scale(.5); opacity: 0; } }

.card {
  position: absolute; left: 16px; right: 16px; top: 50%; transform: translateY(-50%);
  z-index: 10; padding: 18px 16px; text-align: center;
  background: var(--paper); color: var(--ink);
  border: 3px solid var(--ink); border-radius: 14px; box-shadow: 6px 6px 0 var(--ink);
}
.card h2 { margin: 0 0 .3em; font-size: 2rem; color: var(--yolk); }
.card p { margin: 0 0 .7em; font-weight: 700; font-size: 1.02rem; line-height: 1.3; }
.card .goal { color: var(--red); }
.card .big { font-size: 1.15rem; margin-bottom: .35em; }
.card small { display: block; font-size: .8rem; opacity: .7; }
.row { display: flex; gap: 10px; justify-content: center; margin-top: 10px; flex-wrap: wrap; }
.tartana-ico { display: block; width: 46%; margin: -70px auto 0; filter: drop-shadow(3px 4px 0 rgba(0,0,0,.35)); }
</style>
