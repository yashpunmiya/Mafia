import { GamePhase } from '../game/types'

export const MIN_PLAYERS = 4
export const MAX_PLAYERS = 5
export const DEBUG_MODE = false

export const NETWORK_TICK_SECONDS = 0.25
export const PLAYER_SCAN_SECONDS = 0.5
export const HEARTBEAT_INTERVAL_MS = 2_000
export const HEARTBEAT_FRESHNESS_MS = 6_500

export const PHASE_DURATION_SECONDS: Readonly<Record<GamePhase, number>> = {
  [GamePhase.BOOT]: 0,
  [GamePhase.LOBBY]: 0,
  [GamePhase.STARTING]: 3,
  [GamePhase.ROLE_REVEAL]: 7,
  [GamePhase.NIGHT_ACTION]: 30,
  [GamePhase.MORNING]: 6,
  [GamePhase.DISCUSSION]: 45,
  [GamePhase.VOTING]: 15,
  [GamePhase.RUNOFF_VOTING]: 10,
  [GamePhase.ELIMINATION]: 6,
  [GamePhase.GAME_OVER]: 0
}
