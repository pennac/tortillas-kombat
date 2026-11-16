<script setup lang="ts">
// Test Your Bite: tap furiosi per spaccare il pane di cemento in 5 secondi.
const emit = defineEmits<{ close: [] }>()
const { t, addEarnings } = useGame()
const asset = useAsset()
const { play } = useSfx()

const NEED = 30
const CRACK = 14
const phase = ref<'intro' | 'play' | 'won' | 'lost'>('intro')
const taps = ref(0)
const timeLeft = ref(5)
const hit = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

const sprite = computed(() => {
  if (phase.value === 'won') return 'pane-rotto'
  return taps.value >= CRACK ? 'pane-crepato' : 'pane-integro'
})

function start() {
  taps.value = 0
  timeLeft.value = 5
  phase.value = 'play'
  play(VOZ.cocinar)
  clearInterval(timer)
  timer = setInterval(() => {
    timeLeft.value = +(timeLeft.value - 0.1).toFixed(1)
    if (timeLeft.value <= 0) end(false)
  }, 100)
}

function tap() {
  if (phase.value !== 'play') return
  taps.value++
  hit.value = false
  requestAnimationFrame(() => { hit.value = true })
  if (taps.value >= NEED) end(true)
}

function end(won: boolean) {
  clearInterval(timer)
  phase.value = won ? 'won' : 'lost'
  if (won) { addEarnings(15, 1); play(VOZ.dale) } else play(VOZ.eliminado)
}

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="bite" @pointerdown="tap" @click.stop>
    <h2 class="inked">{{ t.biteTitle }}</h2>
    <div class="meter"><i :style="{ width: `${Math.min(100, (taps / NEED) * 100)}%` }" /></div>
    <p class="count">{{ taps }} {{ t.taps }} · {{ timeLeft.toFixed(1) }}s</p>
    <img class="bread" :class="{ hit }" :src="asset(`media/ui/${sprite}.webp`)" alt="">

    <div v-if="phase !== 'play'" class="card" @pointerdown.stop>
      <p v-if="phase === 'intro'">{{ t.biteHelp }}</p>
      <p v-else-if="phase === 'won'" class="win">{{ t.biteWin }}</p>
      <p v-else>{{ t.biteLose }}</p>
      <div class="row">
        <button v-if="phase !== 'won'" class="btn red" @click="start">{{ phase === 'intro' ? t.go : t.retry }}</button>
        <button class="btn ghost" @click="emit('close')">{{ t.back }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bite {
  position: absolute; inset: 0; z-index: 40;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  background: radial-gradient(ellipse at center, #4a3418, #0d0b09 75%);
  touch-action: manipulation;
}
h2 { margin: 0; font-size: 2.6rem; color: var(--yolk); }
.meter { width: 70%; height: 16px; border: 3px solid var(--ink); border-radius: 8px; background: #2a241c; overflow: hidden; }
.meter i { display: block; height: 100%; background: linear-gradient(90deg, var(--yolk), var(--red)); }
.count { margin: 0; font-family: var(--title); font-size: 1.3rem; letter-spacing: .05em; }
.bread { width: 70%; filter: drop-shadow(6px 8px 0 rgba(0,0,0,.6)); }
.bread.hit { animation: hit .12s; }
@keyframes hit { 50% { transform: scale(.94) rotate(-3deg); } }
.card {
  position: absolute; left: 18px; right: 18px; bottom: 40px;
  padding: 16px; text-align: center; background: var(--paper); color: var(--ink);
  border: 3px solid var(--ink); border-radius: 14px; box-shadow: 6px 6px 0 var(--ink);
}
.card p { margin: 0 0 12px; font-weight: 700; font-size: 1.1rem; }
.card .win { color: var(--red); font-size: 1.3rem; }
.row { display: flex; gap: 10px; justify-content: center; }
</style>
