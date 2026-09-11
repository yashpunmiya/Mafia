import { GamePhase, PublicPlayer } from '../game/types'

/** Keep dead/disconnected match participants in roster order: survivors never swap chairs. */
export function councilSeatIndex(players: readonly PublicPlayer[], localId: string, phase: GamePhase): number {
  if (phase === GamePhase.GAME_OVER) return -1
  const roster = players.filter(p => phase === GamePhase.LOBBY ? p.status === 'PLAYER' : p.matchParticipant)
  const index = roster.findIndex(p => p.id === localId)
  const player = roster[index]
  return index >= 0 && index < 5 && player.alive && player.connected && player.status === 'PLAYER' ? index : -1
}
