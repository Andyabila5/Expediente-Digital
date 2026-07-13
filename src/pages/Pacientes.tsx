import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpediente } from '../context/ExpedienteContext'
import PacienteFormFields from '../components/PacienteFormFields'
import { EMPTY_PACIENTE_FORM } from '../constants/pacienteForm'
import type { PacienteFormData } from '../types'
import './Pacientes.css'

export default function Pacientes() {
  const { pacientes, agregarPaciente, eliminarPaciente, loading, error } = useExpediente()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<PacienteFormData>(EMPTY_PACIENTE_FORM)
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.cedula.includes(busqueda)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) return

    setGuardando(true)

    try {
      const nuevo = await agregarPaciente(form)
      setForm(EMPTY_PACIENTE_FORM)
      setShowForm(false)
      navigate(`/paciente/${nuevo.id}`)
    } finally {
      setGuardando(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Pacientes</h2>
          <p className="page-subtitle">Gestiona los expedientes clínicos de tus pacientes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Paciente'}
        </button>
      </div>

      {error && <div className="alert">{error}</div>}

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>Registrar nuevo expediente</h3>
          <PacienteFormFields form={form} onChange={handleChange} />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar expediente'}
            </button>
          </div>
        </form>
      )}

      <div className="search-bar">
        <input
          type="search"
          placeholder="Buscar por nombre, cédula o correo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="empty-state card">
          <p>Cargando pacientes...</p>
        </div>
      ) : pacientesFiltrados.length === 0 ? (
        <div className="empty-state card">
          <p>{busqueda ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}</p>
          {!busqueda && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Agregar primer paciente
            </button>
          )}
        </div>
      ) : (
        <div className="pacientes-grid">
          {pacientesFiltrados.map(paciente => (
            <div key={paciente.id} className="card paciente-card">
              <div className="paciente-avatar">
                {paciente.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="paciente-info">
                <h3>{paciente.nombre}</h3>
                {paciente.cedula && <p>Cédula: {paciente.cedula}</p>}
                {paciente.telefono && <p>📞 {paciente.telefono}</p>}
                {paciente.correo && <p>✉️ {paciente.correo}</p>}
                {paciente.mc && (
                  <p className="padecimientos-preview">MC: {paciente.mc}</p>
                )}
              </div>
              <div className="paciente-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/paciente/${paciente.id}`)}
                >
                  Ver expediente
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (confirm(`¿Eliminar el expediente de ${paciente.nombre}?`)) {
                      setEliminandoId(paciente.id)
                      void eliminarPaciente(paciente.id).finally(() => setEliminandoId(current => (current === paciente.id ? null : current)))
                    }
                  }}
                  disabled={eliminandoId === paciente.id}
                >
                  {eliminandoId === paciente.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
