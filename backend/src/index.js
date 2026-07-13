import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { env } from './config/env.js'
import { checkDatabaseConnection } from './db/pool.js'
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
import {
  getWhatsAppStatus,
  sendAppointmentReminder,
  sendHelloWorldTest,
} from './services/whatsappService.js'

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
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

app.use(
  cors({
    origin: env.frontendUrl,
  }),
)
app.use(express.json())

function handleSingleUpload(fieldName) {
  return (request, response, next) => {
    upload.single(fieldName)(request, response, error => {
      if (!error) {
        next()
        return
      }

      if (error instanceof multer.MulterError) {
        error.status = 400
        if (error.code === 'LIMIT_FILE_SIZE') {
          error.message = 'El archivo excede el límite de 10 MB.'
        }
      }

      next(error)
    })
  }
}

app.get('/api/health', async (_request, response, next) => {
  try {
    const database = await checkDatabaseConnection()
    response.json({
      ok: true,
      service: 'expediente-digital-backend',
      frontendUrl: env.frontendUrl,
      database,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/expediente', async (_request, response, next) => {
  try {
    response.json(await getExpedienteData())
  } catch (error) {
    next(error)
  }
})

app.post('/api/pacientes', async (request, response, next) => {
  try {
    response.status(201).json(await createPaciente(request.body))
  } catch (error) {
    next(error)
  }
})

app.put('/api/pacientes/:id', async (request, response, next) => {
  try {
    response.json(await updatePaciente(request.params.id, request.body))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/pacientes/:id', async (request, response, next) => {
  try {
    await deletePaciente(request.params.id)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.post('/api/resultados-pruebas', handleSingleUpload('archivo'), async (request, response, next) => {
  try {
    response.status(201).json(await createResultadoPrueba(request.body, request.file))
  } catch (error) {
    next(error)
  }
})

app.put('/api/resultados-pruebas/:id', handleSingleUpload('archivo'), async (request, response, next) => {
  try {
    response.json(await updateResultadoPrueba(request.params.id, request.body, request.file))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/resultados-pruebas/:id', async (request, response, next) => {
  try {
    await deleteResultadoPrueba(request.params.id)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/resultados-pruebas/:id/archivo', async (request, response, next) => {
  try {
    const file = await getResultadoPruebaAttachment(request.params.id)
    response.setHeader('Content-Type', file.mimeType)
    response.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`)
    response.send(file.data)
  } catch (error) {
    next(error)
  }
})

app.post('/api/resultados-laboratorio', handleSingleUpload('archivo'), async (request, response, next) => {
  try {
    response.status(201).json(await createResultadoLaboratorio(request.body, request.file))
  } catch (error) {
    next(error)
  }
})

app.put(
  '/api/resultados-laboratorio/:id',
  handleSingleUpload('archivo'),
  async (request, response, next) => {
    try {
      response.json(await updateResultadoLaboratorio(request.params.id, request.body, request.file))
    } catch (error) {
      next(error)
    }
  },
)

app.delete('/api/resultados-laboratorio/:id', async (request, response, next) => {
  try {
    await deleteResultadoLaboratorio(request.params.id)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/resultados-laboratorio/:id/archivo', async (request, response, next) => {
  try {
    const file = await getResultadoLaboratorioAttachment(request.params.id)
    response.setHeader('Content-Type', file.mimeType)
    response.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`)
    response.send(file.data)
  } catch (error) {
    next(error)
  }
})

app.post('/api/citas', async (request, response, next) => {
  try {
    response.status(201).json(await createCita(request.body))
  } catch (error) {
    next(error)
  }
})

app.put('/api/citas/:id', async (request, response, next) => {
  try {
    response.json(await updateCita(request.params.id, request.body))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/citas/:id', async (request, response, next) => {
  try {
    await deleteCita(request.params.id)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.get('/api/google/status', async (_request, response, next) => {
  try {
    response.json(await getGoogleStatus())
  } catch (error) {
    next(error)
  }
})

app.get('/api/google/auth-url', (_request, response, next) => {
  try {
    response.json({ url: buildGoogleAuthUrl() })
  } catch (error) {
    next(error)
  }
})

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
  } catch (error) {
    next(error)
  }
})

app.get('/api/google/calendars', async (_request, response, next) => {
  try {
    response.json({ items: await listCalendars() })
  } catch (error) {
    next(error)
  }
})

app.post('/api/google/calendar/events', async (request, response, next) => {
  try {
    const event = await createCalendarEvent(request.body)
    response.status(201).json(event)
  } catch (error) {
    next(error)
  }
})

app.get('/api/whatsapp/status', async (_request, response, next) => {
  try {
    response.json(await getWhatsAppStatus())
  } catch (error) {
    next(error)
  }
})

app.post('/api/whatsapp/messages/test', async (request, response, next) => {
  try {
    const data = await sendHelloWorldTest(request.body)
    response.status(201).json(data)
  } catch (error) {
    next(error)
  }
})

app.post('/api/whatsapp/messages/reminder', async (request, response, next) => {
  try {
    const data = await sendAppointmentReminder(request.body)
    response.status(201).json(data)
  } catch (error) {
    next(error)
  }
})

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
