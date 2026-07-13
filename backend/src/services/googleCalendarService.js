import fs from 'node:fs/promises'
import path from 'node:path'
import { google } from 'googleapis'
import { env, ensureConfigured } from '../config/env.js'

function createOAuthClient() {
  ensureConfigured(
    [env.google.clientId, env.google.clientSecret, env.google.redirectUri],
    'Faltan variables de Google Calendar en backend/.env',
  )

  return new google.auth.OAuth2(
    env.google.clientId,
    env.google.clientSecret,
    env.google.redirectUri,
  )
}

async function readStoredTokens() {
  try {
    const content = await fs.readFile(env.tokenFilePath, 'utf8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function saveTokens(tokens) {
  await fs.mkdir(path.dirname(env.tokenFilePath), { recursive: true })
  await fs.writeFile(env.tokenFilePath, JSON.stringify(tokens, null, 2), 'utf8')
}

async function getAuthorizedClient() {
  const client = createOAuthClient()
  const tokens = await readStoredTokens()

  if (!tokens) {
    const error = new Error('Google Calendar aún no está autenticado. Abre /api/google/auth-url primero.')
    error.status = 401
    throw error
  }

  client.setCredentials(tokens)

  client.on('tokens', async newTokens => {
    if (Object.keys(newTokens).length === 0) return
    const currentTokens = (await readStoredTokens()) ?? {}
    await saveTokens({ ...currentTokens, ...newTokens })
  })

  return client
}

export async function getGoogleStatus() {
  const tokens = await readStoredTokens()
  return {
    configured: Boolean(env.google.clientId && env.google.clientSecret && env.google.redirectUri),
    authenticated: Boolean(tokens?.refresh_token || tokens?.access_token),
    redirectUri: env.google.redirectUri,
    calendarId: env.google.calendarId,
  }
}

export function buildGoogleAuthUrl() {
  const client = createOAuthClient()

  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
  })
}

export async function exchangeGoogleCode(code) {
  const client = createOAuthClient()
  const { tokens } = await client.getToken(code)
  await saveTokens(tokens)
  return tokens
}

export async function listCalendars() {
  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })
  const response = await calendar.calendarList.list()

  return (response.data.items ?? []).map(item => ({
    id: item.id,
    summary: item.summary,
    primary: Boolean(item.primary),
    timeZone: item.timeZone,
  }))
}

export async function createCalendarEvent({
  summary,
  description = '',
  start,
  end,
  timeZone = 'America/Costa_Rica',
  attendees = [],
}) {
  ensureConfigured([summary, start, end], 'Para crear un evento debes enviar summary, start y end.')

  const auth = await getAuthorizedClient()
  const calendar = google.calendar({ version: 'v3', auth })
  const response = await calendar.events.insert({
    calendarId: env.google.calendarId,
    requestBody: {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone,
      },
      end: {
        dateTime: end,
        timeZone,
      },
      attendees: attendees.map(email => ({ email })),
    },
  })

  return {
    id: response.data.id,
    htmlLink: response.data.htmlLink,
    status: response.data.status,
    summary: response.data.summary,
  }
}
