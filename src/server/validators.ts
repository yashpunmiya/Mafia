const MAX_DISPLAY_NAME_LENGTH = 24
const MAX_NONCE_LENGTH = 80

export function normalizePlayerId(value: string): string {
  return value.trim().toLowerCase()
}

export function sanitizeDisplayName(value: string, fallback: string): string {
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_DISPLAY_NAME_LENGTH)
  return clean || fallback
}

export function isValidNonce(value: string): boolean {
  return value.length > 0 && value.length <= MAX_NONCE_LENGTH && /^[a-zA-Z0-9:_-]+$/.test(value)
}
