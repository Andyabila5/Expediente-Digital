export interface CategoriaLab {
  titulo: string
  examenes: string[]
}

export interface ColumnaLab {
  categorias: CategoriaLab[]
}

// Las tres columnas exactas del formulario Nova Uroclínica
export const COLUMNAS_SOLICITUD: ColumnaLab[] = [
  // ── Columna 1 ───────────────────────────────────────────────────────────
  {
    categorias: [
      {
        titulo: 'HECES',
        examenes: [
          'Examen de heces general',
          'Sangre oculta en heces',
          'H. pylori en heces',
          'Azúcares reductores',
          'Adenovirus / Rotavirus',
          'Panel gastrointestinal por PCR',
        ],
      },
      {
        titulo: 'ORINA',
        examenes: [
          'General',
          'Urocultivo',
          'Microalbuminuria',
          'Proteinuria 24h',
          'Aclaramiento endógeno de creatinina AEC',
        ],
      },
      {
        titulo: 'OTROS',
        examenes: ['Espermograma'],
      },
      {
        titulo: 'HEMATOLOGÍA',
        examenes: [
          'Hemograma completo',
          'Hto - Hb',
          'VES',
          'Reticulocitos',
          'T. Protombina - INR',
          'T.P Tromboplastina',
          'Grupo y Rh',
          'Panel de hierro (ferritina + transferrina)',
          'Ácido Fólico',
          'Vitamina B12',
          'Ferritina',
        ],
      },
      {
        titulo: 'QUÍMICA SANGUÍNEA',
        examenes: [
          'Glicemia de azar',
          'Glicemia en ayunas',
          'Hemoglobina glicosilada',
          'Perfil de lípidos',
          'Ácido úrico',
          'Nitrógeno ureico',
          'Creatinina',
          'Homocisteína',
          'Amilasa',
          'Lipasa',
          'DH láctica',
          'Proteínas totales y fraccionadas',
          'Albúmina',
        ],
      },
    ],
  },

  // ── Columna 2 ───────────────────────────────────────────────────────────
  {
    categorias: [
      {
        titulo: 'PERFIL PROSTÁTICO',
        examenes: ['P.S.A total', 'P.S.A Libre'],
      },
      {
        titulo: 'FUNCIÓN TIROIDEA',
        examenes: [
          'TSH',
          'TSH-Rab/TSI',
          'T4 libre',
          'T3 total',
          'Ac. Anti microsomales - Peroxidasa',
          'Ac. Anti Tiroglobulinas',
          'Tiroglobulinas',
        ],
      },
      {
        titulo: 'HORMONAS',
        examenes: [
          'Testosterona libre',
          'Testosterona total',
          'FSH',
          'LH',
          'Estradiol',
          'Progesterona',
          'Androstenendiona',
          'SHBG',
          'Prolactina',
          'P.T.H',
          'H. Crecimiento',
          'ACTH',
          'Cortisol',
          'Insulina',
          'Prueba de embarazo',
          'H.C.G Cuantitativa',
        ],
      },
      {
        titulo: '',
        examenes: [
          'Fosfatasa alcalina',
          'AST',
          'ALT',
          'G.G.T',
          'Bilirrubina T. y F.',
          'Sodio',
          'Potasio',
          'Cloruro',
          'Calcio',
          'Fósforo',
          'Magnesio',
          'Gases arteriales',
        ],
      },
    ],
  },

  // ── Columna 3 ───────────────────────────────────────────────────────────
  {
    categorias: [
      {
        titulo: 'ITS',
        examenes: [
          'HIV - VIH (4ta generación)',
          'Carga viral por HIV',
          'VDRL',
          'Neisseria / Chlamydia por PCR',
          'Virus de Papiloma Humano (VPH) por PCR en ETS',
        ],
      },
    ],
  },
]

// Lista plana de todos los exámenes para el estado del formulario
export const TODOS_LOS_EXAMENES: string[] = COLUMNAS_SOLICITUD.flatMap(col =>
  col.categorias.flatMap(cat => cat.examenes),
)
