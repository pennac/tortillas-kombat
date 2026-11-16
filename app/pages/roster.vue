<script setup lang="ts">
import { roster, type Fighter } from '~/data/roster'

const { state, t } = useGame()
const asset = useAsset()
const { play } = useSfx()

const selected = ref<Fighter | null>(null)
const isOpen = (f: Fighter) => state.unlocked >= f.unlockEp
// la Fritality si rivede solo a puntata finita (completeEpisode porta unlocked a n+1)
const hasFritality = (f: Fighter) => f.fritality !== undefined && state.unlocked > f.fritality
const playingFritality = ref(false)
function showFritality() {
  playingFritality.value = true
  play(VOZ.fritality)
}

function open(f: Fighter) {
  if (!isOpen(f)) return
  selected.value = f
  playingFritality.value = false
  if (f.voz) play(f.voz)
}
</script>

<template>
  <main class="stage roster">
    <header class="bar">
      <NuxtLink to="/play" class="pill homebtn">◀ {{ t.home }}</NuxtLink>
      <LangSwitch />
    </header>
    <h1 class="inked">{{ t.rosterTitle }}</h1>

    <div class="grid">
      <button
        v-for="f in roster" :key="f.id"
        class="cell" :class="{ locked: !isOpen(f) }"
        :style="{ '--c': f.color }"
        @click="open(f)"
      >
        <img :src="asset(`media/roster/roster-${f.id}.jpg`)" :alt="isOpen(f) ? f.name : '?'" loading="lazy">
        <span v-if="isOpen(f)" class="name">{{ f.name }}</span>
        <span v-else class="lock">?<small>{{ t.locked }} {{ f.unlockEp }}</small></span>
      </button>
    </div>

    <div v-if="selected" class="detail" :style="{ '--c': selected.color }" @click="selected = null">
      <video
        v-if="playingFritality && selected.fritality !== undefined"
        :key="'fr-' + selected.id" class="media-fill fr"
        :src="asset(`media/fritality/fritality-${selected.id}.mp4`)"
        autoplay muted playsinline @ended="playingFritality = false"
      />
      <video
        v-else
        :key="selected.id" class="media-fill"
        :src="asset(`media/roster/roster-${selected.id}.mp4`)"
        :poster="asset(`media/roster/roster-${selected.id}.jpg`)"
        autoplay muted playsinline loop
      />
      <div class="info" @click.stop>
        <h2 class="inked">{{ selected.name }}</h2>
        <p class="epithet">{{ selected.epithet[state.lang] }}</p>
        <ul class="stats">
          <li v-for="(v, i) in selected.stats" :key="i">
            <span>{{ t.statNames[i] }}</span>
            <b><i :style="{ width: `${v * 10}%` }" /></b>
            <em>{{ v }}</em>
          </li>
        </ul>
        <p class="line">“{{ selected.line[state.lang] }}”</p>
        <div class="acts">
          <button v-if="hasFritality(selected)" class="btn red" @click="showFritality">{{ t.fritality }}</button>
          <span v-else-if="selected.fritality !== undefined" class="frlock">{{ t.fritalityLocked }} {{ selected.fritality }}</span>
          <button class="btn" @click="selected = null">{{ t.back }}</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.roster { overflow-y: auto; background: radial-gradient(ellipse at top, #3a2a15, #0d0b09 70%); padding-bottom: 20px; }
.bar { position: sticky; top: 0; z-index: 5; display: flex; justify-content: space-between; align-items: center; padding: 10px; background: linear-gradient(#0d0b09, transparent); }
.homebtn { background: var(--paper); color: var(--ink); text-decoration: none; box-shadow: 2px 2px 0 var(--ink); }
h1 { margin: 4px 0 12px; text-align: center; font-size: 2.1rem; color: var(--yolk); }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 0 10px; }
.cell {
  position: relative; padding: 0; aspect-ratio: 4 / 5; overflow: hidden;
  border: 3px solid var(--ink); border-radius: 10px;
  background: var(--c); box-shadow: 0 0 0 2px var(--c), 4px 4px 0 var(--ink);
}
.cell img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .2s; }
.cell:active img { transform: scale(1.06); }
.cell .name {
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 3px 4px; font-family: var(--title); font-size: .95rem; letter-spacing: .03em;
  color: var(--paper); background: linear-gradient(transparent, rgba(0,0,0,.85)); text-shadow: 1px 1px 0 var(--ink);
}
.cell.locked { background: #1a1612; box-shadow: 0 0 0 2px #333, 4px 4px 0 var(--ink); cursor: default; }
.cell.locked img { filter: brightness(0) contrast(1); opacity: .9; }
.lock {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: var(--title); font-size: 3rem; color: var(--yolk); text-shadow: 3px 3px 0 var(--ink);
}
.lock small { font-family: var(--text); font-size: .7rem; font-weight: 700; color: var(--paper); text-shadow: none; padding: 0 6px; text-align: center; }

.detail { position: absolute; inset: 0; z-index: 20; background: var(--c); }
.detail::after { content: ''; position: absolute; inset: 0; background: linear-gradient(transparent 45%, rgba(0,0,0,.85)); pointer-events: none; }
.info {
  position: absolute; left: 12px; right: 12px; bottom: 14px; z-index: 2;
  padding: 12px 14px; background: rgba(239,230,210,.95); color: var(--ink);
  border: 3px solid var(--ink); border-radius: 14px; box-shadow: 5px 5px 0 var(--ink);
}
.info h2 { margin: 0; font-size: 2rem; color: var(--c); }
.epithet { margin: 0 0 8px; font-weight: 700; font-size: .95rem; }
.stats { list-style: none; margin: 0 0 8px; padding: 0; display: grid; gap: 4px; }
.stats li { display: grid; grid-template-columns: 74px 1fr 22px; align-items: center; gap: 6px; font-weight: 700; font-size: .85rem; }
.stats b { height: 12px; background: #d6ccb6; border: 2px solid var(--ink); border-radius: 6px; overflow: hidden; }
.stats i { display: block; height: 100%; background: var(--c); }
.stats em { font-style: normal; font-family: var(--title); font-size: 1.05rem; text-align: right; }
.line { margin: 0 0 10px; font-style: italic; font-weight: 700; font-size: 1.05rem; }
.info .btn { width: 100%; font-size: 1.2rem; padding: .35em; }
.acts { display: flex; gap: 10px; justify-content: center; align-items: center; flex-wrap: wrap; }
.frlock { font-size: .85rem; opacity: .7; font-weight: 700; }
</style>
