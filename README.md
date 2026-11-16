# Tortillas Kombat · ¡VUELCO! El Show — app

Nuxt 4 (SPA statica), pronta per Netlify. Lingue: italiano e spagnolo. Si entra con una parola chiave che porta direttamente alla puntata.

## Avvio in locale

```bash
npm install
npm run dev        # http://localhost:3000
npm run generate   # sito statico in .output/public
```

## Netlify

`netlify.toml` è già pronto: build `npm run generate`, publish `.output/public`.
Collega il repo GitHub a Netlify oppure trascina `.output/public` su Netlify Drop.

## Dove mettere le mani

| Cosa | File |
| --- | --- |
| Scene, battute IT/ES, parole chiave, puntate disponibili | `app/data/episodes.ts` |
| Testi dell'interfaccia IT/ES | `app/data/ui.ts` |
| Home con copertina animata e parola chiave | `app/pages/index.vue` |
| Player delle puntate (video + fumetti) | `app/pages/puntata/[n].vue` |
| Minigioco El Vuelco | `app/components/VuelcoGame.vue` |
| Servizio alla Tartana (fine puntata) | `app/components/TartanaService.vue` |
| Roster (schermata personaggi) | `app/pages/roster.vue` + `app/data/roster.ts` |
| Bonus Test Your Bite · easter egg ¡Tostada! | `app/components/BiteBonus.vue` · `TostadaEgg.vue` |
| Voz del Horno e suoni | `app/composables/useSfx.ts` + `public/media/voz/` |
| Salvataggio, lingua, verifica parola chiave | `app/composables/useGame.ts` |
| Media | `public/media/p00/` scene, musica e sfondo del minigioco · `home/` copertina · `sprites/` · `tartana/` · `voz/` |

## Aggiungere una puntata

1. Metti i file in `public/media/p01/` con lo stesso schema di nomi (`p01-s01-....mp4` e `.jpg`).
2. In `episodes.ts` compila `scenes` della puntata e metti `available: true` (o una `releaseDate`).
3. Le parole chiave sono salvate come hash SHA-256 della parola in maiuscolo senza accenti:
   `node -e "console.log(require('crypto').createHash('sha256').update('FLUJO').digest('hex'))"`

## Media per il web

I video originali sono stati ricodificati (H.264, CRF 26, senza audio, faststart): da ~16 MB a ~1,5 MB a clip.

```bash
ffmpeg -i originale.mp4 -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p -an -movflags +faststart p01-s01-nome.mp4
```

## Link diretto dal promo

`https://tuodominio.com/?clave=FLUJO` compila la parola e apre la puntata.

## Anteprima con percorsi relativi

`PREVIEW=1 npm run generate` crea una versione con routing a hash e percorsi relativi (serve solo per l'anteprima, non per Netlify).

## App installabile (PWA) e Google Analytics

- **PWA:** `@vite-pwa/nuxt` genera `manifest.webmanifest` e `sw.js`. Le icone sono in `public/icons/` (provvisorie, dal ritratto di Patato: sostituiscile con quelle definitive mantenendo i nomi). Il guscio dell'app, la grafica e le voci funzionano senza rete; ogni puntata ha il pulsante "Scarica per l'offline" che salva video e musica.
- **Analytics:** su Netlify imposta la variabile `NUXT_PUBLIC_GA_ID` (es. `G-XXXXXXXXXX`) e rifai il deploy. Senza ID non parte nulla. Lo script si carica solo dopo il consenso nel banner.
- **Eventi GA4:** `page_view`, `unlock_episode` (episode, via = keyword | link), `keyword_wrong`, `resume`, `episode_start`, `episode_complete`, `minigame_win`, `minigame_lose` (game, attempt), `offline_download`, `pwa_install_click`, `pwa_install`. Ogni evento porta anche `lang` e `standalone` (true se aperta come app installata).

## Struttura delle pagine
- `/` landing di presentazione (IT/ES) con la CTA verso il gioco. I link dei promo `/?clave=PAROLA` vanno dritti al terminale.
- `/play` terminale della parola chiave (è anche la pagina d'avvio dell'app installata).
- `/puntata/0…6`, `/roster`.

## Video leggeri
Ogni clip ha anche la versione 540p `*.lite.mp4` (circa il 60% più leggera). L'app la usa da sola con rete lenta o "risparmio dati". Per rigenerarle dopo aver cambiato una clip:
`ffmpeg -i clip.mp4 -vf scale=540:-2 -c:v libx264 -preset veryfast -crf 28 -pix_fmt yuv420p -an -movflags +faststart clip.lite.mp4`

## Pubblicare online
**Opzione A — tutto su Cloudflare Pages (consigliata):** collega il repository GitHub, comando di build `npm run generate`, cartella `.output/public`, variabile `NUXT_PUBLIC_GA_ID`. Banda illimitata gratis, file sotto i 25 MB (i nostri lo sono).

**Opzione B — Netlify + Cloudflare R2 per i video:** carica la cartella `public/media` in un bucket R2 pubblico mantenendo il percorso `media/...`, collega un sottodominio (es. `media.tuodominio.com`) e attiva il CORS (GET, origine = il dominio del sito). Su Netlify: comando `npm run generate:cdn`, variabili `NUXT_PUBLIC_GA_ID` e `NUXT_PUBLIC_MEDIA_URL=https://media.tuodominio.com`.

Esempio di regola CORS per R2:
```json
[{ "AllowedOrigins": ["https://tuodominio.com"], "AllowedMethods": ["GET", "HEAD"], "AllowedHeaders": ["Range"], "ExposeHeaders": ["Content-Range", "Content-Length"], "MaxAgeSeconds": 86400 }]
```
