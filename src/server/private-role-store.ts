import { MAX_PLAYERS, MIN_PLAYERS } from '../config/constants'
import { PlayerRole } from '../game/types'

type RandomSource = () => number

const CORE_ROLES: readonly PlayerRole[] = [PlayerRole.MAFIA, PlayerRole.DOCTOR, PlayerRole.DETECTIVE]

export class PrivateRoleStore {
  private readonly rolesByPlayerId = new Map<string, PlayerRole>()

  assignToParticipants(participantIds: readonly string[], random: RandomSource = Math.random): ReadonlyMap<string, PlayerRole> {
    if (participantIds.length < MIN_PLAYERS || participantIds.length > MAX_PLAYERS) {
      throw new Error(`Role assignment requires exactly ${MIN_PLAYERS} or ${MAX_PLAYERS} active participants.`)
    }

    const normalizedIds = participantIds.map(normalizeIdentity)
    if (normalizedIds.some((id) => !id)) throw new Error('Role assignment received an empty player identity.')
    if (new Set(normalizedIds).size !== normalizedIds.length) {
      throw new Error('Role assignment received a duplicate player identity.')
    }

    const deck = [
      ...CORE_ROLES,
      ...Array.from({ length: participantIds.length - CORE_ROLES.length }, () => PlayerRole.VILLAGER)
    ]
    shuffleInPlace(deck, random)

    this.rolesByPlayerId.clear()
    normalizedIds.forEach((playerId, index) => this.rolesByPlayerId.set(playerId, deck[index]))
    return new Map(this.rolesByPlayerId)
  }

  get(playerId: string): PlayerRole | null {
    return this.rolesByPlayerId.get(normalizeIdentity(playerId)) ?? null
  }

  copyAssignmentsForServer(): ReadonlyMap<string, PlayerRole> {
    return new Map(this.rolesByPlayerId)
  }

  clear(): void {
    this.rolesByPlayerId.clear()
  }

  get size(): number {
    return this.rolesByPlayerId.size
  }
}

function normalizeIdentity(value: string): string {
  return value.trim().toLowerCase()
}

function shuffleInPlace<T>(values: T[], random: RandomSource): void {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const sample = random()
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new Error('Random source must return a value from 0 (inclusive) to 1 (exclusive).')
    }
    const swapIndex = Math.floor(sample * (index + 1))
    const current = values[index]
    values[index] = values[swapIndex]
    values[swapIndex] = current
  }
}
