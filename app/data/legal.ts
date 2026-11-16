// Note legali, privacy e cookie (IT/ES). Titolare: Paolo Pennacchio.
export const OWNER = { name: 'Paolo Pennacchio', email: 'paolo@pennac.me' }
export const LEGAL_UPDATED = '16/11/2026'

interface Section { title: string; body: string[] }
interface CookieRow { name: string; who: string; purpose: string; duration: string }
interface LegalText {
  pageTitle: string
  updated: string
  sections: Section[]
  cookiesTitle: string
  cookiesIntro: string
  cookieHead: [string, string, string, string]
  cookies: CookieRow[]
  manageTitle: string
  manageText: string
  manageBtn: string
  back: string
}

export const legal: Record<'it' | 'es', LegalText> = {
  es: {
    pageTitle: 'Aviso legal, privacidad y cookies',
    updated: 'Última actualización',
    sections: [
      {
        title: 'Aviso legal',
        body: [
          `Titular del sitio: ${OWNER.name}. Contacto: ${OWNER.email}.`,
          'Tortillas Kombat · ¡VUELCO! El Show es un juego narrativo de entretenimiento, gratuito y sin registro. Es una obra de ficción y de sátira: personajes, marcas (Nutripasta, Agua Sin Sabor, Huevo-Fon…) y lugares son inventados.',
          `Textos, imágenes, vídeos, música y código son de ${OWNER.name}, salvo indicación en contrario; parte de las imágenes, los vídeos y el audio se ha creado con herramientas de inteligencia artificial. No se permite su reproducción con fines comerciales sin autorización.`
        ]
      },
      {
        title: 'Privacidad',
        body: [
          `Responsable del tratamiento: ${OWNER.name} (${OWNER.email}).`,
          'No pedimos registro ni datos personales. Tu progreso (galas desbloqueadas, idioma, pesetas, sonido) se guarda solo en tu dispositivo, en el almacenamiento local del navegador, y no nos llega.',
          'Analítica: solo si la aceptas en el aviso de cookies, usamos Google Analytics 4 (Google Ireland Ltd.) para contar visitas y saber qué galas y minijuegos se juegan. Los datos son estadísticos, con la IP anonimizada, y Google puede tratarlos también fuera de la UE con las garantías del Marco de Privacidad de Datos UE-EE. UU. Base legal: tu consentimiento, que puedes retirar cuando quieras más abajo.',
          'Alojamiento: el sitio se sirve desde Cloudflare, que registra datos técnicos de conexión (como la IP) por seguridad y funcionamiento. Base legal: interés legítimo en ofrecer un servicio seguro.',
          'Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ' + OWNER.email + '. Si crees que no se respetan, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es) o, en Italia, ante el Garante per la protezione dei dati personali (garanteprivacy.it).'
        ]
      }
    ],
    cookiesTitle: 'Cookies y almacenamiento',
    cookiesIntro: 'Usamos solo lo necesario para que el juego funcione y, si lo aceptas, la analítica:',
    cookieHead: ['Nombre', 'De quién', 'Para qué', 'Duración'],
    cookies: [
      { name: 'tk_vuelco_v1', who: 'Este sitio (almacenamiento local)', purpose: 'Técnica: guarda progreso, idioma, sonido y tu elección sobre cookies', duration: 'Hasta que la borres' },
      { name: 'tk_lite', who: 'Este sitio (almacenamiento local)', purpose: 'Técnica: recuerda si usar vídeos ligeros con conexión lenta', duration: 'Hasta que la borres' },
      { name: 'Caché de la app', who: 'Este sitio (service worker)', purpose: 'Técnica: permite abrir la app y ver las galas descargadas sin conexión', duration: 'Hasta que la borres' },
      { name: '_ga, _ga_*', who: 'Google Analytics', purpose: 'Analítica: distingue visitantes de forma anónima. Solo con tu consentimiento', duration: '2 años' }
    ],
    manageTitle: 'Gestionar tu consentimiento',
    manageText: 'Puedes cambiar tu elección cuando quieras: el aviso de cookies volverá a aparecer.',
    manageBtn: 'Cambiar preferencias de cookies',
    back: 'Volver'
  },
  it: {
    pageTitle: 'Note legali, privacy e cookie',
    updated: 'Ultimo aggiornamento',
    sections: [
      {
        title: 'Note legali',
        body: [
          `Titolare del sito: ${OWNER.name}. Contatto: ${OWNER.email}.`,
          'Tortillas Kombat · ¡VUELCO! El Show è un gioco narrativo di intrattenimento, gratuito e senza registrazione. È un\'opera di finzione e di satira: personaggi, marchi (Nutripasta, Agua Sin Sabor, Huevo-Fon…) e luoghi sono inventati.',
          `Testi, immagini, video, musica e codice sono di ${OWNER.name}, salvo diversa indicazione; parte delle immagini, dei video e dell'audio è stata creata con strumenti di intelligenza artificiale. Non ne è consentita la riproduzione a fini commerciali senza autorizzazione.`
        ]
      },
      {
        title: 'Privacy',
        body: [
          `Titolare del trattamento: ${OWNER.name} (${OWNER.email}).`,
          'Non chiediamo registrazione né dati personali. I tuoi progressi (puntate sbloccate, lingua, pesetas, audio) restano solo sul tuo dispositivo, nella memoria locale del browser, e non ci arrivano.',
          'Analisi: solo se la accetti nell\'avviso cookie, usiamo Google Analytics 4 (Google Ireland Ltd.) per contare le visite e capire quali puntate e minigiochi vengono giocati. I dati sono statistici, con IP anonimizzato, e Google può trattarli anche fuori dall\'UE con le garanzie del Data Privacy Framework UE-USA. Base giuridica: il tuo consenso, che puoi revocare quando vuoi qui sotto.',
          'Hosting: il sito è servito da Cloudflare, che registra dati tecnici di connessione (come l\'IP) per sicurezza e funzionamento. Base giuridica: legittimo interesse a offrire un servizio sicuro.',
          'Puoi esercitare i diritti di accesso, rettifica, cancellazione, opposizione, limitazione e portabilità scrivendo a ' + OWNER.email + '. Se ritieni che non siano rispettati, puoi rivolgerti al Garante per la protezione dei dati personali (garanteprivacy.it) o, in Spagna, all\'Agencia Española de Protección de Datos (aepd.es).'
        ]
      }
    ],
    cookiesTitle: 'Cookie e memoria locale',
    cookiesIntro: 'Usiamo solo quello che serve al gioco e, se la accetti, l\'analisi:',
    cookieHead: ['Nome', 'Di chi', 'A cosa serve', 'Durata'],
    cookies: [
      { name: 'tk_vuelco_v1', who: 'Questo sito (memoria locale)', purpose: 'Tecnico: salva progressi, lingua, audio e la tua scelta sui cookie', duration: 'Finché non lo cancelli' },
      { name: 'tk_lite', who: 'Questo sito (memoria locale)', purpose: 'Tecnico: ricorda se usare i video leggeri con rete lenta', duration: 'Finché non lo cancelli' },
      { name: 'Cache dell\'app', who: 'Questo sito (service worker)', purpose: 'Tecnico: permette di aprire l\'app e vedere le puntate scaricate senza rete', duration: 'Finché non la cancelli' },
      { name: '_ga, _ga_*', who: 'Google Analytics', purpose: 'Analisi: distingue i visitatori in forma anonima. Solo con il tuo consenso', duration: '2 anni' }
    ],
    manageTitle: 'Gestisci il consenso',
    manageText: 'Puoi cambiare scelta quando vuoi: l\'avviso cookie ricomparirà.',
    manageBtn: 'Cambia preferenze cookie',
    back: 'Indietro'
  }
}
