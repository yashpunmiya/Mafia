import { DEBUG_MODE } from './constants'

export function debugLog(message: string): void {
  if (DEBUG_MODE) console.log(`[DEBUG] ${message}`)
}
