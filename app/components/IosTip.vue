<script setup lang="ts">
defineEmits<{ close: [] }>()
const { t } = useGame()
</script>

<template>
  <div class="iostip" @click="$emit('close')">
    <div class="tipcard" @click.stop>
      <h3 class="inked">{{ t.iosTitle }}</h3>
      <p>{{ t.iosHelp }}</p>
      <button type="button" class="btn" @click="$emit('close')">{{ t.ok }}</button>
    </div>
    <span class="arrow">⬇</span>
  </div>
</template>

<style scoped>
.iostip { position: fixed; inset: 0; z-index: 150; background: rgba(0,0,0,.7); display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: calc(40px + env(safe-area-inset-bottom)); }
.tipcard { width: min(90vw, 380px); background: var(--paper); color: var(--ink); border: 3px solid var(--ink); border-radius: 14px; box-shadow: 5px 5px 0 var(--ink); padding: 16px; text-align: center; }
.tipcard h3 { margin: 0 0 .3em; font-size: 1.8rem; color: var(--red); }
.tipcard p { margin: 0 0 .8em; font-weight: 700; }
.arrow { font-size: 2.4rem; color: var(--yolk); margin-top: 8px; animation: bounceA 1s ease-in-out infinite; }
@keyframes bounceA { 50% { transform: translateY(8px); } }
</style>
