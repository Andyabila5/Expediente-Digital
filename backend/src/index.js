import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import multer from 'multer'
import { env } from './config/env.js'
import { checkDatabaseConnection } from './db/pool.js'
import { requireAuth } from './middleware/requireAuth.js'
import authRouter from './routes/auth.js'
import { logAudit } from './services/auditService.js'
import {
  buildGoogleAuthUrl,
  createCalendarEvent,
  exchangeGoogleCode,
  getGoogleStatus,
  listCalendars,
} from './services/googleCalendarService.js'
import {
  createCita,
  createPaciente,
  createResultadoLaboratorio,
  createResultadoPrueba,
  deleteCita,
  deletePaciente,
  deleteResultadoLaboratorio,
  deleteResultadoPrueba,
  getExpedienteData,
  getResultadoLaboratorioAttachment,
  getResultadoPruebaAttachment,
  updateCita,
  updatePaciente,
  updateResultadoLaboratorio,
  updateResultadoPrueba,
} from './services/expedienteService.js'

const app = express()

// ─── Multer ────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg'])
    if (allowedMimeTypes.has(file.mimetype)) {
      callback(null, true)
      return
    }
    const error = new Error('Solo se permiten archivos JPG o PDF.')
    error.status = 400
    callback(error)
  },
})

function handleSingleUpload(fieldName) {
  return (request, response, next) => {
    upload.single(fieldName)(request, response, error => {
      if (!error) { next(); return }
      if (error instanceof multer.MulterError) {
        error.status = 400
        if (error.code === 'LIMIT_FILE_SIZE') error.message = 'El archivo excede el límite de 10 MB.'
      }
      next(error)
    })
  }
}

// ─── Global middleware ─────────────────────────────────────────────────────
app.use(cors({
  origin: env.frontendUrl,
  credentials: true, // necesario para que el navegador envíe cookies
}))
app.use(cookieParser())
app.use(express.json())

// Trust proxy si corre detrás de Vercel/Render/Nginx para obtener IP real
app.set('trust proxy', 1)

// ─── Rate limiting ─────────────────────────────────────────────────────────

// Login: máximo 10 intentos por IP en 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' },
})

// API general: máximo 200 solicitudes por IP en 1 minuto
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
})

// ─── Rutas públicas ────────────────────────────────────────────────────────

app.get('/api/health', async (_request, response, next) => {
  try {
    const database = await checkDatabaseConnection()
    response.json({ ok: true, service: 'expediente-digital-backend', frontendUrl: env.frontendUrl, database })
  } catch (error) { next(error) }
})

// Auth: login lleva rate limiter estricto
app.use('/api/auth/login', loginLimiter)
app.use('/api/auth', authRouter)

// ─── Google OAuth callback — debe ser pública para recibir la redirección ──
app.get('/api/google/oauth/callback', async (request, response, next) => {
  try {
    const code = String(request.query.code || '')
    if (!code) {
      const error = new Error('Google no devolvió un código OAuth.')
      error.status = 400
      throw error
    }
    await exchangeGoogleCode(code)
    response.redirect(`${env.frontendUrl}/agenda?google=connected`)
  } catch (error) { next(error) }
})

// ─── Rutas protegidas ──────────────────────────────────────────────────────
// Todas las rutas a partir de aquí requieren JWT válido en cookie auth_token

app.use('/api', apiLimiter, requireAuth)

// Ruta /api/auth/me también pasa por requireAuth (arriba) pero
// el router auth.js ya define GET /me; el montaje en /api/auth antes
// de app.use('/api', requireAuth) hace que /me también quede protegido.

// Expediente ─────────────────────────────────────────────────────────────

app.get('/api/expediente', async (_request, response, next) => {
  try {
    response.json(await getExpedienteData())
  } catch (error) { next(error) }
})

// Pacientes ──────────────────────────────────────────────────────────────

app.post('/api/pacientes', async (request, response, next) => {
  try {
    const paciente = await createPaciente(request.body)
    logAudit({ username: request.user.username, action: 'create_paciente', entityType: 'paciente', entityId: paciente.id, ip: request.ip, userAgent: request.headers['user-agent'] }).catch(() => {})
    response.status(201).json(paciente)
  } catch (error) { next(error) }
})

app.put('/api/pacientes/:id', async (request, response, next) => {
  try {
    const paciente = await updatePaciente(request.params.id, request.body)
    logAudit({ username: request.user.username, action: 'update_paciente', entityType: 'paciente', entityId: request.params.id, ip: request.ip, userAgent: request.headers['user-agent'] }).catch(() => {})
    response.json(paciente)
  } catch (error) { next(error) }
})

app.delete('/api/pacientes/:id', async (request, response, next) => {
  try {
    await deletePaciente(request.params.id)
    logAudit({ username: request.user.username, action: 'delete_paciente', entityType: 'paciente', entityId: request.params.id, ip: request.ip, userAgent: request.headers['user-agent'] }).catch(() => {})
    response.status(204).send()
  } catch (error) { next(error) }
})

// Resultados de pruebas ───────────────────────────────────────────────────

app.post('/api/resultados-pruebas', handleSingleUpload('archivo'), async (request, response, next) => {
  try {
    const resultado = await createResultadoPrueba(request.body, request.file)
    logAudit({ username: request.user.username, action: 'create_resultado_prueba', entityType: 'resultado_prueba', entityId: resultado.id, ip: request.ip, userAgent: request.headers['user-agent'] }).catch(() => {})
    response.status(201).json(resultado)
  } catch (error) { next(error) }
})

