import { MAX_PLAYERS } from '../config/constants'

export interface RosterCandidate {
  id: string
  joinedOrder: number
}

export interface RosterClassification {
  playerIds: string[]
  spectatorIds: string[]
}

export function classifyLobbyRoster(candidates: readonly RosterCandidate[]): RosterClassification {
  const ordered = [...candidates].sort((a, b) => a.joinedOrder - b.joinedOrder)
  return {
    playerIds: ordered.slice(0, MAX_PLAYERS).map((candidate) => candidate.id),
    spectatorIds: ordered.slice(MAX_PLAYERS).map((candidate) => candidate.id)
  }
}
