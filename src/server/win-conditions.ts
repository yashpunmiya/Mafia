import { PlayerRole, WinnerTeam } from '../game/types'

export function computeWinner(
  livingPlayerIds: readonly string[],
  rolesByPlayerId: ReadonlyMap<string, PlayerRole>
): WinnerTeam {
  let livingMafia = 0
  let livingNonMafia = 0
  for (const playerId of livingPlayerIds) {
    const role = rolesByPlayerId.get(playerId.trim().toLowerCase())
    if (!role) continue
    if (role === PlayerRole.MAFIA) livingMafia += 1
    else livingNonMafia += 1
  }
  if (livingMafia === 0) return WinnerTeam.VILLAGE
  if (livingMafia >= livingNonMafia) return WinnerTeam.MAFIA
  return WinnerTeam.NONE
}