app.put('/api/resultados-pruebas/:id', handleSingleUpload('archivo'), async (request, response, next) => {
  try {
    const resultado = await updateResultadoPrueba(request.params.id, request.body, request.file)
    logAudit({ username: request.user.username, action: 'update_resultado_prueba', entityType: 'resultado_prueba', entityId: request.params.id, ip: request.ip, userAgent: request.headers['user-agent'] }).catch(() => {})
    response.json(resultado)
  } catch (error) { next(error) }
})

app.delete('/api/resultados-pruebas/:id', async (request, response, next) => {
  try {
    await deleteResultadoPrueba(request.params.id)
    logAudit({ username: request.user.username, action: 'delete_resultado_prueba', entityType: 'resultado_prueba', entityId: request.params.id, ip: request.ip, userAgent: request.headers['user-agent'] }).catch(() => {})
    response.status(204).send()
  } catch (error) { next(error) }
})

app.get('/api/resultados-pruebas/:id/archivo', async (request, response, next) => {
  try {
    const file = await getResultadoPruebaAttachment(request.params.id)
    response.setHeader('Content-Type', file.mimeType)
    response.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`)
    response.send(file.data)
  } catch (error) { next(error) }
})

// Resultados de laboratorio ──────────────────────────────────────────────

app.post('/api/resultados-laboratorio', handleSingleUpload('archivo'), async (request, response, next) => {
  try {
    const resultado = await createResultadoLaboratorio(request.body, request.file)
    logAudit({ username: request.user.username, action: 'create_resultado_laboratorio', entityType: 'resultado_laboratorio', entityId: resultado.id, ip: request.ip, userAgent: request.headers['user-agent'] }).catch(() => {})
    response.status(201).json(resultado)
  } catch (error) { next(error) }
})

app.put('/api/resultados-laboratorio/:id', handleSingleUpload('archivo'), async (request, response, next) => {
  try {
    const resultado = await updateResultadoLaboratorio(request.params.id, request.body, request.file)
    logAudit({ username: request.user.username, action: 'update_resultado_laboratorio', entityType: 'resultado_laboratorio', entityId: request.params.id, ip: request.ip, userAgent: request.headers['user-agent'] }).catch(() => {})
    response.json(resultado)
  } catch (error) { next(error) }
})

app.delete('/api/resultados-laboratorio/:id', async (request, response, next) => {
  try {
    await deleteResultadoLaboratorio(request.params.id)
    logAudit({ username: request.user.username, action: 'delete_resultado_laboratorio', entityType: 'resultado_laboratorio', entityId: request.params.id, ip: request.ip, userAgent: request.headers['user-agent'] }).catch(() => {})
    response.status(204).send()
  } catch (error) { next(error) }
})

app.get('/api/resultados-laboratorio/:id/archivo', async (request, response, next) => {
  try {
    const file = await getResultadoLaboratorioAttachment(request.params.id)
    response.setHeader('Content-Type', file.mimeType)
    response.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`)
    response.send(file.data)
  } catch (error) { next(error) }
})

// Citas ──────────────────────────────────────────────────────────────────

app.post('/api/citas', async (request, response, next) => {
  try {
    const cita = await createCita(request.body)
    logAudit({ username: request.user.username, action: 'create_cita', entityType: 'cita', entityId: cita.id, ip: request.ip, userAgent: request.headers['user-agent'] }).catch(() => {})
    response.status(201).json(cita)
  } catch (error) { next(error) }
})

app.put('/api/citas/:id', async (request, response, next) => {
  try {
    const cita = await updateCita(request.params.id, request.body)
    logAudit({ username: request.user.username, action: 'update_cita', entityType: 'cita', entityId: request.params.id, ip: request.ip, userAgent: request.headers['user-agent'] }).catch(() => {})
    response.json(cita)
  } catch (error) { next(error) }
})

app.delete('/api/citas/:id', async (request, response, next) => {
  try {
    await deleteCita(request.params.id)
    logAudit({ username: request.user.username, action: 'delete_cita', entityType: 'cita', entityId: request.params.id, ip: request.ip, userAgent: request.headers['user-agent'] }).catch(() => {})
    response.status(204).send()
  } catch (error) { next(error) }
})

// Google Calendar (requiere auth) ────────────────────────────────────────

app.get('/api/google/status', async (_request, response, next) => {
  try { response.json(await getGoogleStatus()) } catch (error) { next(error) }
})

app.get('/api/google/auth-url', (_request, response, next) => {
  try { response.json({ url: buildGoogleAuthUrl() }) } catch (error) { next(error) }
})

app.get('/api/google/calendars', async (_request, response, next) => {
  try { response.json({ items: await listCalendars() }) } catch (error) { next(error) }
})

app.post('/api/google/calendar/events', async (request, response, next) => {
  try {
    const event = await createCalendarEvent(request.body)
    response.status(201).json(event)
  } catch (error) { next(error) }
})

// ─── Global error handler ──────────────────────────────────────────────────
app.use((error, _request, response, _next) => {
  const status = Number(error?.status || 500)
  response.status(status).json({
    ok: false,
    message: error?.message || 'Error interno del servidor.',
    details: error?.details || null,
  })
})

app.listen(env.port, () => {
  console.log(`Backend local activo en http://localhost:${env.port}`)
})
