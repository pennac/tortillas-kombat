// Dopo il build: toglie dal sito i media pesanti quando sono serviti da un CDN esterno (NUXT_PUBLIC_MEDIA_URL).
// Restano grafica, sprite e voci (leggeri e usati anche offline).
import { rmSync } from 'node:fs'
const heavy = ['p00', 'p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'fritality', 'roster', 'musica', 'home']
for (const d of heavy) rmSync(`.output/public/media/${d}`, { recursive: true, force: true })
console.log('Media pesanti rimossi dal sito: vengono letti da', process.env.NUXT_PUBLIC_MEDIA_URL)
