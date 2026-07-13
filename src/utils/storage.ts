import type { ExpedienteData } from '../types'
import { migratePacientes } from './migration'

const STORAGE_KEY = 'expediente-digital-data'

const defaultData: ExpedienteData = {
  pacientes: [],
  resultadosPruebas: [],
  resultadosLaboratorio: [],
  citas: [],
}

export function loadData(): ExpedienteData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultData

    const parsed = JSON.parse(stored) as ExpedienteData
    return {
      ...parsed,
      pacientes: migratePacientes(parsed.pacientes ?? []),
      resultadosPruebas: parsed.resultadosPruebas ?? [],
      resultadosLaboratorio: parsed.resultadosLaboratorio ?? [],
      citas: parsed.citas ?? [],
    }
  } catch {
    return defaultData
  }
}

export function saveData(data: ExpedienteData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function formatFecha(fecha: string): string {
  if (!fecha) return '—'
  const isoMatch = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${Number(day)}/${Number(month)}/${year}`
  }
  return fecha
}
