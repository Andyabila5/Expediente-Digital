import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useExpediente } from '../context/ExpedienteContext'
import { API_BASE_URL } from '../config'
import type { Cita, CitaFormData, EstadoCita } from '../types'
import './Agenda.css'

const EMPTY_CITA_FORM: CitaFormData = {
  pacienteId: '',
  fechaHora: '',
  motivo: '',
  notas: '',
  estado: 'programada',
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

function formatHora(value: string) {
  return new Date(value).toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatFechaLarga(value: Date) {
  return value.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface GoogleStatus {
  configured: boolean
  authenticated: boolean
  redirectUri: string
  calendarId: string
}

interface PendingWhatsappConfirmation {
  citaId: string
  pacienteNombre: string
}

function addMinutes(isoDateTime: string, minutes: number) {
  const date = new Date(isoDateTime)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString()
}

// Convierte un ISO UTC (lo que devuelve el backend) al formato que espera
// <input type="datetime-local">, que siempre se interpreta en hora LOCAL
// del navegador.
function toDatetimeLocalValue(isoString: string) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const offsetMs = date.getTimezoneOffset() * 60000
  const local = new Date(date.getTime() - offsetMs)
  return local.toISOString().slice(0, 16)
}

// Convierte el valor local del input (sin zona horaria) a un ISO UTC
// inequívoco antes de mandarlo al backend.
function fromDatetimeLocalValue(localValue: string) {
  if (!localValue) return ''
  return new Date(localValue).toISOString()
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  })
}

function getCalendarDays(monthDate: Date) {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const offset = (firstDayOfMonth.getDay() + 6) % 7
  const firstVisibleDay = new Date(firstDayOfMonth)
  firstVisibleDay.setDate(firstDayOfMonth.getDate() - offset)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstVisibleDay)
    day.setDate(firstVisibleDay.getDate() + index)
    return day
  })
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

function getDateKeyFromIso(value: string) {
  return getDateKey(new Date(value))
}

function normalizePhoneForWhatsApp(phone: string) {
  const digits = phone.replace(/\D/g, '')

  if (!digits) return ''
  if (digits.startsWith('00')) return digits.slice(2)
  if (digits.startsWith('506')) return digits
  if (digits.length === 8) return `506${digits}`

  return digits
}

