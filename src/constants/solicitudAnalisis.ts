import type { Paciente, SolicitudAnalisisFormData } from '../types'

export interface SolicitudAnalisisGrupo {
  titulo: string
  columna: 1 | 2 | 3
  estudios: string[]
}

export const SOLICITUD_ANALISIS_GRUPOS: SolicitudAnalisisGrupo[] = [
  {
    titulo: 'Heces',
    columna: 1,
    estudios: [
      'Examen de heces general',
      'Sangre oculta en heces',
      'H. pylori en heces',
      'Azucares reductores',
      'Adenovirus / Rotavirus',
      'Panel gastrointestinal por PCR',
    ],
  },
  {
    titulo: 'Orina',
    columna: 1,
    estudios: [
      'General de orina',
      'Urocultivo',
      'Microalbuminuria',
      'Proteinuria 24h',
      'Aclaramiento endogeno de creatinina (AEC)',
    ],
  },
  {
    titulo: 'Otros',
    columna: 1,
    estudios: ['Espermograma'],
  },
  {
    titulo: 'Hematologia',
    columna: 1,
    estudios: [
      'Hemograma completo',
      'Hto - Hb',
      'Reticulocitos',
      'VES',
      'T. protrombina - INR',
      'T.P. tromboplastina',
      'Grupo y Rh',
      'Panel de hierro (ferritina + transferrina)',
      'Acido folico',
      'Vitamina B12',
      'Ferritina',
    ],
  },
  {
    titulo: 'Quimica sanguinea',
    columna: 1,
    estudios: [
      'Glicemia de azucar',
      'Glicemia en ayunas',
      'Hemoglobina glicosilada',
      'Perfil de lipidos',
      'Acido urico',
      'Nitrogeno ureico',
      'Creatinina',
      'Homocisteina',
      'Amilasa',
      'Lipasa',
      'DH lactica',
      'Proteinas totales y fraccionadas',
      'Albumina',
    ],
  },
  {
    titulo: 'Perfil prostatico',
    columna: 2,
    estudios: ['P.S.A total', 'P.S.A libre'],
  },
  {
    titulo: 'Funcion tiroidea',
    columna: 2,
    estudios: [
      'TSH',
      'TSH-Rab / TSI',
      'T4 libre',
      'T3 total',
      'Ac. anti microsomales - peroxidasa',
      'Ac. anti tiroglobulinas',
      'Tiroglobulinas',
    ],
  },
  {
    titulo: 'Hormonas',
    columna: 2,
    estudios: [
      'Testosterona libre',
      'Testosterona total',
      'FSH',
      'LH',
      'Estradiol',
      'Progesterona',
      'Androstenediona',
      'SHBG',
      'Prolactina',
      'P.T.H',
      'H. crecimiento',
      'ACTH',
      'Cortisol',
      'Insulina',
      'Prueba de embarazo',
      'H.C.G cuantitativa',
    ],
  },
  {
    titulo: 'Perfil hepatico y electrolitos',
    columna: 2,
    estudios: [
      'Fosfatasa alcalina',
      'AST',
      'ALT',
      'G.G.T',
      'Bilirrubina total y fraccionada',
      'Sodio',
      'Potasio',
      'Cloruro',
      'Calcio',
      'Fosforo',
      'Magnesio',
      'Gases arteriales',
    ],
  },
  {
    titulo: 'ITS',
    columna: 3,
    estudios: [
      'HIV - VIH (4ta generacion)',
      'Carga viral por HIV',
      'VDRL',
      'Herpes II IgG',
      'Herpes II IgM',
      'Anticuerpos antiChlamydia IgG',
      'Anticuerpos antiChlamydia IgM',
      'FTA (Treponema confirmatorio)',
      'Neisseria / Chlamydia por PCR',
      'Virus del papiloma humano (VPH) por PCR en ETS',
    ],
  },
]

export function createSolicitudAnalisisForm(paciente: Paciente): SolicitudAnalisisFormData {
  return {
    pacienteId: paciente.id,
    fecha: new Date().toISOString().split('T')[0],
    nombrePaciente: paciente.nombre,
    telefono: paciente.telefono,
    cedula: paciente.cedula,
    sexo: '',
    diagnostico: paciente.pa || paciente.mc,
    estudios: [],
    notas: '',
  }
}

export function gruposPorColumna() {
  return {
    1: SOLICITUD_ANALISIS_GRUPOS.filter(grupo => grupo.columna === 1),
    2: SOLICITUD_ANALISIS_GRUPOS.filter(grupo => grupo.columna === 2),
    3: SOLICITUD_ANALISIS_GRUPOS.filter(grupo => grupo.columna === 3),
  }
}
