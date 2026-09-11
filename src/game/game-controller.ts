import { PHASE_DURATION_SECONDS } from '../config/constants'
import { GamePhase } from './types'

const NEXT_PHASE: Readonly<Partial<Record<GamePhase, GamePhase>>> = {
  [GamePhase.STARTING]: GamePhase.ROLE_REVEAL,
  [GamePhase.ROLE_REVEAL]: GamePhase.NIGHT_ACTION,
  [GamePhase.MORNING]: GamePhase.DISCUSSION,
  [GamePhase.DISCUSSION]: GamePhase.VOTING
}

export interface PhaseTransition {
  from: GamePhase
  to: GamePhase
}

export class GameController {
  private phaseValue = GamePhase.BOOT
  private phaseEndsAtValue = 0
  private matchCounterValue = 0

  get phase(): GamePhase {
    return this.phaseValue
  }

  get phaseEndsAt(): number {
    return this.phaseEndsAtValue
  }

  get matchCounter(): number {
    return this.matchCounterValue
  }

  start(now: number): PhaseTransition {
    return this.enter(GamePhase.LOBBY, now)
  }

  transitionTo(next: GamePhase, now: number): PhaseTransition {
    return this.enter(next, now)
  }

  resetToLobby(now: number): PhaseTransition {
    return this.enter(GamePhase.LOBBY, now)
  }

  tick(now: number, lobbyCanStart: boolean): PhaseTransition | null {
    if (this.phaseValue === GamePhase.BOOT) return this.enter(GamePhase.LOBBY, now)

    if (this.phaseValue === GamePhase.LOBBY) {
      return lobbyCanStart ? this.enter(GamePhase.STARTING, now) : null
    }

    if (this.phaseValue === GamePhase.STARTING && !lobbyCanStart) {
      return this.enter(GamePhase.LOBBY, now)
    }

    if (this.phaseEndsAtValue === 0 || now < this.phaseEndsAtValue) return null
    const next = NEXT_PHASE[this.phaseValue]
    return next ? this.enter(next, now) : null
  }

  private enter(next: GamePhase, now: number): PhaseTransition {
    const previous = this.phaseValue
    this.phaseValue = next
    const duration = PHASE_DURATION_SECONDS[next]
    this.phaseEndsAtValue = duration > 0 ? now + duration * 1_000 : 0
    if (next === GamePhase.STARTING) this.matchCounterValue += 1
    return { from: previous, to: next }
  }
}
