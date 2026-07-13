import type { Paciente } from '../types'
import { EMPTY_PACIENTE_FORM } from '../constants/pacienteForm'

type LegacyPaciente = Partial<Paciente> & {
  padecimientos?: string
}

export function migratePaciente(raw: LegacyPaciente): Paciente {
  return {
    ...EMPTY_PACIENTE_FORM,
    ...raw,
    id: raw.id ?? '',
    fechaRegistro: raw.fechaRegistro ?? new Date().toISOString(),
    mc: raw.mc ?? raw.padecimientos ?? '',
  }
}

export function migratePacientes(pacientes: LegacyPaciente[]): Paciente[] {
  return pacientes.map(migratePaciente)
}
