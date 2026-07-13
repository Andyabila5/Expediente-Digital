import { env, ensureConfigured } from '../config/env.js'
import { requirePhoneNumber } from '../utils/phoneNumber.js'

const HELLO_WORLD_TEMPLATE = {
  name: 'hello_world',
  language: { code: 'en_US' },
}

function getWhatsAppApiUrl() {
  ensureConfigured(
    [env.whatsapp.apiVersion, env.whatsapp.phoneNumberId, env.whatsapp.accessToken],
    'Faltan variables de WhatsApp Cloud API en backend/.env',
  )

  return `https://graph.facebook.com/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}/messages`
}

async function callWhatsAppApi(payload) {
  const response = await fetch(getWhatsAppApiUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.whatsapp.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data?.error?.message || 'Error enviando mensaje de WhatsApp.')
    error.status = response.status
    error.details = data
    throw error
  }

  return data
}

async function verifyWhatsAppToken() {
  const url = `https://graph.facebook.com/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}?fields=display_phone_number,verified_name`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.whatsapp.accessToken}`,
    },
  })

  if (!response.ok) {
    return { valid: false }
  }

  const data = await response.json()
  return {
    valid: true,
    displayPhoneNumber: data.display_phone_number ?? null,
    verifiedName: data.verified_name ?? null,
  }
}

export async function getWhatsAppStatus() {
  const configured = Boolean(
    env.whatsapp.apiVersion && env.whatsapp.phoneNumberId && env.whatsapp.accessToken,
  )

  const status = {
    configured,
    hasTestRecipient: Boolean(env.whatsapp.testRecipient),
    testRecipient: env.whatsapp.testRecipient || null,
    testTemplate: HELLO_WORLD_TEMPLATE.name,
    phoneNumberId: env.whatsapp.phoneNumberId || null,
    businessAccountId: env.whatsapp.businessAccountId || null,
    tokenValid: null,
    displayPhoneNumber: null,
    verifiedName: null,
  }

  if (!configured) {
    return status
  }

  const verification = await verifyWhatsAppToken()
  return {
    ...status,
    tokenValid: verification.valid,
    displayPhoneNumber: verification.displayPhoneNumber,
    verifiedName: verification.verifiedName,
  }
}

export async function sendHelloWorldTest({ to = env.whatsapp.testRecipient } = {}) {
  const recipient = requirePhoneNumber(to)

  return callWhatsAppApi({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'template',
    template: HELLO_WORLD_TEMPLATE,
  })
}

export async function sendAppointmentReminder({
  to = env.whatsapp.testRecipient,
  patientName,
  appointmentDate,
  clinicName = 'Expediente Digital',
} = {}) {
  ensureConfigured(
    [patientName, appointmentDate],
    'Para enviar recordatorio debes indicar "patientName" y "appointmentDate".',
  )

  const recipient = requirePhoneNumber(to)
  const body =
    `Hola ${patientName}, este es un recordatorio de tu cita programada para ${appointmentDate}. ` +
    `Si necesitas reprogramarla, responde a este mensaje. ${clinicName}`

  return callWhatsAppApi({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: {
      preview_url: false,
      body,
    },
  })
}