function buildWhatsappMessage(patientName: string, cita: Cita) {
  const fecha = new Date(cita.fechaHora).toLocaleDateString('es-CR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const hora = new Date(cita.fechaHora).toLocaleTimeString('es-CR', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `Hola ${patientName}, se le recuerda su cita en Novauroclinica para el ${fecha} a las ${hora}.`
}

export default function Agenda() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { pacientes, citas, agregarCita, actualizarCita, eliminarCita, loading, error } = useExpediente()
  const today = useMemo(() => new Date(), [])
  const todayKey = useMemo(() => getDateKey(today), [today])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<'todas' | EstadoCita>('todas')
  const [form, setForm] = useState<CitaFormData>(EMPTY_CITA_FORM)
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)
  const [backendOnline, setBackendOnline] = useState(false)
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null)
  const [googleMessage, setGoogleMessage] = useState('')
  const [creatingGoogleEventId, setCreatingGoogleEventId] = useState<string | null>(null)
  const [openingGoogleAuth, setOpeningGoogleAuth] = useState(false)
  const [savingAppointment, setSavingAppointment] = useState(false)
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<string | null>(null)
  const [openingWhatsappId, setOpeningWhatsappId] = useState<string | null>(null)
  const [pendingWhatsappConfirmation, setPendingWhatsappConfirmation] =
    useState<PendingWhatsappConfirmation | null>(null)
  const [agendaMessage, setAgendaMessage] = useState('')

  const pacientesMap = useMemo(
    () => new Map(pacientes.map(paciente => [paciente.id, paciente])),
    [pacientes],
  )

  const loadIntegrationStatus = useCallback(async () => {
    try {
      const [healthResponse, googleResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/health`),
        fetch(`${API_BASE_URL}/api/google/status`),
      ])

      if (!healthResponse.ok || !googleResponse.ok) {
        throw new Error('No fue posible leer el estado del backend.')
      }

      const googleData = (await googleResponse.json()) as GoogleStatus

      setBackendOnline(true)
      setGoogleStatus(googleData)

      setGoogleMessage(
        googleData.configured
          ? googleData.authenticated
            ? 'Google Calendar está autenticado y listo para crear eventos.'
            : 'Google Calendar está configurado. Haz clic en "Conectar" para iniciar sesión.'
          : 'Faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en backend/.env.',
      )
    } catch {
      setBackendOnline(false)
      setGoogleStatus(null)
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

  useEffect(() => {
    if (!pendingWhatsappConfirmation) return

    const handleFocus = () => {
      const sent = window.confirm(
        `¿Ya enviaste el mensaje de confirmación a ${pendingWhatsappConfirmation.pacienteNombre}?`,
      )

      if (!sent) {
        setAgendaMessage('El mensaje de WhatsApp quedó abierto, pero la cita aún no se marcó como confirmada.')
        setPendingWhatsappConfirmation(null)
        return
      }

      const cita = citas.find(item => item.id === pendingWhatsappConfirmation.citaId)
      if (!cita) {
        setAgendaMessage('No se encontró la cita para actualizar su estado.')
        setPendingWhatsappConfirmation(null)
        return
      }

      void actualizarCita(pendingWhatsappConfirmation.citaId, {
        pacienteId: cita.pacienteId,
        fechaHora: cita.fechaHora,
        motivo: cita.motivo,
        notas: cita.notas,
        estado: 'confirmada',
      })
        .then(() => {
          setAgendaMessage(`La cita de ${pendingWhatsappConfirmation.pacienteNombre} quedó marcada como confirmada.`)
        })
        .catch(() => {
          setAgendaMessage('No fue posible marcar la cita como confirmada después del envío por WhatsApp.')
        })
        .finally(() => {
          setPendingWhatsappConfirmation(null)
        })
    }

    window.addEventListener('focus', handleFocus, { once: true })
    return () => window.removeEventListener('focus', handleFocus)
  }, [actualizarCita, citas, pendingWhatsappConfirmation])

  const citasFiltradas = useMemo(
    () =>
      citas
        .filter(cita => {
          const paciente = pacientesMap.get(cita.pacienteId)
          const text = `${paciente?.nombre ?? ''} ${cita.motivo} ${cita.notas}`.toLowerCase()
          const matchesSearch = text.includes(busqueda.toLowerCase())
          const matchesEstado = estadoFiltro === 'todas' || cita.estado === estadoFiltro
          return matchesSearch && matchesEstado
        })
        .sort((left, right) => left.fechaHora.localeCompare(right.fechaHora)),
    [busqueda, citas, estadoFiltro, pacientesMap],
  )

  const citasPorDia = useMemo(() => {
    const grouped = new Map<string, Cita[]>()

    citasFiltradas.forEach(cita => {
      const key = getDateKeyFromIso(cita.fechaHora)
      const list = grouped.get(key) ?? []
      list.push(cita)
      grouped.set(key, list)
    })

    return grouped
  }, [citasFiltradas])

  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth])

  const selectedDate = useMemo(() => {
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [selectedDateKey])

  const citasDiaSeleccionado = useMemo(
    () => (citasPorDia.get(selectedDateKey) ?? []).slice().sort((left, right) => left.fechaHora.localeCompare(right.fechaHora)),
    [citasPorDia, selectedDateKey],
  )

  const citasMesActual = useMemo(
    () => citasFiltradas.filter(cita => isSameMonth(new Date(cita.fechaHora), currentMonth)),
    [citasFiltradas, currentMonth],
  )

  const resumen = {
    total: citas.length,
    pendientes: citas.filter(cita => ['programada', 'confirmada'].includes(cita.estado)).length,
    mes: citasMesActual.length,
  }

  const resetForm = () => {
    setForm(EMPTY_CITA_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const handleGoogleAuth = async () => {
    setOpeningGoogleAuth(true)
    setGoogleMessage('Preparando autenticación de Google Calendar...')

    try {
      const response = await fetch(`${API_BASE_URL}/api/google/auth-url`)
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
      const response = await fetch(`${API_BASE_URL}/api/google/calendar/events`, {
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
      const payload = {
        ...form,
        fechaHora: fromDatetimeLocalValue(form.fechaHora),
      }

      if (editingId) {
        await actualizarCita(editingId, payload)
        setAgendaMessage('La cita se actualizó correctamente.')
      } else {
        const createdCita = await agregarCita(payload)
        const paciente = pacientesMap.get(createdCita.pacienteId)
        const phone = normalizePhoneForWhatsApp(paciente?.telefono ?? '')
        const citaDate = new Date(createdCita.fechaHora)

        setCurrentMonth(new Date(citaDate.getFullYear(), citaDate.getMonth(), 1))
        setSelectedDateKey(getDateKeyFromIso(createdCita.fechaHora))
        setAgendaMessage(
          phone
            ? `La cita de ${paciente?.nombre ?? 'Paciente'} fue creada. Ya puedes confirmarla desde el calendario.`
            : `La cita fue creada, pero el expediente no tiene un número válido para WhatsApp.`,
        )
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
      fechaHora: toDatetimeLocalValue(cita.fechaHora),
      motivo: cita.motivo,
      notas: cita.notas,
      estado: cita.estado,
    })
    setShowForm(true)
  }

  const handleOpenWhatsapp = async (citaId: string) => {
    const cita = citas.find(item => item.id === citaId)
    if (!cita) return

    const paciente = pacientesMap.get(cita.pacienteId)
    if (!paciente) {
      setAgendaMessage('No se encontró el paciente asociado a la cita.')
      return
    }

    const phone = normalizePhoneForWhatsApp(paciente.telefono)
    if (!phone) {
      setAgendaMessage('Este expediente no tiene un número de WhatsApp válido.')
      return
    }

    const message = buildWhatsappMessage(paciente.nombre, cita)
    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`

    setOpeningWhatsappId(citaId)
    setAgendaMessage(`Se abrió WhatsApp Web para ${paciente.nombre}. Cuando vuelvas, podrás marcar la cita como confirmada.`)

    try {
      window.open(url, '_blank', 'noopener,noreferrer')
      setPendingWhatsappConfirmation({
        citaId,
        pacienteNombre: paciente.nombre,
      })
    } finally {
      setOpeningWhatsappId(null)
    }
  }

  const handleSelectDate = (date: Date) => {
    setSelectedDateKey(getDateKey(date))
    if (!isSameMonth(date, currentMonth)) {
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }

  const moveMonth = (offset: number) => {
    setCurrentMonth(prev => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1)
      setSelectedDateKey(getDateKey(next))
      return next
    })
  }

  const goToToday = () => {
    const nextMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    setCurrentMonth(nextMonth)
    setSelectedDateKey(todayKey)
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
            Programa citas del expediente.
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
      {agendaMessage && <div className="alert">{agendaMessage}</div>}

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
          <span>En este mes</span>
          <strong>{resumen.mes}</strong>
        </div>
      </div>

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
                placeholder="Indicaciones previas u observaciones."
              />
            </div>
          </div>

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

      <section className="agenda-calendar-layout">
        <div className="card agenda-calendar-card">
          <div className="agenda-calendar-header">
            <div>
              <h3>{getMonthLabel(currentMonth)}</h3>
              <p className="page-subtitle">
                Vista mensual con las citas registradas en cada fecha.
              </p>
            </div>

            <div className="agenda-calendar-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveMonth(-1)}>
                Mes anterior
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={goToToday}>
                Hoy
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveMonth(1)}>
                Mes siguiente
              </button>
            </div>
          </div>

          <div className="agenda-calendar-weekdays">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="agenda-calendar-grid">
            {calendarDays.map(day => {
              const dayKey = getDateKey(day)
              const citasDia = citasPorDia.get(dayKey) ?? []
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isToday = dayKey === todayKey
              const isSelected = dayKey === selectedDateKey

              return (
                <button
                  key={dayKey}
                  type="button"
                  className={`agenda-day-cell ${isCurrentMonth ? '' : 'is-outside-month'} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelectDate(day)}
                >
                  <div className="agenda-day-cell-header">
                    <span className="agenda-day-number">{day.getDate()}</span>
                    {citasDia.length > 0 && <span className="agenda-day-count">{citasDia.length}</span>}
                  </div>

                  <div className="agenda-day-events">
                    {citasDia.slice(0, 3).map(cita => {
                      const paciente = pacientesMap.get(cita.pacienteId)
                      return (
                        <span key={cita.id} className={`agenda-day-event status-${cita.estado}`}>
                          <strong>{formatHora(cita.fechaHora)}</strong> {paciente?.nombre ?? 'Paciente'}
                        </span>
                      )
                    })}

                    {citasDia.length > 3 && (
                      <span className="agenda-day-more">+{citasDia.length - 3} más</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="card agenda-day-panel">
          <div className="agenda-day-panel-header">
            <div>
              <h3>{formatFechaLarga(selectedDate)}</h3>
              <p className="page-subtitle">
                {citasDiaSeleccionado.length === 0
                  ? 'No hay citas para este día con los filtros actuales.'
                  : `${citasDiaSeleccionado.length} cita${citasDiaSeleccionado.length === 1 ? '' : 's'} registradas.`}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditingId(null)
                setForm({
                  ...EMPTY_CITA_FORM,
                  fechaHora: `${selectedDateKey}T09:00`,
                })
                setShowForm(true)
              }}
            >
              Agendar aquí
            </button>
          </div>

          <section className="agenda-day-tools">
            <div className="agenda-day-tools-header">
              <div>
                <h4>Google Calendar</h4>
                <p className="page-subtitle">Conecta tu cuenta y crea eventos desde cada cita del día.</p>
              </div>
              <span className={`integration-badge ${googleStatus?.authenticated ? 'online' : 'offline'}`}>
                {googleStatus?.authenticated ? 'Google conectado' : 'Google pendiente'}
              </span>
            </div>

            <p
              className={`whatsapp-feedback ${googleStatus?.authenticated ? 'success' : googleStatus?.configured ? 'warning' : 'error'}`}
            >
              {googleMessage}
            </p>

            <div className="form-actions agenda-form-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => void handleGoogleAuth()}
                disabled={!backendOnline || !googleStatus?.configured || openingGoogleAuth}
              >
                {openingGoogleAuth ? 'Abriendo...' : 'Conectar Google Calendar'}
              </button>
            </div>
          </section>

          {citasDiaSeleccionado.length === 0 ? (
            <div className="empty-state agenda-day-empty">
              <p>No hay citas para mostrar en esta fecha.</p>
            </div>
          ) : (
            <div className="agenda-list">
              {citasDiaSeleccionado.map(cita => {
                const paciente = pacientesMap.get(cita.pacienteId)

                return (
                  <article key={cita.id} className="agenda-item agenda-item-compact">
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
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => void handleOpenWhatsapp(cita.id)}
                        disabled={openingWhatsappId === cita.id}
                      >
                        {openingWhatsappId === cita.id ? 'Abriendo WhatsApp...' : 'Confirmar cita'}
                      </button>
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
        </aside>
      </section>

      <div className="agenda-note">
        Si el backend está activo y las variables de entorno en Render tienen las credenciales correctas, ya
        puedes crear eventos de Google Calendar desde esta pantalla.
      </div>
    </div>
  )
}
