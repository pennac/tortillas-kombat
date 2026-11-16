// Dati delle puntate. Le parole chiave sono salvate solo come hash SHA-256
// (maiuscole, senza accenti e spazi), così non si leggono nel codice.

export type Lang = 'it' | 'es'
export type Speaker = 'patato' | 'aceituna' | 'chema' | 'roto' | 'mystery' | 'huevo' | 'voz' | 'tv' | 'narrator' | 'flujo' | 'jamonero' | 'cebolla' | 'giudice' | 'katana'

export interface Line {
  speaker: Speaker
  it: string
  es: string
  /** audio da suonare quando compare la battuta (es. Voz del Horno) */
  audio?: string
}

export interface Choice {
  it: string
  es: string
  /** risposta di Patato dopo la scelta */
  reply: { it: string; es: string }
}

export type GameKind = 'vuelco' | 'duelo' | 'stealth' | 'rhythm' | 'hack' | 'slice' | 'catch' | 'parry' | 'boss'

export interface Scene {
  id: string
  video: string
  poster: string
  /** dove compaiono i fumetti: nello spazio vuoto lasciato nell'immagine */
  pos: 'top' | 'bottom'
  lines: Line[]
  /** minigioco da lanciare dopo le battute della scena */
  game?: GameKind
  /** sfondo del minigioco (se diverso dal poster della scena) */
  gameBackground?: string
  /** musica del minigioco di questa scena (se diversa da quella della puntata) */
  gameMusic?: string
  /** scelta di dialogo dopo le battute */
  choices?: Choice[]
}

export interface Episode {
  n: number
  title: { it: string; es: string }
  keywordHash: string
  available: boolean
  /** YYYY-MM-DD: prima di questa data la parola mostra il conto alla rovescia */
  releaseDate: string | null
  /** colonna sonora della puntata (parte al tocco d'ingresso, in loop) */
  music?: string
  /** sfondo e musica del minigioco */
  gameBackground?: string
  gameMusic?: string
  /** a fine puntata si gioca il servizio alla Tartana */
  service?: boolean
  scenes: Scene[]
}

const media = (ep: string, file: string) => ({
  video: `media/${ep}/${file}.mp4`,
  poster: `media/${ep}/${file}.jpg`
})
const m = (file: string) => media('p00', file)
const m1 = (file: string) => media('p01', file)
const m2 = (file: string) => media('p02', file)
const m3 = (file: string) => media('p03', file)
const m4 = (file: string) => media('p04', file)
const m5 = (file: string) => media('p05', file)
const m6 = (file: string) => media('p06', file)
const VOZ_AUDIO = (n: string) => `media/voz/voz-${n}.mp3`
/** finitura comica sul perdente, dopo il duello */
const fritality = (who: string, id: string): Scene => ({
  id, video: `media/fritality/fritality-${who}.mp4`, poster: `media/fritality/fritality-${who}.jpg`, pos: 'top',
  lines: [{ speaker: 'voz', it: '¡FRITALITY!', es: '¡FRITALITY!', audio: VOZ_AUDIO('fritality') }]
})

