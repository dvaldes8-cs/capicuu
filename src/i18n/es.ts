export const es = {
  appName: 'Capicuu',
  tagline: 'El marcador de dominó',
  secondaryTagline: 'Menos papel. Más dominó.',

  nav: {
    scoreboard: 'Marcador',
    newGame: 'Nueva',
    history: 'Historial',
    settings: 'Ajustes',
    install: 'Añadir',
    installed: 'Instalada',
    day: 'Día',
    night: 'Noche',
  },

  install: {
    howTitle: 'Añadir a tu teléfono',
    installedTitle: 'App instalada',
    alreadyInstalled: 'Capicuu ya está instalada en este dispositivo.',
    intro:
      'Guarda Capicuu en la pantalla de inicio, como una app. Elige tu teléfono:',
    bannerTitle: 'Añadir a tu teléfono',
    bannerBody: 'Acceso rápido, funciona sin internet.',
    bannerCta: 'Cómo hacerlo',
    copyLink: 'Copiar enlace',
    linkCopied: 'Enlace copiado',
    shareLink: 'Compartir',
    shareText: 'Capicuu — el marcador de dominó. Menos papel. Más dominó.',
    thisDevice: 'Tu teléfono',
    iphoneTitle: 'iPhone / iPad',
    iphoneStep1: 'Abre Capicuu en Safari (no en Chrome ni Instagram).',
    iphoneStep2: 'Toca el botón Compartir (cuadrado con flecha hacia arriba).',
    iphoneStep3: 'Elige “Añadir a pantalla de inicio” y confirma.',
    iosShareHint: 'El botón Compartir está en la barra de Safari.',
    androidTitle: 'Android',
    androidStep1: 'Abre Capicuu en Chrome.',
    androidStep2: 'Toca el menú ⋮ (tres puntos) arriba a la derecha.',
    androidStep3: 'Elige “Instalar app” o “Añadir a pantalla de inicio”.',
    installNow: 'Instalar ahora',
    iosSteps:
      'En iPhone o iPad: toca Compartir en Safari y luego “Añadir a pantalla de inicio”.',
    manualSteps:
      'Abre el menú del navegador y elige “Instalar app” o “Añadir a la pantalla de inicio”.',
  },

  scoreboard: {
    matchTo: 'Partida a {score}',
    editTarget: 'Cambiar meta',
    editTargetTitle: 'Cambiar partida a…',
    editTargetConfirm:
      '¿Seguro que quieres cambiar la meta de {from} a {to}? La revancha seguirá usando {initial}.',
    editTargetSave: 'Sí, cambiar meta',
    toWin: '{n} para ganar',
    won: '¡Ganó!',
    leading: 'Van ganando',
    swapTeams: 'Intercambiar lados',
    undo: 'Deshacer',
    history: 'Manos',
    noHands: 'Aún no hay manos. Anota los puntos después de cada mano.',
    selectAmount: 'Puntos',
    tapTeam: 'Elige el equipo',
    selectTeamFirst: 'Elige un equipo',
    selected: 'Seleccionado',
    award: 'Añadir puntos',
    awardTotal: 'Añadir {n} puntos',
    recorded: 'Puntos añadidos',
    recordedTotal: 'Añadidos +{n}',
    bonusIncluded: '+{n} {type} se suman',
    quickAddIncluded: '+{n} se suman',
    totalPreview: 'Total {n}',
    quickAdd: 'Rápido',
    handType: 'Tipo de mano',
    scan: 'Escanear fichas',
  },

  scan: {
    title: 'Contar fichas',
    hint: 'Fotografía las fichas. Capicuu estima los puntos (no es exacto); revisa y corrige antes de anotar.',
    capture: 'Tomar foto',
    choosePhoto: 'Elegir foto',
    flipCamera: 'Cambiar cámara',
    cameraPreview: 'Vista de la cámara',
    cameraDenied: 'No se pudo usar la cámara. Puedes subir una foto.',
    cameraUnsupported: 'Este dispositivo no permite cámara en el navegador.',
    uploadInstead: 'Usa “Elegir foto” para continuar.',
    analyzing: 'Contando puntos…',
    analyzeFailed: 'No se pudo analizar la imagen. Intenta de nuevo.',
    previewAlt: 'Fichas detectadas',
    detected: 'Detectados: {n} puntos',
    confidenceHigh: 'Buena lectura — revisa y confirma.',
    confidenceMed: 'Lectura aproximada — ajústala si hace falta.',
    confidenceLow: 'Poca certeza — verifica el total a mano.',
    adjust: 'Total a anotar',
    usePoints: 'Usar estos puntos',
    pointsReady: 'Puntos listos — elige equipo y añade',
    retake: 'Otra foto',
  },

  keypad: {
    clear: 'Borrar',
    backspace: 'Retroceder',
  },

  newGame: {
    title: 'Nueva partida',
    team1: 'Equipo 1',
    team2: 'Equipo 2',
    target: 'Meta',
    customTarget: 'Personalizada',
    preset: 'Variante',
    presets: {
      puertorriqueno: 'Dominó Puertorriqueño',
      dominicano: 'Dominó Dominicano',
      personalizado: 'Personalizado',
    },
    start: 'Empezar',
    cancel: 'Cancelar',
    activeWarning:
      'Hay una partida en curso. Se guardará en el historial antes de empezar otra.',
    continueActive: 'Continuar partida actual',
  },

  hands: {
    title: 'Historial de manos',
    hand: 'Mano {n}',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    points: 'Puntos',
    team: 'Equipo',
    empty: 'Sin manos registradas',
    types: {
      normal: 'Normal',
      dominada: 'Dominada',
      capicu: 'Capicú',
      tranque: 'Tranque',
      chuchazo: 'Chuchazo',
      vuelta_redonda: 'Vuelta redonda',
      pase: 'Pase',
      personalizado: 'Personalizado',
    },
  },

  winner: {
    title: '¡CAPICUU!',
    won: '¡Ganó {team}!',
    rematch: 'Revancha',
    viewResults: 'Ver resultados',
    newGame: 'Nueva partida',
    support: 'Invítame un café',
    muteMusic: 'Silenciar música',
    mutedSaved: 'Música desactivada para próximas victorias',
  },

  history: {
    title: 'Historial de partidas',
    empty: 'Todavía no hay partidas guardadas.',
    completed: 'Partida completada',
    active: 'En curso',
    abandoned: 'Abandonada',
    hands: '{n} manos',
    resume: 'Continuar',
    rematch: 'Revancha',
    delete: 'Eliminar',
    deleteConfirm: '¿Eliminar esta partida?',
    winner: 'Ganó {team}',
  },

  settings: {
    title: 'Ajustes',
    language: 'Idioma',
    languages: { es: 'Español', en: 'English' },
    theme: 'Tema',
    themes: { light: 'Claro', dark: 'Oscuro', system: 'Sistema' },
    defaultTarget: 'Meta predeterminada',
    defaultPreset: 'Variante predeterminada',
    specialRules: 'Bonificaciones especiales',
    specialRulesHint:
      'Al activarlas se cargan puntos de ejemplo. Cámbialos a tu estilo; al elegir la jugada en el marcador se suman.',
    specialRulesNumbers: 'Puntos de bonificación',
    specialRulesNoGame:
      'Empieza una partida para configurar Dominada, Capicú y el resto.',
    victorySound: 'Música al ganar',
    victorySoundHint: 'Jingle corto original al estilo caribeño (no es una canción con copyright).',
    confirmReset: 'Confirmar al reiniciar',
    about: 'Acerca de',
    aboutBody:
      'Capicuu es un marcador digital gratis para dominó puertorriqueño y dominicano. Juegas con fichas reales; Capicuu solo lleva los puntos.',
    version: 'Versión {v}',
    resetData: 'Borrar todos los datos',
    resetConfirm:
      'Esto elimina todas las partidas y ajustes. ¿Continuar?',
  },

  support: {
    title: '¿Te gusta Capicuu?',
    body: 'Capicuu es gratis. Si te ha sido útil, puedes apoyarlo invitándome un café. ☕',
    button: 'Invítame un café',
  },

  errors: {
    empty: 'Ingresa los puntos',
    invalid: 'Número no válido',
    negative: 'Los puntos no pueden ser negativos',
    too_large: 'Número demasiado alto',
    storage_full: 'Almacenamiento lleno. Elimina partidas antiguas.',
    storage_error: 'No se pudo guardar. Intenta de nuevo.',
    team_not_found: 'Equipo no encontrado',
    hand_not_found: 'Mano no encontrada',
  },

  common: {
    close: 'Cerrar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    back: 'Volver',
    yes: 'Sí',
    no: 'No',
  },
};

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type Dictionary = DeepStringify<typeof es>;
