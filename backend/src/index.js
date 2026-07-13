import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import {
  buildGoogleAuthUrl,
  createCalendarEvent,
  exchangeGoogleCode,
  getGoogleStatus,
  listCalendars,
} from './services/googleCalendarService.js'
import {
  getWhatsAppStatus,
  sendAppointmentReminder,
  sendHelloWorldTest,
} from './services/whatsappService.js'

const app = express()

app.use(
  cors({
    origin: env.frontendUrl,
  }),
)
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'expediente-digital-backend',
    frontendUrl: env.frontendUrl,
  })
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
