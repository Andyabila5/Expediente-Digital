import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendRoot = path.resolve(__dirname, '..', '..')

dotenv.config({ path: path.join(backendRoot, '.env') })

function getEnv(name, fallback = '') {
  return process.env[name]?.trim() || fallback
}

function getBooleanEnv(name, fallback = false) {
  const value = getEnv(name, fallback ? 'true' : 'false').toLowerCase()
  return ['1', 'true', 'yes', 'on'].includes(value)
}

export const env = {
  port: Number(getEnv('BACKEND_PORT', '3001')),
  frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:5173'),
  database: {
    url: getEnv('DATABASE_URL', getEnv('SUPABASE_DB_URL')),
    ssl: getBooleanEnv('DATABASE_SSL', true),
  },
  google: {
    clientId: getEnv('GOOGLE_CLIENT_ID'),
    clientSecret: getEnv('GOOGLE_CLIENT_SECRET'),
    redirectUri: getEnv('GOOGLE_REDIRECT_URI', 'http://localhost:3001/api/google/oauth/callback'),
    calendarId: getEnv('GOOGLE_CALENDAR_ID', 'primary'),
  },
  whatsapp: {
    apiVersion: getEnv('WHATSAPP_API_VERSION', 'v23.0'),
    accessToken: getEnv('WHATSAPP_ACCESS_TOKEN'),
    phoneNumberId: getEnv('WHATSAPP_PHONE_NUMBER_ID'),
    businessAccountId: getEnv('WHATSAPP_BUSINESS_ACCOUNT_ID'),
    testRecipient: getEnv('WHATSAPP_TEST_RECIPIENT'),
  },
  tokenFilePath: path.join(backendRoot, '.tokens', 'google-oauth.json'),
}

export function ensureConfigured(values, message) {
  const missing = values.filter(value => !value)
  if (missing.length > 0) {
    const error = new Error(message)
    error.status = 400
    throw error
  }
}
