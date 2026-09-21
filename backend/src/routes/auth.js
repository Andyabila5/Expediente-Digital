import { Router } from 'express'
import { verifyCredentials } from '../services/authService.js'
import { requireAuth, cookieOptions } from '../middleware/requireAuth.js'
import { logAudit } from '../services/auditService.js'

const router = Router()

// POST /api/auth/login — pública, no requiere sesión
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

// POST /api/auth/logout — requiere sesión válida
router.post('/logout', requireAuth, (request, response) => {
  response.clearCookie('auth_token', cookieOptions())

  logAudit({
    username: request.user.username,
    action: 'logout',
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  }).catch(() => {})

  response.json({ ok: true })
})

// GET /api/auth/me — requiere sesión válida
router.get('/me', requireAuth, (request, response) => {
  response.json({ ok: true, username: request.user.username })
})

export default router
