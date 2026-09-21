import { verifyToken } from '../services/authService.js'

/**
 * Middleware que valida el JWT almacenado en la cookie HttpOnly `auth_token`.
 * Si el token es válido, adjunta el payload a `request.user` y continúa.
 * Si no, responde con 401.
 */
export function requireAuth(request, response, next) {
  const token = request.cookies?.auth_token

  if (!token) {
    return response.status(401).json({
      ok: false,
      message: 'No autenticado. Inicia sesión para continuar.',
    })
  }

  try {
    request.user = verifyToken(token)
    next()
  } catch (error) {
    // Token expirado o inválido → limpiar la cookie antes de responder
    response.clearCookie('auth_token', cookieOptions())
    next(error)
  }
}

/**
 * Opciones de cookie compartidas entre login y logout.
 */
export function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,          // no accesible desde JavaScript
    secure: isProduction,    // solo HTTPS en producción
    sameSite: 'strict',      // bloquea CSRF cross-site
    maxAge: 8 * 60 * 60 * 1000, // 8 horas en ms (debe coincidir con JWT_EXPIRY)
    path: '/',
  }
}
