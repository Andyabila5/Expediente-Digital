import { useMemo, useState } from 'react'
import {
  createSolicitudAnalisisForm,
  gruposPorColumna,
} from '../constants/solicitudAnalisis'
import { DOCTOR_INFO } from '../constants/doctor'
import type { Paciente, SolicitudAnalisis, SolicitudAnalisisFormData } from '../types'
import './SolicitudAnalisisSection.css'

interface SolicitudAnalisisSectionProps {
  paciente: Paciente
  solicitudes: SolicitudAnalisis[]
  onCreate: (data: SolicitudAnalisisFormData) => Promise<void>
  onUpdate: (id: string, data: SolicitudAnalisisFormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function toFormData(solicitud: SolicitudAnalisis): SolicitudAnalisisFormData {
  return {
    pacienteId: solicitud.pacienteId,
    fecha: solicitud.fecha.split('T')[0],
    nombrePaciente: solicitud.nombrePaciente,
    telefono: solicitud.telefono,
    cedula: solicitud.cedula,
    sexo: solicitud.sexo,
    diagnostico: solicitud.diagnostico,
    estudios: solicitud.estudios,
    notas: solicitud.notas,
  }
}

function formatFecha(value: string) {
  return new Date(value).toLocaleDateString('es-MX', {
    dateStyle: 'medium',
  })
}

function EstudiosColumnas({
  form,
  onToggle,
}: {
  form: SolicitudAnalisisFormData
  onToggle: (estudio: string) => void
}) {
  const columnas = useMemo(() => gruposPorColumna(), [])

  return (
    <div className="solicitud-analisis-columns">
      {[1, 2, 3].map(columna => (
        <div key={columna} className="solicitud-analisis-column">
          {columnas[columna as 1 | 2 | 3].map(grupo => (
            <div key={grupo.titulo} className="solicitud-grupo">
              <h4>{grupo.titulo}</h4>
              <div className="solicitud-checklist">
                {grupo.estudios.map(estudio => (
                  <label key={estudio} className="solicitud-check-item">
                    <input
                      type="checkbox"
                      checked={form.estudios.includes(estudio)}
                      onChange={() => onToggle(estudio)}
                    />
                    <span>{estudio}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function SolicitudAnalisisSection({
  paciente,
  solicitudes,
  onCreate,
  onUpdate,
  onDelete,
}: SolicitudAnalisisSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [form, setForm] = useState<SolicitudAnalisisFormData>(() => createSolicitudAnalisisForm(paciente))

  const solicitudEditando = useMemo(
    () => solicitudes.find(solicitud => solicitud.id === editingId) ?? null,
    [editingId, solicitudes],
  )

  const resetForm = () => {
    setForm(createSolicitudAnalisisForm(paciente))
    setEditingId(null)
    setShowForm(false)
  }

  const abrirNuevaSolicitud = () => {
    if (showForm && !editingId) {
      resetForm()
      return
    }

    setForm(createSolicitudAnalisisForm(paciente))
    setEditingId(null)
    setShowForm(true)
  }

  const iniciarEdicion = (solicitud: SolicitudAnalisis) => {
    setForm(toFormData(solicitud))
    setEditingId(solicitud.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleEstudio = (estudio: string) => {
    setForm(prev => ({
      ...prev,
      estudios: prev.estudios.includes(estudio)
        ? prev.estudios.filter(item => item !== estudio)
        : [...prev.estudios, estudio],
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (form.estudios.length === 0) return

    setGuardando(true)

    try {
      if (editingId) {
        await onUpdate(editingId, form)
      } else {
        await onCreate(form)
      }
      resetForm()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="card solicitud-analisis-card">
      <div className="solicitud-analisis-header">
        <div>
          <h3>Solicitud de Analisis de Laboratorio</h3>
          <p className="page-subtitle">
            Registra solicitudes de laboratorio dentro del expediente del paciente.
          </p>
        </div>
        <div className="solicitud-analisis-actions">
          <span className="badge">{solicitudes.length}</span>
          <button type="button" className="btn btn-primary" onClick={abrirNuevaSolicitud}>
            {showForm && !editingId ? 'Cancelar' : '+ Nueva solicitud'}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="solicitud-analisis-form" onSubmit={handleSubmit}>
          <div className="solicitud-form-sheet">
            <header className="solicitud-form-brand">
              <p className="solicitud-clinica">{DOCTOR_INFO.clinica}</p>
              <h4>Solicitud de Analisis de Laboratorio</h4>
            </header>

            <div className="solicitud-paciente-grid">
              <div className="form-group">
                <label htmlFor="fechaSolicitud">Fecha</label>
                <input
                  id="fechaSolicitud"
                  type="date"
                  value={form.fecha}
                  onChange={event => setForm(prev => ({ ...prev, fecha: event.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="nombrePacienteSolicitud">Nombre del paciente</label>
                <input id="nombrePacienteSolicitud" type="text" value={form.nombrePaciente} readOnly />
              </div>
              <div className="form-group">
                <label htmlFor="telefonoSolicitud">Telefono</label>
                <input
                  id="telefonoSolicitud"
                  type="text"
                  value={form.telefono}
                  onChange={event => setForm(prev => ({ ...prev, telefono: event.target.value }))}
                  placeholder="Telefono de contacto"
                />
              </div>
              <div className="form-group">
                <label htmlFor="cedulaSolicitud">Cedula</label>
                <input
                  id="cedulaSolicitud"
                  type="text"
                  value={form.cedula}
                  onChange={event => setForm(prev => ({ ...prev, cedula: event.target.value }))}
                  placeholder="Cedula del paciente"
                />
              </div>
              <div className="form-group">
                <label htmlFor="sexoSolicitud">Sexo</label>
                <select
                  id="sexoSolicitud"
                  value={form.sexo}
                  onChange={event => setForm(prev => ({ ...prev, sexo: event.target.value }))}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label htmlFor="diagnosticoSolicitud">Diagnostico</label>
                <textarea
                  id="diagnosticoSolicitud"
                  rows={2}
                  value={form.diagnostico}
                  onChange={event => setForm(prev => ({ ...prev, diagnostico: event.target.value }))}
                  placeholder="Diagnostico o motivo clinico de la solicitud"
                />
              </div>
            </div>

            <div className="solicitud-analisis-selected">
              <strong>{form.estudios.length}</strong>
              <span>estudios seleccionados</span>
            </div>

            <EstudiosColumnas form={form} onToggle={toggleEstudio} />

            <div className="form-group full-width">
              <label htmlFor="notasSolicitud">Notas adicionales</label>
              <textarea
                id="notasSolicitud"
                rows={2}
                value={form.notas}
                onChange={event => setForm(prev => ({ ...prev, notas: event.target.value }))}
                placeholder="Indicaciones adicionales para el laboratorio"
              />
            </div>

            <footer className="solicitud-form-footer">
              <div>
                <p className="doctora-nombre">{DOCTOR_INFO.nombre}</p>
                <p>{DOCTOR_INFO.especialidad}</p>
                <p className="doctora-codigo">CODIGO {DOCTOR_INFO.codigo}</p>
              </div>
              <p className="solicitud-firma-label">Firma y sello del medico</p>
            </footer>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando || form.estudios.length === 0}>
              {guardando ? 'Guardando...' : editingId ? 'Guardar solicitud' : 'Crear solicitud'}
            </button>
          </div>
        </form>
      )}

      {solicitudes.length === 0 ? (
        <p className="sin-datos">Aun no hay solicitudes de analisis registradas para este expediente.</p>
      ) : (
        <div className="solicitud-analisis-list">
          {solicitudes.map(solicitud => (
            <article key={solicitud.id} className="solicitud-resumen">
              <div className="solicitud-resumen-header">
                <div>
                  <h4>{formatFecha(solicitud.fecha)}</h4>
                  <p>
                    {solicitud.diagnostico || 'Sin diagnostico especificado'}
                    {solicitud.sexo ? ` · ${solicitud.sexo}` : ''}
                  </p>
                </div>
                <span className="badge">{solicitud.estudios.length}</span>
              </div>

              <p className="solicitud-resumen-meta">
                Cedula: {solicitud.cedula || 'Sin registro'} · Telefono: {solicitud.telefono || 'Sin registro'}
              </p>

              <div className="solicitud-estudios-tags">
                {solicitud.estudios.map(estudio => (
                  <span key={estudio} className="solicitud-estudio-tag">
                    {estudio}
                  </span>
                ))}
              </div>

              {solicitud.notas && <p className="solicitud-resumen-notas">{solicitud.notas}</p>}

              <div className="paciente-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => iniciarEdicion(solicitud)}>
                  Editar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (confirm('¿Eliminar esta solicitud de analisis?')) {
                      setEliminandoId(solicitud.id)
                      void onDelete(solicitud.id).finally(() =>
                        setEliminandoId(current => (current === solicitud.id ? null : current)),
                      )
                    }
                  }}
                  disabled={eliminandoId === solicitud.id}
                >
                  {eliminandoId === solicitud.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {solicitudEditando && (
        <p className="solicitud-analisis-editing-note">
          Editando solicitud del {formatFecha(solicitudEditando.fecha)}.
        </p>
      )}
    </section>
  )
}
