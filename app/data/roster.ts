// Roster della schermata di selezione: ritratto, loop, statistiche, battuta
export interface Fighter {
  id: string
  name: string
  epithet: { it: string; es: string }
  color: string
  /** Fuerza, Velocidad, Técnica, Sabor (0–10) */
  stats: [number, number, number, number]
  /** puntata in cui si sblocca (si sblocca appena si entra in quella puntata) */
  unlockEp: number
  line: { it: string; es: string }
  /** voce della Voz del Horno con il nome, se c'è */
  voz?: string
  /** puntata in cui subisce la Fritality: si rivede nel roster quando quella puntata è finita */
  fritality?: number
}

export const roster: Fighter[] = [
  { id: 'patato', name: 'Patato-Pan', color: '#c46a2b', stats: [7, 4, 6, 10], unlockEp: 0, voz: 'media/voz/voz-patato-pan.mp3',
    epithet: { it: 'Il ronin del tubero', es: 'El ronin del tubérculo' },
    line: { it: 'Ho fame.', es: 'Tengo hambre.' } },
  { id: 'aceituna', name: 'Aceituna', color: '#8a9a3b', stats: [3, 9, 7, 6], unlockEp: 0, voz: 'media/voz/voz-aceituna.mp3',
    epithet: { it: 'La manager della Tartana', es: 'La mánager de la Tartana' },
    line: { it: 'A metà. Anzi... sessanta-quaranta.', es: 'A medias. Bueno... sesenta-cuarenta.' } },
  { id: 'chema', name: 'Chema', color: '#6d7b88', stats: [1, 8, 5, 2], unlockEp: 0, voz: 'media/voz/voz-chema.mp3',
    epithet: { it: 'Il regista ossessionato dallo share', es: 'El realizador obsesionado con la audiencia' },
    line: { it: 'Questo fa ascolti!', es: '¡Esto da audiencia!' } },
  { id: 'guardia', name: 'Guardia del Tuorlo', color: '#2f6fd6', stats: [7, 3, 2, 0], unlockEp: 0, voz: 'media/voz/voz-guardia-del-tuorlo.mp3',
    epithet: { it: 'Soldato semplice del regime', es: 'Soldado raso del régimen' },
    line: { it: 'Germinazione illegale rilevata!', es: '¡Germinación ilegal detectada!' } },
  { id: 'roto', name: 'Roto', color: '#c9a227', stats: [8, 6, 10, 1], unlockEp: 1, voz: 'media/voz/voz-roto.mp3', fritality: 5,
    epithet: { it: 'Il campione-giudice', es: 'El campeón-juez' },
    line: { it: 'Tecnica: inaccettabile.', es: 'Técnica: inaceptable.' } },
  { id: 'huevo', name: 'Señor Huevo Frito', color: '#8e1b1b', stats: [2, 2, 3, 0], unlockEp: 1, voz: 'media/voz/voz-huevo-frito.mp3', fritality: 5,
    epithet: { it: 'Il conduttore-dittatore', es: 'El presentador-dictador' },
    line: { it: 'Nel mio studio, chi non si frigge, si capovolge!', es: '¡En mi plató, el que no se fríe, se vuelca!' } },
  { id: 'nutripasta', name: 'Madame Nutripasta', color: '#8f8f8f', stats: [1, 1, 2, 0], unlockEp: 1, voz: 'media/voz/voz-madame-nutripasta.mp3',
    epithet: { it: 'Lo sponsor in giuria', es: 'La patrocinadora en el jurado' },
    line: { it: 'Sa di qualcosa. Bocciato.', es: 'Sabe a algo. Suspendido.' } },
  { id: 'abuelo', name: 'El Abuelo Aplauso', color: '#7a3b46', stats: [1, 1, 1, 9], unlockEp: 1, voz: 'media/voz/voz-abuelo-aplauso.mp3',
    epithet: { it: 'Il giudice che dorme', es: 'El juez que duerme' },
    line: { it: 'Zzz... dieci!', es: 'Zzz... ¡diez!' } },
  { id: 'flujo', name: 'Capitán Flujo', color: '#1f5f8b', stats: [5, 7, 6, 5], unlockEp: 1, voz: 'media/voz/voz-capitan-flujo.mp3', fritality: 1,
    epithet: { it: 'Galizia · specialità: il crudo', es: 'Galicia · especialidad: lo crudo' },
    line: { it: 'Il fuoco rovina tutto!', es: '¡El fuego lo estropea todo!' } },
  { id: 'cebolla', name: 'Doña Cebolla', color: '#6b2d6e', stats: [1, 2, 8, 10], unlockEp: 2, voz: 'media/voz/voz-dona-cebolla.mp3',
    epithet: { it: 'La venditrice del Mercato Nero', es: 'La vendedora del Mercado Negro' },
    line: { it: "Tu sei il ragazzo dell'Accademia.", es: 'Tú eres el chico de la Academia.' } },
  { id: 'jamonero', name: 'El Jamonero', color: '#b3202a', stats: [6, 6, 8, 8], unlockEp: 3, voz: 'media/voz/voz-el-jamonero.mp3', fritality: 3,
    epithet: { it: 'Andalusia · specialità: lo show', es: 'Andalucía · especialidad: el espectáculo' },
    line: { it: "L'arte non si improvvisa, ragazzo.", es: 'El arte no se improvisa, chaval.' } },
  { id: 'carxofa', name: 'Katana Carxofa', color: '#2f4a2a', stats: [6, 10, 9, 7], unlockEp: 4, voz: 'media/voz/voz-katana-carxofa.mp3', fritality: 4,
    epithet: { it: 'Catalogna · specialità: il momento giusto', es: 'Cataluña · especialidad: el momento justo' },
    line: { it: '...', es: '...' } }
]
