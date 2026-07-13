import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
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
import { loadData, saveData, generateId } from '../utils/storage'

interface ExpedienteContextType {
  pacientes: Paciente[]
  resultadosPruebas: ResultadoPrueba[]
  resultadosLaboratorio: ResultadoLaboratorio[]
  citas: Cita[]
  agregarPaciente: (data: PacienteFormData) => Paciente
  actualizarPaciente: (id: string, data: PacienteFormData) => void
  eliminarPaciente: (id: string) => void
  obtenerPaciente: (id: string) => Paciente | undefined
  agregarResultadoPrueba: (data: ResultadoPruebaFormData) => void
  actualizarResultadoPrueba: (id: string, data: ResultadoPruebaFormData) => void
  eliminarResultadoPrueba: (id: string) => void
  agregarResultadoLaboratorio: (data: ResultadoLaboratorioFormData) => void
  actualizarResultadoLaboratorio: (id: string, data: ResultadoLaboratorioFormData) => void
  eliminarResultadoLaboratorio: (id: string) => void
  obtenerPruebasPaciente: (pacienteId: string) => ResultadoPrueba[]
  obtenerLaboratoriosPaciente: (pacienteId: string) => ResultadoLaboratorio[]
  agregarCita: (data: CitaFormData) => void
  actualizarCita: (id: string, data: CitaFormData) => void
  eliminarCita: (id: string) => void
  obtenerCitasPaciente: (pacienteId: string) => Cita[]
}

const ExpedienteContext = createContext<ExpedienteContextType | null>(null)

export function ExpedienteProvider({ children }: { children: ReactNode }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [resultadosPruebas, setResultadosPruebas] = useState<ResultadoPrueba[]>([])
  const [resultadosLaboratorio, setResultadosLaboratorio] = useState<ResultadoLaboratorio[]>([])
  const [citas, setCitas] = useState<Cita[]>([])

  useEffect(() => {
    const data = loadData()
    setPacientes(data.pacientes)
    setResultadosPruebas(data.resultadosPruebas)
    setResultadosLaboratorio(data.resultadosLaboratorio)
    setCitas(data.citas)
  }, [])

  useEffect(() => {
    saveData({ pacientes, resultadosPruebas, resultadosLaboratorio, citas })
  }, [pacientes, resultadosPruebas, resultadosLaboratorio, citas])

  const agregarPaciente = (data: PacienteFormData): Paciente => {
    const nuevo: Paciente = {
      ...data,
      id: generateId(),
      fechaRegistro: new Date().toISOString(),
    }
    setPacientes(prev => [...prev, nuevo])
    return nuevo
  }

  const actualizarPaciente = (id: string, data: PacienteFormData) => {
    setPacientes(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)))
  }

  const eliminarPaciente = (id: string) => {
    setPacientes(prev => prev.filter(p => p.id !== id))
    setResultadosPruebas(prev => prev.filter(r => r.pacienteId !== id))
    setResultadosLaboratorio(prev => prev.filter(r => r.pacienteId !== id))
    setCitas(prev => prev.filter(c => c.pacienteId !== id))
  }

  const obtenerPaciente = (id: string) => pacientes.find(p => p.id === id)

  const agregarResultadoPrueba = (data: ResultadoPruebaFormData) => {
    setResultadosPruebas(prev => [...prev, { ...data, id: generateId() }])
  }

  const actualizarResultadoPrueba = (id: string, data: ResultadoPruebaFormData) => {
    setResultadosPruebas(prev => prev.map(r => (r.id === id ? { ...r, ...data } : r)))
  }

  const eliminarResultadoPrueba = (id: string) => {
    setResultadosPruebas(prev => prev.filter(r => r.id !== id))
  }

  const agregarResultadoLaboratorio = (data: ResultadoLaboratorioFormData) => {
    setResultadosLaboratorio(prev => [...prev, { ...data, id: generateId() }])
  }

  const actualizarResultadoLaboratorio = (id: string, data: ResultadoLaboratorioFormData) => {
    setResultadosLaboratorio(prev => prev.map(r => (r.id === id ? { ...r, ...data } : r)))
  }

  const eliminarResultadoLaboratorio = (id: string) => {
    setResultadosLaboratorio(prev => prev.filter(r => r.id !== id))
  }

  const obtenerPruebasPaciente = (pacienteId: string) =>
    resultadosPruebas.filter(r => r.pacienteId === pacienteId)

  const obtenerLaboratoriosPaciente = (pacienteId: string) =>
    resultadosLaboratorio.filter(r => r.pacienteId === pacienteId)

  const agregarCita = (data: CitaFormData) => {
    setCitas(prev =>
      [...prev, { ...data, id: generateId() }].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)),
    )
  }

  const actualizarCita = (id: string, data: CitaFormData) => {
    setCitas(prev =>
      prev
        .map(cita => (cita.id === id ? { ...cita, ...data } : cita))
        .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)),
    )
  }

  const eliminarCita = (id: string) => {
    setCitas(prev => prev.filter(cita => cita.id !== id))
  }

  const obtenerCitasPaciente = (pacienteId: string) =>
    citas
      .filter(cita => cita.pacienteId === pacienteId)
      .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))

  return (
    <ExpedienteContext.Provider
      value={{
        pacientes,
        resultadosPruebas,
        resultadosLaboratorio,
        citas,
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
