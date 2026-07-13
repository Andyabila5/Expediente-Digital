import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type {
  Paciente,
  PacienteFormData,
  ResultadoPrueba,
  ResultadoPruebaFormData,
  ResultadoLaboratorio,
  ResultadoLaboratorioFormData,
  Cita,
  CitaFormData,
} from '../types'
import {
  createCita as createCitaRequest,
  createPaciente as createPacienteRequest,
  createResultadoLaboratorio as createResultadoLaboratorioRequest,
  createResultadoPrueba as createResultadoPruebaRequest,
  deleteCita as deleteCitaRequest,
  deletePaciente as deletePacienteRequest,
  deleteResultadoLaboratorio as deleteResultadoLaboratorioRequest,
  deleteResultadoPrueba as deleteResultadoPruebaRequest,
  fetchExpedienteData,
  updateCita as updateCitaRequest,
  updatePaciente as updatePacienteRequest,
  updateResultadoLaboratorio as updateResultadoLaboratorioRequest,
  updateResultadoPrueba as updateResultadoPruebaRequest,
} from '../utils/api'

interface ExpedienteContextType {
  loading: boolean
  error: string
  pacientes: Paciente[]
  resultadosPruebas: ResultadoPrueba[]
  resultadosLaboratorio: ResultadoLaboratorio[]
  citas: Cita[]
  recargarDatos: () => Promise<void>
  agregarPaciente: (data: PacienteFormData) => Promise<Paciente>
  actualizarPaciente: (id: string, data: PacienteFormData) => Promise<void>
  eliminarPaciente: (id: string) => Promise<void>
  obtenerPaciente: (id: string) => Paciente | undefined
  agregarResultadoPrueba: (data: ResultadoPruebaFormData, archivo?: File | null) => Promise<void>
  actualizarResultadoPrueba: (
    id: string,
    data: ResultadoPruebaFormData,
    archivo?: File | null,
  ) => Promise<void>
  eliminarResultadoPrueba: (id: string) => Promise<void>
  agregarResultadoLaboratorio: (
    data: ResultadoLaboratorioFormData,
    archivo?: File | null,
  ) => Promise<void>
  actualizarResultadoLaboratorio: (
    id: string,
    data: ResultadoLaboratorioFormData,
    archivo?: File | null,
  ) => Promise<void>
  eliminarResultadoLaboratorio: (id: string) => Promise<void>
  obtenerPruebasPaciente: (pacienteId: string) => ResultadoPrueba[]
  obtenerLaboratoriosPaciente: (pacienteId: string) => ResultadoLaboratorio[]
  agregarCita: (data: CitaFormData) => Promise<void>
  actualizarCita: (id: string, data: CitaFormData) => Promise<void>
  eliminarCita: (id: string) => Promise<void>
  obtenerCitasPaciente: (pacienteId: string) => Cita[]
}

const ExpedienteContext = createContext<ExpedienteContextType | null>(null)

export function ExpedienteProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [resultadosPruebas, setResultadosPruebas] = useState<ResultadoPrueba[]>([])
  const [resultadosLaboratorio, setResultadosLaboratorio] = useState<ResultadoLaboratorio[]>([])
  const [citas, setCitas] = useState<Cita[]>([])

  const loadExpediente = useCallback(async () => {
    setLoading(true)

    try {
      const data = await fetchExpedienteData()
      setPacientes(data.pacientes)
      setResultadosPruebas(data.resultadosPruebas)
      setResultadosLaboratorio(data.resultadosLaboratorio)
      setCitas(data.citas)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar el expediente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadExpediente()
  }, [loadExpediente])

  const runMutation = useCallback(
    async <T,>(action: () => Promise<T>) => {
      try {
        const result = await action()
        setError('')
        await loadExpediente()
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No fue posible guardar los cambios.'
        setError(message)
        throw err
      }
    },
    [loadExpediente],
  )

  const agregarPaciente = (data: PacienteFormData) => runMutation(() => createPacienteRequest(data))

  const actualizarPaciente = async (id: string, data: PacienteFormData) => {
    await runMutation(() => updatePacienteRequest(id, data))
  }

  const eliminarPaciente = async (id: string) => {
    await runMutation(async () => {
      await deletePacienteRequest(id)
      return true
    })
  }

  const obtenerPaciente = (id: string) => pacientes.find(p => p.id === id)

  const agregarResultadoPrueba = async (data: ResultadoPruebaFormData, archivo?: File | null) => {
    await runMutation(() => createResultadoPruebaRequest(data, archivo))
  }

  const actualizarResultadoPrueba = async (
    id: string,
    data: ResultadoPruebaFormData,
    archivo?: File | null,
  ) => {
    await runMutation(() => updateResultadoPruebaRequest(id, data, archivo))
  }

  const eliminarResultadoPrueba = async (id: string) => {
    await runMutation(async () => {
      await deleteResultadoPruebaRequest(id)
      return true
    })
  }

  const agregarResultadoLaboratorio = async (
    data: ResultadoLaboratorioFormData,
    archivo?: File | null,
  ) => {
    await runMutation(() => createResultadoLaboratorioRequest(data, archivo))
  }

  const actualizarResultadoLaboratorio = async (
    id: string,
    data: ResultadoLaboratorioFormData,
    archivo?: File | null,
  ) => {
    await runMutation(() => updateResultadoLaboratorioRequest(id, data, archivo))
  }

  const eliminarResultadoLaboratorio = async (id: string) => {
    await runMutation(async () => {
      await deleteResultadoLaboratorioRequest(id)
      return true
    })
  }

  const obtenerPruebasPaciente = (pacienteId: string) =>
    resultadosPruebas.filter(r => r.pacienteId === pacienteId)

  const obtenerLaboratoriosPaciente = (pacienteId: string) =>
    resultadosLaboratorio.filter(r => r.pacienteId === pacienteId)

  const agregarCita = async (data: CitaFormData) => {
    await runMutation(() => createCitaRequest(data))
  }

  const actualizarCita = async (id: string, data: CitaFormData) => {
    await runMutation(() => updateCitaRequest(id, data))
  }

  const eliminarCita = async (id: string) => {
    await runMutation(async () => {
      await deleteCitaRequest(id)
      return true
    })
  }

  const obtenerCitasPaciente = (pacienteId: string) =>
    citas
      .filter(cita => cita.pacienteId === pacienteId)
      .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))

  return (
    <ExpedienteContext.Provider
      value={{
        loading,
        error,
        pacientes,
        resultadosPruebas,
        resultadosLaboratorio,
        citas,
        recargarDatos: loadExpediente,
        agregarPaciente,
        actualizarPaciente,
        eliminarPaciente,
        obtenerPaciente,
        agregarResultadoPrueba,
        actualizarResultadoPrueba,
        eliminarResultadoPrueba,
        agregarResultadoLaboratorio,
        actualizarResultadoLaboratorio,
        eliminarResultadoLaboratorio,
        obtenerPruebasPaciente,
        obtenerLaboratoriosPaciente,
        agregarCita,
        actualizarCita,
        eliminarCita,
        obtenerCitasPaciente,
      }}
    >
      {children}
    </ExpedienteContext.Provider>
  )
}

export function useExpediente() {
  const context = useContext(ExpedienteContext)
  if (!context) throw new Error('useExpediente debe usarse dentro de ExpedienteProvider')
  return context
}
