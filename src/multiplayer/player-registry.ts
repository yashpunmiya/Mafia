import { AvatarBase, engine, PlayerIdentityData } from '@dcl/sdk/ecs'
import { MAX_PLAYERS, MIN_PLAYERS } from '../config/constants'
import { classifyLobbyRoster } from '../game/roster'
import { GamePhase, PublicPlayer } from '../game/types'
import { normalizePlayerId, sanitizeDisplayName } from '../server/validators'

interface ServerPlayerRecord {
  id: string
  name: string
  ready: boolean
  connected: boolean
  alive: boolean
  joinedOrder: number
}

export class PlayerRegistry {
  private readonly records = new Map<string, ServerPlayerRecord>()
  private lockedParticipantIds = new Set<string>()
  private nextJoinedOrder = 0

  scan(phase: GamePhase): void {
    const seen = new Set<string>()

    for (const [entity, identity] of engine.getEntitiesWith(PlayerIdentityData)) {
      const id = normalizePlayerId(identity.address)
      if (!id) continue
      seen.add(id)
      const avatarName = AvatarBase.getOrNull(entity)?.name ?? ''
      const existing = this.records.get(id)
      if (existing) {
        existing.connected = true
        existing.name = sanitizeDisplayName(avatarName, existing.name)
      } else {
        this.nextJoinedOrder += 1
        this.records.set(id, {
          id,
          name: sanitizeDisplayName(avatarName, `Player ${this.nextJoinedOrder}`),
          ready: false,
          connected: true,
          alive: true,
          joinedOrder: this.nextJoinedOrder
        })
      }
    }

    for (const [id, record] of this.records) {
      if (!seen.has(id)) record.connected = false
      if (phase === GamePhase.LOBBY && !record.connected) this.records.delete(id)
    }
  }

  lockCurrentParticipants(): void {
    this.lockedParticipantIds = new Set(this.getLobbyParticipantIds())
    for (const record of this.records.values()) {
      record.alive = this.lockedParticipantIds.has(record.id)
    }
  }

  getLockedParticipantIds(): string[] {
    return [...this.lockedParticipantIds]
  }

  getLivingParticipantIds(): string[] {
    return [...this.lockedParticipantIds].filter((id) => this.records.get(id)?.alive === true)
  }

  isLockedParticipant(playerId: string): boolean {
    return this.lockedParticipantIds.has(normalizePlayerId(playerId))
  }

  resetForLobby(): void {
    this.lockedParticipantIds.clear()
    for (const [id, record] of this.records) {
      record.ready = false
      record.alive = true
      if (!record.connected) this.records.delete(id)
    }
  }

  toggleReady(playerId: string, phase: GamePhase): string | null {
    if (phase !== GamePhase.LOBBY) return 'Ready is only available in the lobby.'
    const id = normalizePlayerId(playerId)
    const record = this.records.get(id)
    if (!record || !record.connected) return 'Player is not connected to this scene.'
    if (!this.getLobbyParticipantIds().includes(id)) return 'The five player seats are full.'
    record.ready = !record.ready
    return null
  }

  canStart(phase: GamePhase): boolean {
    const participants = phase === GamePhase.STARTING ? [...this.lockedParticipantIds] : this.getLobbyParticipantIds()
    return (
      participants.length >= MIN_PLAYERS &&
      participants.every((id) => {
        const record = this.records.get(id)
        return record?.connected === true && record.ready
      })
    )
  }

  hasConnectedPlayer(playerId: string): boolean {
    return this.records.get(normalizePlayerId(playerId))?.connected === true
  }

  markDead(playerId: string): boolean {
    const id = normalizePlayerId(playerId)
    if (!this.lockedParticipantIds.has(id)) return false
    const record = this.records.get(id)
    if (!record || !record.alive) return false
    record.alive = false
    return true
  }

  getDisplayName(playerId: string): string {
    return this.records.get(normalizePlayerId(playerId))?.name ?? 'A council member'
  }

  toPublicPlayers(phase: GamePhase): PublicPlayer[] {
    const participantIds = phase === GamePhase.LOBBY ? new Set(this.getLobbyParticipantIds()) : this.lockedParticipantIds
    return [...this.records.values()]
      .filter((record) => record.connected || participantIds.has(record.id))
      .sort((a, b) => a.joinedOrder - b.joinedOrder)
      .map((record) => ({
        id: record.id,
        name: record.name,
        ready: record.ready,
        connected: record.connected,
        alive: participantIds.has(record.id) && record.alive,
        status: participantIds.has(record.id) && record.alive ? 'PLAYER' : 'SPECTATOR',
        matchParticipant: participantIds.has(record.id)
      }))
  }

  activeCount(phase: GamePhase): number {
    return phase === GamePhase.LOBBY ? this.getLobbyParticipantIds().length : this.getLivingParticipantIds().length
  }

  readyCount(phase: GamePhase): number {
    return this.toPublicPlayers(phase).filter((player) => player.status === 'PLAYER' && player.ready).length
  }

  spectatorCount(phase: GamePhase): number {
    return this.toPublicPlayers(phase).filter((player) => player.status === 'SPECTATOR' && player.connected).length
  }

  private getLobbyParticipantIds(): string[] {
    const connected = [...this.records.values()].filter((record) => record.connected)
    return classifyLobbyRoster(connected).playerIds.slice(0, MAX_PLAYERS)
  }
}
