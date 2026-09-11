import { getPlayer } from '@dcl/sdk/players'

export interface LocalPlayerSummary {
  id: string
  name: string
}

export function getLocalPlayerSummary(): LocalPlayerSummary | null {
  const player = getPlayer()
  if (!player) return null
  return { id: player.userId.toLowerCase(), name: player.name }
}
