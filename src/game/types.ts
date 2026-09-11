export enum GamePhase {
  BOOT = 'BOOT',
  LOBBY = 'LOBBY',
  STARTING = 'STARTING',
  ROLE_REVEAL = 'ROLE_REVEAL',
  NIGHT_ACTION = 'NIGHT_ACTION',
  MORNING = 'MORNING',
  DISCUSSION = 'DISCUSSION',
  VOTING = 'VOTING',
  RUNOFF_VOTING = 'RUNOFF_VOTING',
  ELIMINATION = 'ELIMINATION',
  GAME_OVER = 'GAME_OVER'
}

export enum PlayerRole {
  MAFIA = 'MAFIA',
  DOCTOR = 'DOCTOR',
  DETECTIVE = 'DETECTIVE',
  VILLAGER = 'VILLAGER'
}

export enum DetectiveResult {
  MAFIA = 'MAFIA',
  NOT_MAFIA = 'NOT_MAFIA'
}

export enum PrivateNightStatus {
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  SUBMITTED = 'SUBMITTED',
  WAITING = 'WAITING',
  RESOLVED = 'RESOLVED'
}

export enum PrivateVoteStatus {
  VOTE_REQUIRED = 'VOTE_REQUIRED',
  SUBMITTED = 'SUBMITTED',
  WAITING = 'WAITING'
}

export enum WinnerTeam {
  NONE = 'NONE',
  VILLAGE = 'VILLAGE',
  MAFIA = 'MAFIA'
}

export interface RoleProfile {
  name: string
  description: string
  objective: string
}

export const ROLE_PROFILES: Readonly<Record<PlayerRole, RoleProfile>> = {
  [PlayerRole.MAFIA]: {
    name: 'MAFIA',
    description: 'You are the hidden threat among the council.',
    objective: 'Stay concealed and survive until the Mafia controls the vote.'
  },
  [PlayerRole.DOCTOR]: {
    name: 'DOCTOR',
    description: 'You will be able to protect one living player each night.',
    objective: 'Keep the village alive and help expose the Mafia.'
  },
  [PlayerRole.DETECTIVE]: {
    name: 'DETECTIVE',
    description: 'You will be able to investigate one player each night.',
    objective: 'Use private clues to help the village identify the Mafia.'
  },
  [PlayerRole.VILLAGER]: {
    name: 'VILLAGER',
    description: 'You have no night action. Your voice and vote are your power.',
    objective: 'Read the room, share your suspicions, and vote out the Mafia.'
  }
}

export function parsePlayerRole(value: string): PlayerRole | null {
  return Object.values(PlayerRole).includes(value as PlayerRole) ? (value as PlayerRole) : null
}

export function parseDetectiveResult(value: string): DetectiveResult | null {
  return Object.values(DetectiveResult).includes(value as DetectiveResult) ? (value as DetectiveResult) : null
}

export function parsePrivateNightStatus(value: string): PrivateNightStatus | null {
  return Object.values(PrivateNightStatus).includes(value as PrivateNightStatus)
    ? (value as PrivateNightStatus)
    : null
}

export function parsePrivateVoteStatus(value: string): PrivateVoteStatus | null {
  return Object.values(PrivateVoteStatus).includes(value as PrivateVoteStatus)
    ? (value as PrivateVoteStatus)
    : null
}

export function parseWinnerTeam(value: string): WinnerTeam {
  return Object.values(WinnerTeam).includes(value as WinnerTeam) ? (value as WinnerTeam) : WinnerTeam.NONE
}

export type PublicPlayerStatus = 'PLAYER' | 'SPECTATOR'

export interface PublicPlayer {
  id: string
  name: string
  ready: boolean
  connected: boolean
  alive: boolean
  status: PublicPlayerStatus
  matchParticipant: boolean
}

export interface PublicRoleReveal {
  playerId: string
  playerName: string
  role: PlayerRole
}

export interface PublicGameSnapshot {
  phase: GamePhase
  phaseEndsAt: number
  matchCounter: number
  activeCount: number
  spectatorCount: number
  readyCount: number
  players: PublicPlayer[]
  announcement: string
  roundNumber: number
  winner: WinnerTeam
  runoffCandidateIds: string[]
  revealedRoles: PublicRoleReveal[]
  recap: string[]
  eliminatedPlayerId: string
  eliminatedRole: PlayerRole | null
  discussionEvents: import('./discussion').PublicDiscussionEvent[]
  publicRoleClaims: import('./discussion').PublicRoleClaimEntry[]
}
