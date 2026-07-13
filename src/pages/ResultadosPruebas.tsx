import { useState } from 'react'
import { useExpediente } from '../context/ExpedienteContext'
import type { ResultadoPrueba, ResultadoPruebaFormData } from '../types'
import './Resultados.css'

const emptyForm = (): ResultadoPruebaFormData => ({
  pacienteId: '',
  nombrePrueba: '',
  fecha: new Date().toISOString().split('T')[0],
  resultado: '',
  notas: '',
})

function toFormData(resultado: ResultadoPrueba): ResultadoPruebaFormData {
  return {
    pacienteId: resultado.pacienteId,
    nombrePrueba: resultado.nombrePrueba,
    fecha: resultado.fecha.split('T')[0],
    resultado: resultado.resultado,
    notas: resultado.notas,
  }
}

export default function ResultadosPruebas() {
  const {
    pacientes,
    resultadosPruebas,
    agregarResultadoPrueba,
    actualizarResultadoPrueba,
    eliminarResultadoPrueba,
  } = useExpediente()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ResultadoPruebaFormData>(emptyForm())
  const [filtroPaciente, setFiltroPaciente] = useState('')

  const resultadosFiltrados = filtroPaciente
    ? resultadosPruebas.filter(r => r.pacienteId === filtroPaciente)
    : resultadosPruebas

  const obtenerNombrePaciente = (id: string) =>
    pacientes.find(p => p.id === id)?.nombre ?? 'Paciente desconocido'

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId(null)
    setShowForm(false)
  }

  const abrirNuevo = () => {
    if (showForm && !editingId) {
      resetForm()
      return
    }
    setForm(emptyForm())
    setEditingId(null)
    setShowForm(true)
  }

  const iniciarEdicion = (resultado: ResultadoPrueba) => {
    setForm(toFormData(resultado))
    setEditingId(resultado.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.pacienteId || !form.nombrePrueba.trim()) return

    if (editingId) {
      actualizarResultadoPrueba(editingId, form)
    } else {
      agregarResultadoPrueba(form)
    }
    resetForm()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Resultados de Pruebas</h2>
          <p className="page-subtitle">Registra y consulta resultados de pruebas médicas</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={abrirNuevo}
          disabled={pacientes.length === 0}
        >
          {showForm && !editingId ? 'Cancelar' : '+ Nuevo Resultado'}
        </button>
      </div>

      {pacientes.length === 0 && (
        <div className="alert">
          Primero debes registrar al menos un paciente para agregar resultados.
        </div>
      )}

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Editar resultado de prueba' : 'Registrar resultado de prueba'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="pacienteId">Paciente *</label>
              <select id="pacienteId" name="pacienteId" value={form.pacienteId} onChange={handleChange} required>
                <option value="">Seleccionar paciente...</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="nombrePrueba">Nombre de la prueba *</label>
              <input
                id="nombrePrueba"
                name="nombrePrueba"
                type="text"
                value={form.nombrePrueba}
                onChange={handleChange}
                placeholder="Ej. Radiografía de tórax"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="fecha">Fecha</label>
              <input id="fecha" name="fecha" type="date" value={form.fecha} onChange={handleChange} />
            </div>
            <div className="form-group full-width">
              <label htmlFor="resultado">Resultado *</label>
              <textarea
                id="resultado"
                name="resultado"
                value={form.resultado}
                onChange={handleChange}
                placeholder="Describe el resultado de la prueba..."
                rows={3}
                required
              />
            </div>
            <div className="form-group full-width">
              <label htmlFor="notas">Notas adicionales</label>
              <textarea
                id="notas"
                name="notas"
                value={form.notas}
                onChange={handleChange}
                placeholder="Observaciones, recomendaciones..."
                rows={2}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Guardar cambios' : 'Guardar resultado'}
            </button>
          </div>
        </form>
      )}

      <div className="filtro-bar">
        <label htmlFor="filtro">Filtrar por paciente:</label>
        <select id="filtro" value={filtroPaciente} onChange={e => setFiltroPaciente(e.target.value)}>
          <option value="">Todos los pacientes</option>
          {pacientes.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      {resultadosFiltrados.length === 0 ? (
        <div className="empty-state card">
          <p>No hay resultados de pruebas registrados</p>
        </div>
      ) : (
        <div className="resultados-tabla card">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Prueba</th>
                <th>Fecha</th>
                <th>Resultado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {resultadosFiltrados.map(r => (
                <tr key={r.id} className={editingId === r.id ? 'row-editing' : ''}>
                  <td>{obtenerNombrePaciente(r.pacienteId)}</td>
                  <td><strong>{r.nombrePrueba}</strong></td>
                  <td>{new Date(r.fecha).toLocaleDateString('es-MX')}</td>
                  <td className="resultado-cell">{r.resultado}</td>
                  <td>
                    <div className="acciones-cell">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => iniciarEdicion(r)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (confirm('¿Eliminar este resultado?')) {
                            if (editingId === r.id) resetForm()
                            eliminarResultadoPrueba(r.id)
                          }
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
