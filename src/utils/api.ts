export const API_BASE_URL = import.meta.env.VITE_API_URL || ''
import type {
  Cita,
  CitaFormData,
  ExpedienteData,
  Paciente,
  PacienteFormData,
  ResultadoLaboratorio,
  ResultadoLaboratorioFormData,
  ResultadoPrueba,
  ResultadoPruebaFormData,
} from '../types'

async function parseJson(response: Response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, init)
  const data = await parseJson(response)

  if (!response.ok) {
    throw new Error(
      (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : 'No fue posible completar la solicitud.') as string,
    )
  }

  return data as T
}

function buildResultadoFormData(
  data: ResultadoPruebaFormData | ResultadoLaboratorioFormData,
  archivo?: File | null,
) {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value ?? '')
  })

  if (archivo) {
    formData.append('archivo', archivo)
  }

  return formData
}

export function fetchExpedienteData(): Promise<ExpedienteData> {
  return apiRequest<ExpedienteData>('/api/expediente')
}

export function createPaciente(data: PacienteFormData): Promise<Paciente> {
  return apiRequest<Paciente>('/api/pacientes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

export function updatePaciente(id: string, data: PacienteFormData): Promise<Paciente> {
  return apiRequest<Paciente>(`/api/pacientes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

export async function deletePaciente(id: string): Promise<void> {
  await apiRequest(`/api/pacientes/${id}`, {
    method: 'DELETE',
  })
}

export function createResultadoPrueba(
  data: ResultadoPruebaFormData,
  archivo?: File | null,
): Promise<ResultadoPrueba> {
  return apiRequest<ResultadoPrueba>('/api/resultados-pruebas', {
    method: 'POST',
    body: buildResultadoFormData(data, archivo),
  })
}

export function updateResultadoPrueba(
  id: string,
  data: ResultadoPruebaFormData,
  archivo?: File | null,
): Promise<ResultadoPrueba> {
  return apiRequest<ResultadoPrueba>(`/api/resultados-pruebas/${id}`, {
    method: 'PUT',
    body: buildResultadoFormData(data, archivo),
  })
}

export async function deleteResultadoPrueba(id: string): Promise<void> {
  await apiRequest(`/api/resultados-pruebas/${id}`, {
    method: 'DELETE',
  })
}

export function createResultadoLaboratorio(
  data: ResultadoLaboratorioFormData,
  archivo?: File | null,
): Promise<ResultadoLaboratorio> {
  return apiRequest<ResultadoLaboratorio>('/api/resultados-laboratorio', {
    method: 'POST',
    body: buildResultadoFormData(data, archivo),
  })
}

export function updateResultadoLaboratorio(
  id: string,
  data: ResultadoLaboratorioFormData,
  archivo?: File | null,
): Promise<ResultadoLaboratorio> {
  return apiRequest<ResultadoLaboratorio>(`/api/resultados-laboratorio/${id}`, {
    method: 'PUT',
    body: buildResultadoFormData(data, archivo),
  })
}

export async function deleteResultadoLaboratorio(id: string): Promise<void> {
  await apiRequest(`/api/resultados-laboratorio/${id}`, {
    method: 'DELETE',
  })
}

export function createCita(data: CitaFormData): Promise<Cita> {
  return apiRequest<Cita>('/api/citas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

export function updateCita(id: string, data: CitaFormData): Promise<Cita> {
  return apiRequest<Cita>(`/api/citas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

export async function deleteCita(id: string): Promise<void> {
  await apiRequest(`/api/citas/${id}`, {
    method: 'DELETE',
  })
}