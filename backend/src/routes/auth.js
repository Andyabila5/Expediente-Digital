import { Router } from 'express'
import { verifyCredentials } from '../services/authService.js'
import { cookieOptions } from '../middleware/requireAuth.js'
import { logAudit } from '../services/auditService.js'

const router = Router()

// POST /api/auth/login
router.post('/login', async (request, response, next) => {
  try {
    const { username, password } = request.body ?? {}
    const { token, username: resolvedUsername } = await verifyCredentials(username, password)

    response.cookie('auth_token', token, cookieOptions())

    await logAudit({
      username: resolvedUsername,
      action: 'login',
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    })

    response.json({ ok: true, username: resolvedUsername })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/logout
router.post('/logout', (request, response) => {
  const username = request.user?.username ?? request.cookies?.auth_token ?? 'unknown'

  response.clearCookie('auth_token', cookieOptions())

  // Registrar logout de manera best-effort (no bloquea la respuesta si falla)
  logAudit({
    username,
    action: 'logout',
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  }).catch(() => {})

  response.json({ ok: true })
})

// GET /api/auth/me — permite al frontend validar la sesión al arrancar
router.get('/me', (request, response) => {
  // requireAuth ya habrá corrido antes de llegar aquí (aplicado en index.js)
  response.json({ ok: true, username: request.user.username })
})

export default router
