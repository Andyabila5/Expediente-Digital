import { useEffect, useId, useRef, useState } from 'react'
import type { Paciente } from '../types'
import { COLUMNAS_SOLICITUD, TODOS_LOS_EXAMENES } from '../constants/laboratorioSolicitud'
import { generarSolicitudLaboratorio } from '../utils/pdfGenerator'
import './SolicitudLaboratorio.css'

interface Props {
  pacientes: Paciente[]
  pacienteIdInicial?: string
  onClose: () => void
}

const SEXO_OPTIONS = ['Masculino', 'Femenino', 'Otro']

export default function SolicitudLaboratorio({ pacientes, pacienteIdInicial, onClose }: Props) {
  const formId = useId()

  const [pacienteId, setPacienteId] = useState(pacienteIdInicial ?? '')
  const [sexo, setSexo] = useState('Masculino')
  const [diagnostico, setDiagnostico] = useState('')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [generando, setGenerando] = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const paciente = pacientes.find(p => p.id === pacienteId)

  const toggleExamen = (examen: string) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(examen) ? next.delete(examen) : next.add(examen)
      return next
    })
  }

  const seleccionarTodos = () => setSeleccionados(new Set(TODOS_LOS_EXAMENES))
  const deseleccionarTodos = () => setSeleccionados(new Set())

  const handleGenerar = () => {
    if (!paciente) return
    setGenerando(true)
    try {
      generarSolicitudLaboratorio({
        paciente: {
          nombre: paciente.nombre,
          cedula: paciente.cedula,
          telefono: paciente.telefono,
        },
        sexo,
        diagnostico,
        seleccionados,
      })
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="solicitud-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="solicitud-modal" role="dialog" aria-modal="true" aria-labelledby={`${formId}-title`}>

        {/* Header */}
        <div className="solicitud-header">
          <div className="solicitud-header-copy">
            <h2 id={`${formId}-title`}>Solicitud de Análisis de Laboratorio</h2>
            <p>Selecciona los exámenes y descarga el PDF listo para entregar.</p>
          </div>
          <button className="solicitud-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Body */}
        <div className="solicitud-body">

          {/* Patient data */}
          <div>
            <p className="solicitud-section-label">Datos del paciente</p>
            <div className="solicitud-paciente-grid">
              <div className="form-group">
                <label htmlFor={`${formId}-paciente`}>Paciente *</label>
                <select
                  id={`${formId}-paciente`}
                  value={pacienteId}
                  onChange={e => setPacienteId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar paciente...</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor={`${formId}-sexo`}>Sexo</label>
                <select
                  id={`${formId}-sexo`}
                  value={sexo}
                  onChange={e => setSexo(e.target.value)}
                >
                  {SEXO_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor={`${formId}-diagnostico`}>Diagnóstico</label>
                <input
                  id={`${formId}-diagnostico`}
                  type="text"
                  value={diagnostico}
                  onChange={e => setDiagnostico(e.target.value)}
                  placeholder="Ej. HTA, DM tipo 2, control anual..."
                />
              </div>
            </div>
          </div>

          {/* Quick-select toolbar */}
          <div className="solicitud-quick">
            <span className="solicitud-quick-label">Selección rápida:</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={seleccionarTodos}>
              Marcar todos
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={deseleccionarTodos}>
              Limpiar
            </button>
            <span className="solicitud-counter">
              <strong>{seleccionados.size}</strong> / {TODOS_LOS_EXAMENES.length} seleccionados
            </span>
          </div>

          {/* Exam columns */}
          <div>
            <p className="solicitud-section-label">Exámenes</p>
            <div className="solicitud-columnas">
              {COLUMNAS_SOLICITUD.map((col, colIdx) => (
                <div key={colIdx} className="solicitud-columna">
                  {col.categorias.map((cat, catIdx) => (
                    <div key={catIdx} className="solicitud-categoria">
                      {cat.titulo && (
                        <p className="solicitud-categoria-titulo">{cat.titulo}</p>
                      )}
                      {cat.examenes.map(examen => {
                        const checked = seleccionados.has(examen)
                        const itemId = `${formId}-${examen}`
                        return (
                          <label
                            key={examen}
                            htmlFor={itemId}
                            className={`solicitud-item ${checked ? 'is-checked' : ''}`}
                          >
                            <input
                              id={itemId}
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleExamen(examen)}
                            />
                            <span className="solicitud-item-label">{examen}</span>
                          </label>
                        )
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="solicitud-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerar}
            disabled={!pacienteId || generando}
          >
            {generando ? 'Generando...' : '⬇ Descargar PDF'}
          </button>
        </div>

      </div>
    </div>
  )
}
