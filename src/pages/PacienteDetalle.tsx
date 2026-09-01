import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExpediente } from '../context/ExpedienteContext'
import { generarExpedientePDF } from '../utils/pdfGenerator'
import PacienteFormFields from '../components/PacienteFormFields'
import PacienteExpedienteView from '../components/PacienteExpedienteView'
import { pacienteToFormData } from '../constants/pacienteForm'
import { API_BASE_URL } from '../config'
import type { PacienteFormData } from '../types'
import './PacienteDetalle.css'

export default function PacienteDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    loading,
    error,
    obtenerPaciente,
    actualizarPaciente,
    obtenerPruebasPaciente,
    obtenerLaboratoriosPaciente,
    obtenerCitasPaciente,
  } = useExpediente()

  const [guardando, setGuardando] = useState(false)
  const paciente = id ? obtenerPaciente(id) : undefined
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState<PacienteFormData | null>(null)

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state card">
          <p>Cargando expediente...</p>
        </div>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="page">
        <div className="empty-state card">
          <p>Paciente no encontrado</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Volver a pacientes
          </button>
        </div>
      </div>
    )
  }

  const pruebas = obtenerPruebasPaciente(paciente.id)
  const laboratorios = obtenerLaboratoriosPaciente(paciente.id)
  const citas = obtenerCitasPaciente(paciente.id)

  const iniciarEdicion = () => {
    setForm(pacienteToFormData(paciente))
    setEditando(true)
  }

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    setGuardando(true)

    try {
      await actualizarPaciente(paciente.id, form)
      setEditando(false)
      setForm(null)
    } finally {
      setGuardando(false)
    }
  }

  const descargarPDF = () => {
    generarExpedientePDF({ paciente, pruebas, laboratorios })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!form) return
    setForm(prev => prev ? { ...prev, [e.target.name]: e.target.value } : prev)
  }

  return (
    <div className="page expediente-page">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/')}>← Volver</button>
          <h2>{paciente.nombre}</h2>
          <p className="page-subtitle">
            Registrado el {new Date(paciente.fechaRegistro).toLocaleDateString('es-MX')}
            {paciente.cedula && ` · Cédula: ${paciente.cedula}`}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={editando ? () => setEditando(false) : iniciarEdicion}>
            {editando ? 'Cancelar' : '✏️ Editar'}
          </button>
          <button className="btn btn-primary" onClick={descargarPDF}>
            📄 Descargar PDF
          </button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      {editando && form ? (
        <form className="card form-card" onSubmit={guardarEdicion}>
          <h3>Editar expediente clínico</h3>
          <PacienteFormFields form={form} onChange={handleChange} />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      ) : (
        <PacienteExpedienteView paciente={paciente} />
      )}

      <div className="secciones-expediente">
        <div className="card seccion-card">
          <div className="seccion-header">
            <h3>Agenda del paciente</h3>
            <span className="badge">{citas.length}</span>
          </div>
          {citas.length === 0 ? (
            <p className="sin-datos">Sin citas registradas</p>
          ) : (
            <ul className="resultados-lista">
              {citas.map(cita => (
                <li key={cita.id}>
                  <strong>{cita.motivo}</strong>
                  <span>{new Date(cita.fechaHora).toLocaleString('es-MX')}</span>
                  <p>
                    Estado: {cita.estado}
                    {cita.recordatorioWhatsApp ? ' · Recordatorio por WhatsApp pendiente' : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card seccion-card">
          <div className="seccion-header">
            <h3>
              Resultados de Pruebas
            </h3>
            <span className="badge">{pruebas.length}</span>
          </div>
          {pruebas.length === 0 ? (
            <p className="sin-datos">Sin resultados registrados</p>
          ) : (
            <ul className="resultados-lista">
              {pruebas.map(p => (
                <li key={p.id}>
                  <strong>{p.nombrePrueba}</strong>
                  <span>{new Date(p.fecha).toLocaleDateString('es-MX')}</span>
                  <p>{p.resultado}</p>
                  {p.archivo && (
                    <p>
                      <a href={`${API_BASE_URL}${p.archivo.url}`} target="_blank" rel="noreferrer">
                        Abrir adjunto: {p.archivo.nombre}
                      </a>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card seccion-card">
          <div className="seccion-header">
            <h3>
              Resultados de Laboratorio
            </h3>
            <span className="badge">{laboratorios.length}</span>
          </div>
          {laboratorios.length === 0 ? (
            <p className="sin-datos">Sin resultados registrados</p>
          ) : (
            <ul className="resultados-lista">
              {laboratorios.map(l => (
                <li key={l.id}>
                  <strong>{l.nombreAnalisis}</strong>
                  <span>{new Date(l.fecha).toLocaleDateString('es-MX')}</span>
                  <p>{l.valores}</p>
                  {l.archivo && (
                    <p>
                      <a href={`${API_BASE_URL}${l.archivo.url}`} target="_blank" rel="noreferrer">
                        Abrir adjunto: {l.archivo.nombre}
                      </a>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}