export const episodes: Episode[] = [
  {
    n: 0,
    title: { it: 'Il Casting', es: 'El Casting' },
    keywordHash: '019b3d6bc563cc4b6e4dad4ca4f8e516ee68f9c2cef26ef985255ea827aeb489', // CASTING
    available: true,
    releaseDate: null,
    music: 'media/p00/p00-musica.mp3',
    gameBackground: 'media/p00/p00-gioco-sfondo.jpg',
    gameMusic: 'media/p00/loop-vuelco.mp3',
    service: true,
    scenes: [
      {
        id: 'p0-s01', ...m('p00-s01-spot-nutripasta'), pos: 'bottom',
        lines: [
          { speaker: 'tv', it: 'Nutripasta. Non sa di niente. Come piace a te.', es: 'Nutripasta. No sabe a nada. Como a ti te gusta.' }
        ]
      },
      {
        id: 'p0-s02', ...m('p00-s02-tartana-vuota'), pos: 'top',
        lines: [
          { speaker: 'tv', it: 'Casting aperto! Premio: un anno di cibo vero!', es: '¡Casting abierto! ¡Premio: un año de comida de verdad!' },
          { speaker: 'aceituna', it: 'Un anno... di cibo... vero?', es: '¿Un año... de comida... de verdad?' }
        ]
      },
      {
        id: 'p0-s03', ...m('p00-s03-ladro-sotto-furgone'), pos: 'top',
        lines: [
          { speaker: 'aceituna', it: 'Tu! Sai cucinare?', es: '¡Tú! ¿Sabes cocinar?' },
          { speaker: 'patato', it: 'So mangiare.', es: 'Sé comer.' }
        ]
      },
      {
        id: 'p0-s04', ...m('p00-s04-il-patto'), pos: 'top',
        lines: [
          { speaker: 'aceituna', it: 'Tu cucini, io gestisco. Il premio a metà.', es: 'Tú cocinas, yo gestiono. El premio a medias.' },
          { speaker: 'aceituna', it: 'Anzi... sessanta-quaranta.', es: 'Bueno... sesenta-cuarenta.' },
          { speaker: 'patato', it: "C'è il buffet?", es: '¿Hay bufé?' }
        ]
      },
      {
        id: 'p0-s05', ...m('p00-s05-coda-casting'), pos: 'top',
        lines: [
          { speaker: 'narrator', it: 'Casting di ¡VUELCO!, stagione 12.', es: 'Casting de ¡VUELCO!, temporada 12.' },
          { speaker: 'aceituna', it: 'Firma: Patato-Pan. Perfetta.', es: 'Firma: Patato-Pan. Perfecta.' }
        ]
      },
      {
        id: 'p0-s06', ...m('p00-s06-audizione'), pos: 'top',
        lines: [
          { speaker: 'chema', it: 'Avanti il prossimo...', es: 'Siguiente...' },
          { speaker: 'patato', it: '...', es: '...' },
          { speaker: 'chema', it: '...aspetta.', es: '...espera.' }
        ],
        game: 'vuelco'
      },
      {
        id: 'p0-s07', ...m('p00-s07-esto-da-audiencia'), pos: 'top',
        lines: [
          { speaker: 'chema', it: 'Questo fa ascolti!', es: '¡Esto da audiencia!' },
          { speaker: 'patato', it: 'Dov\'è il buffet?', es: '¿Dónde está el bufé?' }
        ]
      },
      {
        id: 'p0-s08', ...m('p00-s08-mano-oro'), pos: 'bottom',
        lines: [
          { speaker: 'mystery', it: '...Patato.', es: '...Patato.' }
        ]
      }
    ]
  },
  {
    n: 1,
    title: { it: 'Prima Gala', es: 'Primera Gala' },
    keywordHash: 'fa39bd1e3bab09ca181edda8aea6c3ea81997f5cfe84b36f8e58410509b79624', // FLUJO
    available: true,
    releaseDate: null,
    music: 'media/musica/p01-sigla.mp3',
    gameMusic: 'media/p00/loop-vuelco.mp3',
    service: true,
    scenes: [
      {
        id: 'p1-s01', ...m1('p01-s01-ingresso-huevo'), pos: 'bottom',
        lines: [
          { speaker: 'huevo', it: 'Nel mio studio, chi non si frigge, si capovolge!', es: '¡En mi plató, el que no se fríe, se vuelca!' }
        ]
      },
      {
        id: 'p1-s02', ...m1('p01-s02-giuria'), pos: 'top',
        lines: [
          { speaker: 'huevo', it: 'Il nostro campione... e giudice!', es: '¡Nuestro campeón... y juez!' },
          { speaker: 'roto', it: 'Il regolamento lo consente.', es: 'El reglamento lo permite.' }
        ]
      },
      {
        id: 'p1-s03', ...m1('p01-s03-presentazione-flujo'), pos: 'top',
        lines: [
          { speaker: 'voz', it: 'Capitán Flujo. Galizia. Specialità: il crudo.', es: 'Capitán Flujo. Galicia. Especialidad: lo crudo.', audio: VOZ_AUDIO('capitan-flujo') },
          { speaker: 'voz', it: 'Patato-Pan. Specialità: ha fame.', es: 'Patato-Pan. Especialidad: tiene hambre.', audio: VOZ_AUDIO('patato-pan') }
        ]
      },
      {
        id: 'p1-s04', ...m1('p01-s04-duello-flujo'), pos: 'top',
        lines: [
          { speaker: 'flujo', it: 'Il fuoco rovina tutto!', es: '¡El fuego lo estropea todo!' }
        ],
        game: 'duelo',
        gameMusic: 'media/musica/loop-duelo.mp3'
      },
      {
        id: 'p1-s05', ...m1('p01-s05-scivolata-voti'), pos: 'top',
        lines: [
          { speaker: 'voz', it: '¡DALE LA VUELTA!', es: '¡DALE LA VUELTA!', audio: VOZ_AUDIO('dale-la-vuelta') },
          { speaker: 'roto', it: 'Tecnica: inaccettabile.', es: 'Técnica: inaceptable.' },
          { speaker: 'narrator', it: "L'Abuelo Aplauso si sveglia di colpo: dieci!", es: 'El Abuelo Aplauso se despierta de golpe: ¡diez!' }
        ]
      },
      fritality('flujo', 'p1-fritality'),
      {
        id: 'p1-s06', ...m1('p01-s06-faccia-a-faccia'), pos: 'top',
        lines: [
          { speaker: 'roto', it: 'Mangi ancora con le mani.', es: 'Sigues comiendo con las manos.' },
          { speaker: 'patato', it: 'E tu ancora non mangi.', es: 'Y tú sigues sin comer.' }
        ]
      }
    ]
  },
  {
    n: 2,
    title: { it: 'La Prova in Esterna', es: 'La Prueba Exterior' },
    keywordHash: 'e456485e23a43870da1149610a317298a3a20f1bb6c598e180fdaeba053c675e', // NUTRIPASTA
    available: true,
    releaseDate: null,
    music: 'media/musica/p02-sigla.mp3',
    gameMusic: 'media/p00/loop-vuelco.mp3',
    service: true,
    scenes: [
      {
        id: 'p2-s01', ...m2('p02-s01-clessidra'), pos: 'top',
        lines: [
          { speaker: 'huevo', it: "Un'ora. Un ingrediente autentico. Buona fortuna!", es: 'Una hora. Un ingrediente auténtico. ¡Suerte!' }
        ]
      },
      {
        id: 'p2-s02', ...m2('p02-s02-solo-nutripasta'), pos: 'top',
        lines: [
          { speaker: 'aceituna', it: 'Autentico? Qui è autentica solo la fame.', es: '¿Auténtico? Aquí lo único auténtico es el hambre.' }
        ]
      },
      {
        id: 'p2-s03', ...m2('p02-s03-mercato-nero'), pos: 'bottom',
        lines: [
          { speaker: 'narrator', it: 'Il Mercato Nero. Droni della TV e Guardia ovunque.', es: 'El Mercado Negro. Drones de la tele y Guardia por todas partes.' },
          { speaker: 'aceituna', it: 'Muoviti solo quando la luce è lontana!', es: '¡Muévete solo cuando la luz esté lejos!' }
        ],
        game: 'stealth',
        gameMusic: 'media/musica/loop-stealth.mp3'
      },
      {
        id: 'p2-s04', ...m2('p02-s04-dona-cebolla'), pos: 'top',
        lines: [
          { speaker: 'cebolla', it: "Tu sei il ragazzo dell'Accademia.", es: 'Tú eres el chico de la Academia.' },
          { speaker: 'patato', it: '...Era tanto tempo fa.', es: '...Fue hace mucho tiempo.' }
        ]
      },
      {
        id: 'p2-s05', ...m2('p02-s05-recuerdo'), pos: 'bottom',
        lines: [
          { speaker: 'patato', it: 'Era il mio fratello. Mi ha visto.', es: 'Era mi hermano. Me vio.' },
          { speaker: 'patato', it: 'Il giorno dopo ero fuori.', es: 'Al día siguiente estaba fuera.' }
        ]
      },
      {
        id: 'p2-s06', ...m2('p02-s06-nutripasta-sviene'), pos: 'top',
        lines: [
          { speaker: 'narrator', it: 'Madame Nutripasta assaggia... e sviene di piacere.', es: 'Madame Nutripasta prueba... y se desmaya de placer.' },
          { speaker: 'chema', it: 'Più quaranta per cento!', es: '¡Más cuarenta por ciento!' }
        ]
      },
      {
        id: 'p2-s07', ...m2('p02-s07-decreto'), pos: 'top',
        lines: [
          { speaker: 'huevo', it: 'Per decreto: la cipolla è un ingrediente terrorista!', es: '¡Por decreto: la cebolla es ingrediente terrorista!' }
        ]
      }
    ]
  },
  {
    n: 3,
    title: { it: 'La Gala del Ritmo', es: 'La Gala del Ritmo' },
    keywordHash: 'f29a75da17792185afad7aad0346ed5cc47d98923eb0c3d428ad9aeec05316c9', // JAMONERO
    available: true,
    releaseDate: null,
    music: 'media/musica/p03-sigla.mp3',
    gameMusic: 'media/p00/loop-vuelco.mp3',
    service: true,
    scenes: [
      {
        id: 'p3-s01', ...m3('p03-s01-jamonero'), pos: 'top',
        lines: [
          { speaker: 'voz', it: '¡El Jamonero!', es: '¡El Jamonero!', audio: VOZ_AUDIO('el-jamonero') },
          { speaker: 'jamonero', it: "L'arte non si improvvisa, ragazzo.", es: 'El arte no se improvisa, chaval.' }
        ]
      },
      {
        id: 'p3-s02', ...m3('p03-s02-duello-ritmo'), pos: 'bottom',
        lines: [
          { speaker: 'voz', it: 'Round uno. A cucinare!', es: 'Round uno. ¡A cocinar!', audio: VOZ_AUDIO('round-uno') }
        ],
        game: 'rhythm',
        gameMusic: 'media/musica/loop-ritmo.mp3'
      },
      fritality('jamonero', 'p3-fritality'),
      {
        id: 'p3-s03', ...m3('p03-s03-momento-lagrima'), pos: 'top',
        lines: [
          { speaker: 'roto', it: "L'ho denunciato per il suo bene.", es: 'Lo denuncié por su bien.' }
        ]
      },
      {
        id: 'p3-s04', ...m3('p03-s04-scelta'), pos: 'bottom',
        lines: [
          { speaker: 'chema', it: 'Patato, in diretta: cosa rispondi?', es: 'Patato, en directo: ¿qué respondes?' }
        ],
        choices: [
          { it: 'Tacere', es: 'Callar', reply: { it: '...', es: '...' } },
          { it: 'Rispondere', es: 'Responder', reply: { it: 'Il mio bene sapeva di cipolla.', es: 'Mi bien sabía a cebolla.' } },
          { it: 'Ridere', es: 'Reír', reply: { it: 'Ah. Ah. Ah. Ho fame.', es: 'Ja. Ja. Ja. Tengo hambre.' } }
        ]
      },
      {
        id: 'p3-s05', ...m3('p03-s05-botola'), pos: 'top',
        lines: [
          { speaker: 'narrator', it: "Qualcuno ha cambiato l'olio con Agua Sin Sabor...", es: 'Alguien ha cambiado el aceite por Agua Sin Sabor...' },
          { speaker: 'voz', it: '¡Concursante Patato... a la Sala de Expulsión!', es: '¡Concursante Patato... a la Sala de Expulsión!', audio: VOZ_AUDIO('sala-de-expulsion') }
        ]
      },
      {
        id: 'p3-s06', ...m3('p03-s06-televoto'), pos: 'top',
        lines: [
          { speaker: 'aceituna', it: 'Un voto per razione? Allora mangiate, gente!', es: '¿Un voto por ración? ¡Pues a comer, gente!' }
        ],
        game: 'hack',
        gameMusic: 'media/musica/loop-hacking.mp3'
      },
      {
        id: 'p3-s07', ...m3('p03-s07-ripescaggio'), pos: 'top',
        lines: [
          { speaker: 'narrator', it: 'Ripescato dal televoto del popolo!', es: '¡Repescado por el televoto del pueblo!' },
          { speaker: 'jamonero', it: 'Nella mia terra l\'arte non si sabota!', es: '¡En mi tierra el arte no se sabotea!' }
        ]
      }
    ]
  },
  {
    n: 4,
    title: { it: 'Semifinale', es: 'Semifinal' },
    keywordHash: '523c9e51931e51306f0fa93c9545d6f51bc9cd56b749a6c63627e34b037fe029', // CARXOFA
    available: true,
    releaseDate: null,
    music: 'media/musica/p04-sigla.mp3',
    gameMusic: 'media/p00/loop-vuelco.mp3',
    service: true,
    scenes: [
      {
        id: 'p4-s01', ...m4('p04-s01-presentazione-katana'), pos: 'top',
        lines: [
          { speaker: 'voz', it: 'Katana Carxofa. Catalogna. Specialità: il momento giusto.', es: 'Katana Carxofa. Cataluña. Especialidad: el momento justo.', audio: VOZ_AUDIO('katana-carxofa') }
        ]
      },
      {
        id: 'p4-s02', ...m4('p04-s02-pavimento-ruota'), pos: 'top',
        lines: [
          { speaker: 'huevo', it: 'Un piccolo cambio di copione!', es: '¡Un pequeño giro de guion!' }
        ]
      },
      {
        id: 'p4-s03', ...m4('p04-s03-duello-petali'), pos: 'top',
        lines: [
          { speaker: 'voz', it: 'Round uno. A cucinare!', es: 'Round uno. ¡A cocinar!', audio: VOZ_AUDIO('round-uno') }
        ],
        game: 'slice',
        gameMusic: 'media/musica/loop-taglio.mp3'
      },
      fritality('carxofa', 'p4-fritality'),
      {
        id: 'p4-s04', ...m4('p04-s04-llanto'), pos: 'top',
        lines: [
          { speaker: 'narrator', it: 'Il cartello LLANTO si accende da solo.', es: 'El cartel LLANTO se enciende solo.' },
          { speaker: 'aceituna', it: 'Non sono io... è la cipolla.', es: 'No soy yo... es la cebolla.' }
        ]
      },
      {
        id: 'p4-s05', ...m4('p04-s05-maschera'), pos: 'top',
        lines: [
          { speaker: 'katana', it: 'Anche il mio clan è vietato. Vinci per noi.', es: 'Mi clan también está prohibido. Gana por nosotros.' }
        ]
      },
      {
        id: 'p4-s06', ...m4('p04-s06-avanzo'), pos: 'top',
        lines: [
          { speaker: 'narrator', it: 'Backstage. Roto, da solo.', es: 'Backstage. Roto, a solas.' }
        ]
      }
    ]
  },
  {
    n: 5,
    title: { it: 'La Gran Finale', es: 'La Gran Final' },
    keywordHash: '8be5b8a6221bda5a5391c2e256a861e2aa517ce916f849e763bb21ef7f72c074', // SARTENIBUR
    available: true,
    releaseDate: null,
    music: 'media/musica/p05-sigla.mp3',
    gameMusic: 'media/p00/loop-vuelco.mp3',
    scenes: [
      {
        id: 'p5-s01', ...m5('p05-s01-roto-vs-patato'), pos: 'top',
        lines: [
          { speaker: 'voz', it: 'Gran Final!', es: '¡Gran Final!', audio: VOZ_AUDIO('gran-final') },
          { speaker: 'huevo', it: 'Finale speciale: solo Nutripasta!', es: 'Final especial: ¡solo Nutripasta!' }
        ]
      },
      {
        id: 'p5-s02', ...m5('p05-s02-ofrenda'), pos: 'top',
        lines: [
          { speaker: 'narrator', it: 'Il pubblico ignora i cartelli...', es: 'El público ignora los carteles...' },
          { speaker: 'aceituna', it: 'Prendili, maestro!', es: '¡Cógelos, maestro!' }
        ],
        game: 'catch',
        gameMusic: 'media/musica/loop-boss.mp3'
      },
      {
        id: 'p5-s03', ...m5('p05-s03-duello-roto'), pos: 'top',
        lines: [
          { speaker: 'roto', it: 'Non era la politica. Era il tuo dono.', es: 'No era la política. Era tu don.' },
          { speaker: 'roto', it: 'Io misuravo; tu sapevi.', es: 'Yo medía; tú sabías.' }
        ],
        game: 'parry',
        gameMusic: 'media/musica/loop-boss.mp3'
      },
      fritality('roto', 'p5-fritality-roto'),
      {
        id: 'p5-s04', ...m5('p05-s04-i-piatti'), pos: 'top',
        lines: [
          { speaker: 'patato', it: 'Assaggia, fratello. Sa di quando eravamo ragazzi.', es: 'Prueba, hermano. Sabe a cuando éramos críos.' }
        ]
      },
      {
        id: 'p5-s05', ...m5('p05-s05-voto-roto'), pos: 'bottom',
        lines: [
          { speaker: 'narrator', it: 'Roto piange in diretta. E vota Patato.', es: 'Roto llora en directo. Y vota a Patato.' },
          { speaker: 'voz', it: '¡DALE LA VUELTA!', es: '¡DALE LA VUELTA!', audio: VOZ_AUDIO('dale-la-vuelta') }
        ]
      },
      {
        id: 'p5-s06', ...m5('p05-s06-huevo-tron-attacca'), pos: 'top',
        lines: [
          { speaker: 'huevo', it: 'Giro de Guion finale!', es: '¡Giro de guion final!' }
        ]
      },
      {
        id: 'p5-s07', ...m5('p05-s07-huevo-tron'), pos: 'bottom',
        lines: [
          { speaker: 'aceituna', it: 'Parcheggio in doppia fila!', es: '¡Aparco en doble fila!' }
        ],
        game: 'boss',
        gameMusic: 'media/musica/loop-boss.mp3'
      },
      {
        id: 'p5-s08', ...m5('p05-s08-regia'), pos: 'bottom',
        lines: [
          { speaker: 'narrator', it: 'Chema manda in onda il backstage vero.', es: 'Chema emite el backstage de verdad.' },
          { speaker: 'chema', it: 'Questa sì che fa ascolti.', es: 'Esto sí que da audiencia.' }
        ]
      },
      {
        id: 'p5-s09', ...m5('p05-s09-gran-vuelco'), pos: 'bottom',
        lines: [
          { speaker: 'narrator', it: 'Il Gran Vuelco: il Huevo-Tron si capovolge!', es: 'El Gran Vuelco: ¡el Huevo-Tron se da la vuelta!' }
        ]
      },
      {
        ...fritality('huevo', 'p5-fritality-huevo'),
        lines: [
          { speaker: 'voz', it: '¡FRITALITY!', es: '¡FRITALITY!', audio: VOZ_AUDIO('fritality') },
          { speaker: 'voz', it: '¡GANADOR: PATATO-PAN!', es: '¡GANADOR: PATATO-PAN!', audio: VOZ_AUDIO('ganador') }
        ]
      }
    ]
  },
  {
    n: 6,
    title: { it: 'Epilogo · ¡Cocina Libre!', es: 'Epílogo · ¡Cocina Libre!' },
    keywordHash: '84853956d55f5573aa84dff69d5f4ddbe6449c30834da0aed582845749ccfde4', // TOSTADA
    available: true,
    releaseDate: null,
    music: 'media/musica/p06-sigla.mp3',
    scenes: [
      {
        id: 'p6-s01', ...m6('p06-s01-cocina-libre'), pos: 'bottom',
        lines: [
          { speaker: 'narrator', it: 'Il nuovo show di Chema. La coda della Tartana fa il giro della città.', es: 'El nuevo show de Chema. La cola de la Tartana da la vuelta a la ciudad.' },
          { speaker: 'aceituna', it: 'A metà. Davvero, stavolta. Quasi.', es: 'A medias. De verdad, esta vez. Casi.' }
        ]
      },
      {
        id: 'p6-s02', ...m6('p06-s02-casting-13'), pos: 'top',
        lines: [
          { speaker: 'narrator', it: 'Casting di ¡VUELCO!, stagione 13.', es: 'Casting de ¡VUELCO!, temporada 13.' },
          { speaker: 'chema', it: 'Il prossimo!', es: '¡Siguiente!' }
        ]
      }
    ]
  }
]

