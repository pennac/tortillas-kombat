<script setup lang="ts">
// Note legali, privacy e cookie (IT/ES)
import { legal, LEGAL_UPDATED } from '~/data/legal'

const { state, setConsent } = useGame()
const L = computed(() => legal[state.lang])
const router = useRouter()

useHead(() => ({ title: `${L.value.pageTitle} · Tortillas Kombat`, meta: [{ name: 'robots', content: 'noindex' }] }))

function back() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

function resetConsent() {
  // se GA era già caricato, togliamo anche i suoi cookie
  document.cookie.split(';').map((c) => c.split('=')[0]!.trim()).filter((n) => n.startsWith('_ga'))
    .forEach((n) => { document.cookie = `${n}=; Max-Age=0; path=/; domain=${location.hostname.replace(/^www\./, '.')}`; document.cookie = `${n}=; Max-Age=0; path=/` })
  setConsent(null)
  location.reload()
}
</script>

<template>
  <div class="legal">
    <nav>
      <button type="button" class="pill" @click="back">◀ {{ L.back }}</button>
      <LangSwitch />
    </nav>
    <h1 class="inked">{{ L.pageTitle }}</h1>
    <p class="upd">{{ L.updated }}: {{ LEGAL_UPDATED }}</p>

    <section v-for="s in L.sections" :key="s.title">
      <h2 class="inked">{{ s.title }}</h2>
      <p v-for="(b, k) in s.body" :key="k">{{ b }}</p>
    </section>

    <section>
      <h2 class="inked">{{ L.cookiesTitle }}</h2>
      <p>{{ L.cookiesIntro }}</p>
      <div class="table">
        <div v-for="c in L.cookies" :key="c.name" class="row">
          <b>{{ c.name }}</b>
          <span><i>{{ L.cookieHead[1] }}:</i> {{ c.who }}</span>
          <span><i>{{ L.cookieHead[2] }}:</i> {{ c.purpose }}</span>
          <span><i>{{ L.cookieHead[3] }}:</i> {{ c.duration }}</span>
        </div>
      </div>
    </section>

    <section>
      <h2 class="inked">{{ L.manageTitle }}</h2>
      <p>{{ L.manageText }}</p>
      <button type="button" class="btn" @click="resetConsent">{{ L.manageBtn }}</button>
    </section>
  </div>
</template>

<style scoped>
.legal {
  max-width: 720px; margin: 0 auto; min-height: 100dvh; user-select: text;
  padding: calc(14px + env(safe-area-inset-top)) 20px calc(40px + env(safe-area-inset-bottom));
}
nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
nav .pill { border: 0; cursor: pointer; }
h1 { font-size: 2.2rem; color: var(--yolk); margin: 0; line-height: 1; }
.upd { opacity: .6; font-size: .85rem; margin: .4em 0 1.2em; }
h2 { font-size: 1.6rem; color: var(--yolk); margin: 1.4em 0 .4em; }
p { line-height: 1.5; margin: 0 0 .8em; }
.table { display: grid; gap: 10px; }
.row { display: grid; gap: 2px; padding: 10px 12px; border: 2px solid rgba(239,230,210,.2); border-radius: 10px; font-size: .92rem; }
.row b { color: var(--yolk); font-family: monospace; font-size: 1rem; }
.row i { opacity: .65; font-style: normal; }
</style>
