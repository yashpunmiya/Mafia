import { engine } from '@dcl/sdk/ecs'
import { getClientViewState } from '../multiplayer/client-network'
import { GamePhase } from '../game/types'
import { applyPhaseVisuals } from './phase-visuals'
import { setupSeating } from './seating'
import { applyGameplayMovementLock, setupMobileControls } from './mobile-controls'

const REQUIRED_COMPOSITE_ENTITIES = ['Council Floor', 'Council Table', 'Council Flame', 'Lobby Marker'] as const

export function setupEnvironment(): void {
  setupMobileControls()
  setupSeating()
  for (const name of REQUIRED_COMPOSITE_ENTITIES) {
    if (!engine.getEntityOrNullByName(name)) console.error(`[CLIENT] Missing composite entity: ${name}`)
  }

  let lastPhase: GamePhase | null = null
  let movementLocked: boolean | null = null
  engine.addSystem(() => {
    const view = getClientViewState()
    const phase = view.phase
    const local = view.players.find(player => player.id === view.localPlayerId)
    const activeRound = phase !== GamePhase.BOOT && phase !== GamePhase.LOBBY && phase !== GamePhase.GAME_OVER
    const shouldLock = activeRound && local?.status === 'PLAYER' && local.alive && local.matchParticipant
    if (shouldLock !== movementLocked) {
      movementLocked = shouldLock
      applyGameplayMovementLock(shouldLock)
    }
    if (phase === lastPhase) return
    lastPhase = phase
    applyPhaseVisuals(phase)
  })
}