/** parola che si rivela a fine puntata n (porta alla n+1) */
export const nextKeyword: Record<number, string> = {
  0: 'FLUJO', 1: 'NUTRIPASTA', 2: 'JAMONERO', 3: 'CARXOFA', 4: 'SARTENIBUR', 5: 'TOSTADA'
}

export const speakerNames: Record<Speaker, { it: string; es: string }> = {
  patato: { it: 'Patato-Pan', es: 'Patato-Pan' },
  aceituna: { it: 'Aceituna', es: 'Aceituna' },
  chema: { it: 'Chema', es: 'Chema' },
  roto: { it: 'Roto', es: 'Roto' },
  mystery: { it: '???', es: '???' },
  flujo: { it: 'Capitán Flujo', es: 'Capitán Flujo' },
  jamonero: { it: 'El Jamonero', es: 'El Jamonero' },
  cebolla: { it: 'Doña Cebolla', es: 'Doña Cebolla' },
  katana: { it: 'Katana Carxofa', es: 'Katana Carxofa' },
  giudice: { it: 'Giudice', es: 'Juez' },
  huevo: { it: 'Huevo Frito', es: 'Huevo Frito' },
  voz: { it: 'La Voz del Horno', es: 'La Voz del Horno' },
  tv: { it: 'TV', es: 'TV' },
  narrator: { it: '', es: '' }
}
