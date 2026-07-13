const DEFAULT_COUNTRY_CODE = '506'

export function normalizePhoneNumber(raw, countryCode = DEFAULT_COUNTRY_CODE) {
  const digits = String(raw ?? '').replace(/\D/g, '')

  if (!digits) return null

  if (digits.startsWith(countryCode) && digits.length === countryCode.length + 8) {
    return digits
  }

  if (digits.length === 8) {
    return `${countryCode}${digits}`
  }

  if (digits.length >= 10) {
    return digits
  }

  return null
}

export function requirePhoneNumber(raw, countryCode = DEFAULT_COUNTRY_CODE) {
  const normalized = normalizePhoneNumber(raw, countryCode)

  if (!normalized) {
    const error = new Error(
      'Número de teléfono inválido. Usa formato internacional sin "+", por ejemplo 50684448047.',
    )
    error.status = 400
    throw error
  }

  return normalized
}
