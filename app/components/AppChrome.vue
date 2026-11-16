<script setup lang="ts">
// Elementi comuni a tutte le pagine: consenso cookie, avviso orientamento.
const { state, t } = useGame()
const { accept, refuse, enabled } = useAnalytics()
const route = useRoute()
const showConsent = computed(() => enabled && state.consent === null && route.path !== '/legal')
</script>

<template>
  <div v-if="showConsent" class="consent">
    <p>{{ t.consentText }} <NuxtLink to="/legal" class="more">{{ t.legalLink }}</NuxtLink></p>
    <div class="row">
      <button class="btn small ghost" @click="refuse">{{ t.consentNo }}</button>
      <button class="btn small" @click="accept">{{ t.consentYes }}</button>
    </div>
  </div>
  <div class="rotate"><span>📱↻</span><p class="inked">{{ t.rotate }}</p></div>
</template>

<style scoped>
.consent {
  position: fixed; left: 50%; bottom: calc(10px + env(safe-area-inset-bottom)); transform: translateX(-50%);
  width: min(94vw, 420px); z-index: 200; padding: 12px 14px;
  background: var(--paper); color: var(--ink); border: 3px solid var(--ink); border-radius: 12px; box-shadow: 4px 4px 0 var(--ink);
  font-size: .9rem; font-weight: 700;
}
.consent p { margin: 0 0 10px; line-height: 1.3; }
.more { color: var(--red); font-weight: 700; }
.row { display: flex; gap: 8px; justify-content: flex-end; }
.btn.small { font-size: 1rem; padding: .35em .9em; }
.btn.ghost { background: transparent; color: var(--ink); box-shadow: none; }
.rotate { display: none; }
/* telefono in orizzontale: chiede di girarlo */
@media (orientation: landscape) and (max-height: 520px) and (pointer: coarse) {
  .rotate {
    display: flex; position: fixed; inset: 0; z-index: 300; flex-direction: column; align-items: center; justify-content: center;
    background: var(--ink); text-align: center;
  }
  .rotate span { font-size: 3.5rem; }
  .rotate p { font-size: 1.8rem; color: var(--yolk); margin: .3em 0 0; }
}
</style>
