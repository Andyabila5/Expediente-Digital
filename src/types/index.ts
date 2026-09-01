export interface Paciente {
  id: string
  nombre: string
  cedula: string
  fechaNacimiento: string
  telefono: string
  correo: string
  datosDemograficos: string
  ahf: string
  app: string
  apnp: string
  aqxt: string
  mc: string
  pa: string
  aua: string
  hematuria: string
  rao: string
  disuria: string
  efTr: string
  efTestis: string
  efPene: string
  labPsa: string
  labEgo: string
  labPfr: string
  plan: string
  fechaRegistro: string
}

export interface ResultadoPrueba {
  id: string
  pacienteId: string
  nombrePrueba: string
  fecha: string
  resultado: string
  notas: string
  archivo: ArchivoAdjunto | null
}

export interface ResultadoLaboratorio {
  id: string
  pacienteId: string
  nombreAnalisis: string
  fecha: string
  valores: string
  notas: string
  archivo: ArchivoAdjunto | null
}

export type EstadoCita = 'programada' | 'confirmada' | 'completada' | 'cancelada'

export interface Cita {
  id: string
  pacienteId: string
  fechaHora: string
  motivo: string
  notas: string
  estado: EstadoCita
  recordatorioWhatsApp: boolean
}

export interface ExpedienteData {
  pacientes: Paciente[]
  resultadosPruebas: ResultadoPrueba[]
  resultadosLaboratorio: ResultadoLaboratorio[]
  citas: Cita[]
}

export interface ArchivoAdjunto {
  nombre: string
  mimeType: string
  tamano: number
  url: string
}

export type PacienteFormData = Omit<Paciente, 'id' | 'fechaRegistro'>

export type ResultadoPruebaFormData = Omit<ResultadoPrueba, 'id' | 'archivo'>

export type ResultadoLaboratorioFormData = Omit<ResultadoLaboratorio, 'id' | 'archivo'>

export type CitaFormData = Omit<Cita, 'id'>

export interface CampoExpediente {
  name: keyof PacienteFormData
  label: string
  type?: 'text' | 'email' | 'tel' | 'date' | 'textarea'
  placeholder?: string
  rows?: number
  fullWidth?: boolean
}

export interface SeccionExpediente {
  titulo: string
  campos: CampoExpediente[]
}
