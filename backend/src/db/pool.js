import pg from 'pg'
import { env, ensureConfigured } from '../config/env.js'

const { Pool, types } = pg
types.setTypeParser(1114, (value) => `${value.replace(' ', 'T')}Z`)
types.setTypeParser(1184, (value) => new Date(value).toISOString())

ensureConfigured(
  [env.database.url],
  'Falta DATABASE_URL o SUPABASE_DB_URL en backend/.env para conectar con Postgres.',
)

export const pool = new Pool({
  connectionString: env.database.url,
  ssl: env.database.ssl ? { rejectUnauthorized: false } : false,
})

export async function checkDatabaseConnection() {
  const result = await pool.query('select now() as server_time')
  return {
    connected: true,
    serverTime: result.rows[0]?.server_time ?? null,
  }
}