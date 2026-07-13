import { useState } from 'react'
import { useExpediente } from '../context/ExpedienteContext'
import { API_BASE_URL } from '../config'
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
    loading,
    error,
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
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  const resultadosFiltrados = filtroPaciente
    ? resultadosPruebas.filter(r => r.pacienteId === filtroPaciente)
    : resultadosPruebas

  const obtenerNombrePaciente = (id: string) =>
    pacientes.find(p => p.id === id)?.nombre ?? 'Paciente desconocido'

  const resetForm = () => {
    setForm(emptyForm())
    setArchivo(null)
    setEditingId(null)
    setShowForm(false)
  }

  const abrirNuevo = () => {
    if (showForm && !editingId) {
      resetForm()
      return
    }
    setForm(emptyForm())
    setArchivo(null)
    setEditingId(null)
    setShowForm(true)
  }

  const iniciarEdicion = (resultado: ResultadoPrueba) => {
    setForm(toFormData(resultado))
    setArchivo(null)
    setEditingId(resultado.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resultadoEditando = editingId ? resultadosPruebas.find(item => item.id === editingId) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.pacienteId || !form.nombrePrueba.trim()) return

    setGuardando(true)

    try {
      if (editingId) {
        await actualizarResultadoPrueba(editingId, form, archivo)
      } else {
        await agregarResultadoPrueba(form, archivo)
      }
      resetForm()
    } finally {
      setGuardando(false)
    }
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

      {error && <div className="alert">{error}</div>}

      {loading && (
        <div className="empty-state card">
          <p>Cargando resultados de pruebas...</p>
        </div>
      )}

      {!loading && pacientes.length === 0 && (
        <div className="alert">
          Primero debes registrar al menos un paciente para agregar resultados.
        </div>
      )}

      {showForm && !loading && (
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
            <div className="form-group full-width">
              <label htmlFor="archivoPrueba">Adjunto JPG o PDF</label>
              <input
                id="archivoPrueba"
                type="file"
                accept=".jpg,.jpeg,.pdf,application/pdf,image/jpeg"
                onChange={event => setArchivo(event.target.files?.[0] ?? null)}
              />
              <p className="input-help">
                {archivo
                  ? `Archivo seleccionado: ${archivo.name}`
                  : resultadoEditando?.archivo
                    ? `Archivo actual: ${resultadoEditando.archivo.nombre}. Si cargas uno nuevo, reemplaza el actual.`
                    : 'Puedes adjuntar una imagen JPG o un PDF.'}
              </p>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar resultado'}
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

      {loading ? null : resultadosFiltrados.length === 0 ? (
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
                <th>Adjunto</th>
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
                    {r.archivo ? (
                      <a className="archivo-link" href={`${API_BASE_URL}${r.archivo.url}`} target="_blank" rel="noreferrer">
                        {r.archivo.nombre}
                      </a>
                    ) : (
                      <span className="archivo-empty">Sin archivo</span>
                    )}
                  </td>
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
                            setEliminandoId(r.id)
                            void eliminarResultadoPrueba(r.id).finally(() =>
                              setEliminandoId(current => (current === r.id ? null : current)),
                            )
                          }
                        }}
                        disabled={eliminandoId === r.id}
                      >
                        {eliminandoId === r.id ? 'Eliminando...' : 'Eliminar'}
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