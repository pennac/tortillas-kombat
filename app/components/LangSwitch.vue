<script setup lang="ts">
const { state, setLang } = useGame()
</script>

<template>
  <div class="lang">
    <button :class="{ on: state.lang === 'es' }" @click.stop="setLang('es')">ES</button>
    <button :class="{ on: state.lang === 'it' }" @click.stop="setLang('it')">IT</button>
  </div>
</template>

<style scoped>
.lang {
  display: inline-flex;
  border: 2px solid var(--ink);
  border-radius: 999px;
  overflow: hidden;
  box-shadow: 2px 2px 0 var(--ink);
}
.lang button {
  font-family: var(--title);
  font-size: 1rem;
  letter-spacing: .06em;
  padding: .2em .75em;
  border: 0;
  background: var(--paper);
  color: var(--ink);
}
.lang button.on { background: var(--yolk); }
</style>
