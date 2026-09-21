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
 *
 * En producción el frontend y el backend viven en dominios distintos
 * (Vercel vs Render), por lo que la cookie debe ser SameSite=None + Secure
 * para que el navegador la envíe en peticiones cross-site.
 * En desarrollo (mismo origen, HTTP) se usa SameSite=Lax sin Secure.
 */
export function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProduction,              // HTTPS obligatorio en producción
    sameSite: isProduction ? 'none' : 'lax', // 'none' permite cross-site en prod
    maxAge: 8 * 60 * 60 * 1000,       // 8 horas en ms
    path: '/',
  }
}
