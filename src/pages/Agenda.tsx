import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useExpediente } from '../context/ExpedienteContext'
import type { CitaFormData, EstadoCita } from '../types'
import './Agenda.css'

const EMPTY_CITA_FORM: CitaFormData = {
  pacienteId: '',
  fechaHora: '',
  motivo: '',
  notas: '',
  estado: 'programada',
  recordatorioWhatsApp: true,
}

const ESTADOS: { value: EstadoCita; label: string }[] = [
  { value: 'programada', label: 'Programada' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
]

function formatFechaHora(value: string) {
  return new Date(value).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

interface WhatsAppStatus {
  configured: boolean
  hasTestRecipient: boolean
  testRecipient: string | null
  testTemplate: string
  phoneNumberId: string | null
  businessAccountId: string | null
  tokenValid: boolean | null
  displayPhoneNumber: string | null
  verifiedName: string | null
}

interface GoogleStatus {
  configured: boolean
  authenticated: boolean
  redirectUri: string
  calendarId: string
}

function addMinutes(isoDateTime: string, minutes: number) {
  const date = new Date(isoDateTime)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString()
}

export default function Agenda() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { pacientes, citas, agregarCita, actualizarCita, eliminarCita, loading, error } = useExpediente()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<'todas' | EstadoCita>('todas')
  const [form, setForm] = useState<CitaFormData>(EMPTY_CITA_FORM)
  const [backendOnline, setBackendOnline] = useState(false)
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppStatus | null>(null)
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [googleMessage, setGoogleMessage] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null)
  const [creatingGoogleEventId, setCreatingGoogleEventId] = useState<string | null>(null)
  const [openingGoogleAuth, setOpeningGoogleAuth] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [savingAppointment, setSavingAppointment] = useState(false)
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<string | null>(null)

  const pacientesMap = useMemo(
    () => new Map(pacientes.map(paciente => [paciente.id, paciente])),
    [pacientes],
  )

  const loadIntegrationStatus = useCallback(async () => {
    try {
      const [healthResponse, whatsappResponse, googleResponse] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/whatsapp/status'),
        fetch('/api/google/status'),
      ])

      if (!healthResponse.ok || !whatsappResponse.ok || !googleResponse.ok) {
        throw new Error('No fue posible leer el estado del backend.')
      }

      const whatsappData = (await whatsappResponse.json()) as WhatsAppStatus
      const googleData = (await googleResponse.json()) as GoogleStatus

      setBackendOnline(true)
      setWhatsAppStatus(whatsappData)
      setGoogleStatus(googleData)

      if (whatsappData.testRecipient) {
        setTestPhone(current => current || (whatsappData.testRecipient ?? ''))
      }

      if (!whatsappData.configured) {
        setStatusMessage('El backend está activo, pero faltan credenciales de WhatsApp en backend/.env.')
      } else if (whatsappData.tokenValid === false) {
        setStatusMessage('WhatsApp está configurado, pero el token parece inválido o expirado.')
      } else {
        setStatusMessage(
          `WhatsApp listo. La prueba envía el template "${whatsappData.testTemplate}" al número destino.`,
        )
      }

      setGoogleMessage(
        googleData.configured
          ? googleData.authenticated
            ? 'Google Calendar está autenticado y listo para crear eventos.'
            : 'Google Calendar está configurado. Haz clic en "Conectar" para iniciar sesión.'
          : 'Faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en backend/.env.',
      )
    } catch {
      setBackendOnline(false)
      setWhatsAppStatus(null)
      setGoogleStatus(null)
      setStatusMessage('El backend local no está respondiendo. Ejecuta: npm run backend:dev')
      setGoogleMessage('No fue posible leer el estado de Google Calendar.')
    }
  }, [])

  useEffect(() => {
    void loadIntegrationStatus()
  }, [loadIntegrationStatus])

  useEffect(() => {
    if (searchParams.get('google') !== 'connected') return

    void loadIntegrationStatus()
    setGoogleMessage('Google Calendar conectado correctamente.')
    setSearchParams({}, { replace: true })
  }, [loadIntegrationStatus, searchParams, setSearchParams])

  const citasFiltradas = citas.filter(cita => {
    const paciente = pacientesMap.get(cita.pacienteId)
    const text = `${paciente?.nombre ?? ''} ${cita.motivo} ${cita.notas}`.toLowerCase()
    const matchesSearch = text.includes(busqueda.toLowerCase())
    const matchesEstado = estadoFiltro === 'todas' || cita.estado === estadoFiltro
    return matchesSearch && matchesEstado
  })

  const resumen = {
    total: citas.length,
    pendientes: citas.filter(cita => ['programada', 'confirmada'].includes(cita.estado)).length,
    conRecordatorio: citas.filter(cita => cita.recordatorioWhatsApp).length,
  }

  const resetForm = () => {
    setForm(EMPTY_CITA_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const handleSendTestMessage = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!testPhone.trim()) {
      setStatusMessage('Debes indicar un número para la prueba.')
      return
    }

    setSendingTest(true)
    setStatusMessage('Enviando mensaje de prueba por WhatsApp...')

    try {
      const response = await fetch('/api/whatsapp/messages/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testPhone.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo enviar el mensaje de prueba.')
      }

      setStatusMessage('Template hello_world enviado correctamente por WhatsApp.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Falló el envío de prueba.')
    } finally {
      setSendingTest(false)
    }
  }

  const handleSendReminder = async (citaId: string) => {
    const cita = citas.find(item => item.id === citaId)
    if (!cita) return

    const paciente = pacientesMap.get(cita.pacienteId)
    if (!paciente?.telefono?.trim()) {
      setStatusMessage('Ese paciente no tiene teléfono registrado para enviar WhatsApp.')
      return
    }

    setSendingReminderId(citaId)
    setStatusMessage(`Enviando recordatorio a ${paciente.nombre}...`)

    try {
      const response = await fetch('/api/whatsapp/messages/reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: paciente.telefono.trim(),
          patientName: paciente.nombre,
          appointmentDate: formatFechaHora(cita.fechaHora),
          clinicName: 'Expediente Digital',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo enviar el recordatorio.')
      }

      setStatusMessage(`Recordatorio enviado correctamente a ${paciente.nombre}.`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Falló el envío del recordatorio.')
    } finally {
      setSendingReminderId(null)
    }
  }

  const handleGoogleAuth = async () => {
    setOpeningGoogleAuth(true)
    setGoogleMessage('Preparando autenticación de Google Calendar...')

    try {
      const response = await fetch('/api/google/auth-url')
      const data = await response.json()

      if (!response.ok || !data?.url) {
        throw new Error(data?.message || 'No se pudo generar el enlace de autenticación.')
      }

      window.open(data.url, '_blank', 'noopener,noreferrer')
      setGoogleMessage('Se abrió la autenticación de Google en una nueva pestaña.')
    } catch (error) {
      setGoogleMessage(
        error instanceof Error ? error.message : 'No fue posible abrir la autenticación de Google.',
      )
    } finally {
      setOpeningGoogleAuth(false)
    }
  }

  const handleCreateGoogleEvent = async (citaId: string) => {
    const cita = citas.find(item => item.id === citaId)
    if (!cita) return

    const paciente = pacientesMap.get(cita.pacienteId)
    if (!paciente) {
      setGoogleMessage('No se encontró el paciente asociado a la cita.')
      return
    }

    setCreatingGoogleEventId(citaId)
    setGoogleMessage(`Creando evento de Google Calendar para ${paciente.nombre}...`)

    try {
      const response = await fetch('/api/google/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: `${cita.motivo} - ${paciente.nombre}`,
          description: cita.notas || `Cita registrada en Expediente Digital para ${paciente.nombre}.`,
          start: new Date(cita.fechaHora).toISOString(),
          end: addMinutes(cita.fechaHora, 30),
          timeZone: 'America/Costa_Rica',
          attendees: paciente.correo ? [paciente.correo] : [],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo crear el evento en Google Calendar.')
      }

      setGoogleMessage('Evento creado correctamente en Google Calendar.')

      if (data?.htmlLink) {
        window.open(data.htmlLink, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      setGoogleMessage(
        error instanceof Error ? error.message : 'Falló la creación del evento en Google Calendar.',
      )
    } finally {
      setCreatingGoogleEventId(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.pacienteId || !form.fechaHora || !form.motivo.trim()) return

    setSavingAppointment(true)

    try {
      if (editingId) {
        await actualizarCita(editingId, form)
      } else {
        await agregarCita(form)
      }

      resetForm()
    } finally {
      setSavingAppointment(false)
    }
  }

  const handleEdit = (id: string) => {
    const cita = citas.find(item => item.id === id)
    if (!cita) return
    setEditingId(id)
    setForm({
      pacienteId: cita.pacienteId,
      fechaHora: cita.fechaHora.slice(0, 16),
      motivo: cita.motivo,
      notas: cita.notas,
      estado: cita.estado,
      recordatorioWhatsApp: cita.recordatorioWhatsApp,
    })
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state card">
          <p>Cargando agenda...</p>
        </div>
      </div>
    )
  }

  if (pacientes.length === 0) {
    return (
      <div className="page">
        <div className="empty-state card">
          <p>Primero necesitas al menos un paciente para programar citas.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Ir a pacientes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Agenda</h2>
          <p className="page-subtitle">
            Programa citas del expediente y deja preparado el recordatorio para WhatsApp.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm) {
              resetForm()
              return
            }

            setEditingId(null)
            setForm(EMPTY_CITA_FORM)
            setShowForm(true)
          }}
        >
          {showForm ? 'Cerrar formulario' : '+ Nueva cita'}
        </button>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="agenda-summary">
        <div className="card summary-card">
          <span>Total</span>
          <strong>{resumen.total}</strong>
        </div>
        <div className="card summary-card">
          <span>Próximas</span>
          <strong>{resumen.pendientes}</strong>
        </div>
        <div className="card summary-card">
          <span>Con recordatorio</span>
          <strong>{resumen.conRecordatorio}</strong>
        </div>
      </div>

      <section className="card whatsapp-panel">
        <div className="whatsapp-panel-header">
          <div>
            <h3>WhatsApp</h3>
            <p className="page-subtitle">Envía mensajes de prueba y recordatorios desde el backend local.</p>
          </div>
          <span className={`integration-badge ${backendOnline ? 'online' : 'offline'}`}>
            {backendOnline ? 'Backend activo' : 'Backend desconectado'}
          </span>
        </div>

        <div className="whatsapp-status-grid">
          <div className="whatsapp-status-item">
            <span>API</span>
            <strong>{whatsAppStatus?.configured ? 'Configurada' : 'Pendiente'}</strong>
          </div>
          <div className="whatsapp-status-item">
            <span>Número de prueba</span>
            <strong>{whatsAppStatus?.hasTestRecipient ? 'Detectado' : 'No configurado'}</strong>
          </div>
          <div className="whatsapp-status-item">
            <span>Phone Number ID</span>
            <strong>{whatsAppStatus?.phoneNumberId || 'Sin definir'}</strong>
          </div>
        </div>

        <p className={`whatsapp-feedback ${backendOnline ? 'success' : 'error'}`}>{statusMessage}</p>

        <form className="whatsapp-test-form" onSubmit={handleSendTestMessage}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="testPhone">Número destino</label>
              <input
                id="testPhone"
                type="text"
                value={testPhone}
                onChange={event => setTestPhone(event.target.value)}
                placeholder="506XXXXXXXX"
              />
            </div>

            <div className="form-group full-width">
              <label>Prueba usada</label>
              <input type="text" value="template: hello_world" readOnly />
            </div>
          </div>

          <div className="form-actions agenda-form-actions">
            <button type="submit" className="btn btn-primary" disabled={!backendOnline || sendingTest}>
              {sendingTest ? 'Enviando...' : 'Enviar prueba hello_world'}
            </button>
          </div>
        </form>
      </section>

      <section className="card whatsapp-panel">
        <div className="whatsapp-panel-header">
          <div>
            <h3>Google Calendar</h3>
            <p className="page-subtitle">Autentica tu cuenta y crea eventos desde cada cita.</p>
          </div>
          <span className={`integration-badge ${googleStatus?.authenticated ? 'online' : 'offline'}`}>
            {googleStatus?.authenticated ? 'Google conectado' : 'Google pendiente'}
          </span>
        </div>

        <div className="whatsapp-status-grid">
          <div className="whatsapp-status-item">
            <span>Credenciales</span>
            <strong>{googleStatus?.configured ? 'Configuradas' : 'Pendientes'}</strong>
          </div>
          <div className="whatsapp-status-item">
            <span>Autenticación</span>
            <strong>{googleStatus?.authenticated ? 'Completa' : 'Falta iniciar sesión'}</strong>
          </div>
          <div className="whatsapp-status-item">
            <span>Calendario</span>
            <strong>{googleStatus?.calendarId || 'Sin definir'}</strong>
          </div>
        </div>

        <p
          className={`whatsapp-feedback ${
            googleStatus?.authenticated ? 'success' : googleStatus?.configured ? 'warning' : 'error'
          }`}
        >
          {googleMessage}
        </p>

        <div className="form-actions agenda-form-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void handleGoogleAuth()}
            disabled={!backendOnline || !googleStatus?.configured || openingGoogleAuth}
          >
            {openingGoogleAuth ? 'Abriendo...' : 'Conectar Google Calendar'}
          </button>
        </div>
      </section>

      {showForm && (
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Editar cita' : 'Registrar cita'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="pacienteId">Paciente</label>
              <select
                id="pacienteId"
                value={form.pacienteId}
                onChange={event => setForm(prev => ({ ...prev, pacienteId: event.target.value }))}
                required
              >
                <option value="">Seleccionar paciente</option>
                {pacientes.map(paciente => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fechaHora">Fecha y hora</label>
              <input
                id="fechaHora"
                type="datetime-local"
                value={form.fechaHora}
                onChange={event => setForm(prev => ({ ...prev, fechaHora: event.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="motivo">Motivo</label>
              <input
                id="motivo"
                type="text"
                value={form.motivo}
                onChange={event => setForm(prev => ({ ...prev, motivo: event.target.value }))}
                placeholder="Control, revisión, resultados, seguimiento..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                value={form.estado}
                onChange={event =>
                  setForm(prev => ({ ...prev, estado: event.target.value as EstadoCita }))
                }
              >
                {ESTADOS.map(estado => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="notas">Notas</label>
              <textarea
                id="notas"
                rows={3}
                value={form.notas}
                onChange={event => setForm(prev => ({ ...prev, notas: event.target.value }))}
                placeholder="Indicaciones previas, observaciones o mensaje base para recordatorio."
              />
            </div>
          </div>

          <label className="agenda-checkbox">
            <input
              type="checkbox"
              checked={form.recordatorioWhatsApp}
              onChange={event =>
                setForm(prev => ({ ...prev, recordatorioWhatsApp: event.target.checked }))
              }
            />
            <span>Marcar esta cita para recordatorio por WhatsApp</span>
          </label>

          <div className="form-actions agenda-form-actions">
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingAppointment}>
              {savingAppointment ? 'Guardando...' : editingId ? 'Guardar cita' : 'Crear cita'}
            </button>
          </div>
        </form>
      )}

      <div className="agenda-toolbar card">
        <div className="search-bar agenda-search">
          <input
            type="search"
            placeholder="Buscar por paciente, motivo o notas..."
            value={busqueda}
            onChange={event => setBusqueda(event.target.value)}
          />
        </div>

        <div className="form-group agenda-filter">
          <label htmlFor="estadoFiltro">Estado</label>
          <select
            id="estadoFiltro"
            value={estadoFiltro}
            onChange={event => setEstadoFiltro(event.target.value as 'todas' | EstadoCita)}
          >
            <option value="todas">Todas</option>
            {ESTADOS.map(estado => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {citasFiltradas.length === 0 ? (
        <div className="empty-state card">
          <p>No hay citas que coincidan con el filtro actual.</p>
        </div>
      ) : (
        <div className="agenda-list">
          {citasFiltradas.map(cita => {
            const paciente = pacientesMap.get(cita.pacienteId)

            return (
              <article key={cita.id} className="card agenda-item">
                <div className="agenda-item-main">
                  <div className="agenda-item-copy">
                    <div className="agenda-item-header">
                      <h3>{paciente?.nombre ?? 'Paciente sin registro'}</h3>
                      <span className={`agenda-status status-${cita.estado}`}>{cita.estado}</span>
                    </div>
                    <p className="agenda-item-time">{formatFechaHora(cita.fechaHora)}</p>
                    <p className="agenda-item-motivo">{cita.motivo}</p>
                    {cita.notas && <p className="agenda-item-notes">{cita.notas}</p>}
                  </div>

                  <div className="agenda-meta">
                    <span className={`agenda-reminder ${cita.recordatorioWhatsApp ? 'active' : ''}`}>
                      {cita.recordatorioWhatsApp
                        ? 'Recordatorio de WhatsApp pendiente'
                        : 'Sin recordatorio'}
                    </span>
                  </div>
                </div>

                <div className="paciente-actions">
                  {paciente && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/paciente/${paciente.id}`)}
                    >
                      Ver expediente
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(cita.id)}>
                    Editar
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => void handleCreateGoogleEvent(cita.id)}
                    disabled={!backendOnline || !googleStatus?.authenticated || creatingGoogleEventId === cita.id}
                  >
                    {creatingGoogleEventId === cita.id ? 'Creando evento...' : 'Google Calendar'}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => void handleSendReminder(cita.id)}
                    disabled={!backendOnline || sendingReminderId === cita.id || !cita.recordatorioWhatsApp}
                  >
                    {sendingReminderId === cita.id ? 'Enviando...' : 'Enviar WhatsApp'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (confirm('¿Eliminar esta cita?')) {
                        setDeletingAppointmentId(cita.id)
                        void eliminarCita(cita.id).finally(() =>
                          setDeletingAppointmentId(current => (current === cita.id ? null : current)),
                        )
                      }
                    }}
                    disabled={deletingAppointmentId === cita.id}
                  >
                    {deletingAppointmentId === cita.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="agenda-note">
        Si el backend está corriendo y `backend/.env` tiene las credenciales correctas, ya puedes disparar
        mensajes de WhatsApp y eventos de Google Calendar desde esta pantalla.
      </div>

      <div className="agenda-note">
        Si WhatsApp aceptó la solicitud pero aún no ves el mensaje en el teléfono, eso suele significar que la
        API lo recibió pero todavía no estamos leyendo confirmaciones de entrega. Para saber si fue entregado,
        leído o rechazado en el tramo final, el siguiente paso sería conectar un webhook de estados de Meta.
      </div>
    </div>
  )
}
