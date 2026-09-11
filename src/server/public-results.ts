import { PlayerRole, PublicRoleReveal } from '../game/types'

export function createPublicRoleReveal(
  playerId: string,
  playerName: string,
  role: PlayerRole
): PublicRoleReveal {
  return { playerId: playerId.trim().toLowerCase(), playerName, role }
}
