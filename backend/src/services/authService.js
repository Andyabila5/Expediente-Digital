import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db/pool.js'
import { env } from '../config/env.js'

const JWT_EXPIRY = '8h' // sesión expira en 8 horas

/**
 * Verifica credenciales y devuelve un JWT firmado.
 * Lanza un error HTTP 401 si el usuario no existe o la contraseña es incorrecta.
 */
export async function verifyCredentials(username, password) {
  if (!username || !password) {
    const error = new Error('Usuario y contraseña son obligatorios.')
    error.status = 400
    throw error
  }

  const result = await pool.query(
    'select id, username, password_hash from users where username = $1 limit 1',
    [username.trim().toLowerCase()],
  )

  const user = result.rows[0]

  // Comparación en tiempo constante: ejecuta bcrypt.compare incluso si el
  // usuario no existe para evitar timing attacks.
  const hashToCheck = user?.password_hash ?? '$2a$12$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXX'
  const match = await bcrypt.compare(password, hashToCheck)

  if (!user || !match) {
    const error = new Error('Usuario o contraseña incorrectos.')
    error.status = 401
    throw error
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username },
    env.jwtSecret,
    { expiresIn: JWT_EXPIRY },
  )

  return { token, username: user.username }
}

/**
 * Verifica un JWT y devuelve el payload.
 * Lanza un error HTTP 401 si el token es inválido o expiró.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret)
  } catch {
    const error = new Error('Sesión inválida o expirada. Vuelve a iniciar sesión.')
    error.status = 401
    throw error
  }
}

/**
 * Genera un hash bcrypt para una contraseña.
 * Útil para el seed inicial de la tabla users.
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}
