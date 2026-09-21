import { pool } from '../db/pool.js'

/**
 * Registra una entrada en audit_log.
 * Siempre es best-effort: los errores se loggean a consola pero nunca
 * interrumpen el flujo principal de la aplicación.
 *
 * @param {object} entry
 * @param {string} entry.username   - Usuario que realizó la acción
 * @param {string} entry.action     - Nombre de la acción (e.g. 'login', 'create_paciente')
 * @param {string} [entry.entityType] - Tipo de entidad afectada (e.g. 'paciente')
 * @param {string} [entry.entityId]   - ID de la entidad afectada
 * @param {string} [entry.ip]         - Dirección IP del cliente
 * @param {string} [entry.userAgent]  - User-Agent del cliente
 */
export async function logAudit({ username, action, entityType, entityId, ip, userAgent }) {
  try {
    await pool.query(
      `insert into audit_log (username, action, entity_type, entity_id, ip_address, user_agent)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        username ?? 'unknown',
        action,
        entityType ?? null,
        entityId ?? null,
        ip ?? null,
        userAgent ?? null,
      ],
    )
  } catch (error) {
    console.error('[audit] Error al registrar en audit_log:', error.message)
  }
}
