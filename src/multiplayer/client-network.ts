import { engine } from '@dcl/sdk/ecs'
import { isStateSyncronized } from '@dcl/sdk/network'
import { HEARTBEAT_FRESHNESS_MS, NETWORK_TICK_SECONDS } from '../config/constants'
import { secondsRemaining } from '../game/timers'
import {
  DiscussionIntent,
  parseDiscussionTemplate,
  parsePublicClaimResult,
  parsePublicClaimRole,
  PublicDiscussionEvent,
  PublicRoleClaimEntry
} from '../game/discussion'
import {
  DetectiveResult,
  GamePhase,
  parseDetectiveResult,
  parsePlayerRole,
  parsePrivateNightStatus,
  parsePrivateVoteStatus,
  parseWinnerTeam,
  PlayerRole,
  PrivateNightStatus,
  PrivateVoteStatus,
  PublicGameSnapshot,
  PublicRoleReveal,
  PublicPlayer
} from '../game/types'
import { getLocalPlayerSummary } from '../players/player-utils'
import { room } from '../shared/messages'
import { PublicMatchState, ServerHeartbeat } from '../shared/schemas'

export type PrivateProofStatus = 'WAITING' | 'REQUESTING' | 'VERIFIED' | 'FAILED'
export type PrivateRoleStatus = 'WAITING' | 'REQUESTING' | 'RECEIVED' | 'FAILED'
export type ClientNightStatus =
  | 'UNKNOWN'
  | 'REQUESTING'
  | 'SUBMITTING'
  | 'FAILED'
  | PrivateNightStatus
export type ClientVoteStatus = 'UNKNOWN' | 'REQUESTING' | 'SUBMITTING' | 'FAILED' | PrivateVoteStatus
export type ClientDiscussionStatus = 'IDLE' | 'SENDING' | 'SENT' | 'FAILED'

export interface ClientViewState extends PublicGameSnapshot {
  localPlayerId: string
  serverAlive: boolean
  roomSynchronized: boolean
  secondsLeft: number
  privateProofStatus: PrivateProofStatus
  privateRole: PlayerRole | null
  privateRoleMatchCounter: number
  privateRoleStatus: PrivateRoleStatus
  nightActionStatus: ClientNightStatus
  nightActionTargetId: string
  nightStateMatchCounter: number
  detectiveResult: DetectiveResult | null
  nightActionError: string
  previousDoctorTargetId: string
  voteStatus: ClientVoteStatus
  voteTargetId: string
  voteError: string
  discussionStatus: ClientDiscussionStatus
  discussionError: string
  notice: string
}

const viewState: ClientViewState = {
  phase: GamePhase.BOOT,
  phaseEndsAt: 0,
  matchCounter: 0,
  activeCount: 0,
  spectatorCount: 0,
  readyCount: 0,
  players: [],
  announcement: 'Connecting to the council...',
  roundNumber: 0,
  winner: parseWinnerTeam(''),
  runoffCandidateIds: [],
  revealedRoles: [],
  recap: [],
  eliminatedPlayerId: '',
  eliminatedRole: null,
  discussionEvents: [],
  publicRoleClaims: [],
  localPlayerId: '',
  serverAlive: false,
  roomSynchronized: false,
  secondsLeft: 0,
  privateProofStatus: 'WAITING',
  privateRole: null,
  privateRoleMatchCounter: 0,
  privateRoleStatus: 'WAITING',
  nightActionStatus: 'UNKNOWN',
  nightActionTargetId: '',
  nightStateMatchCounter: 0,
  detectiveResult: null,
  nightActionError: '',
  previousDoctorTargetId: '',
  voteStatus: 'UNKNOWN',
  voteTargetId: '',
  voteError: '',
  discussionStatus: 'IDLE',
  discussionError: '',
  notice: ''
}

let lastPlayersJson = ''
let lastHeartbeatValue = 0
let lastHeartbeatObservedAt = 0
let requestedNonce = ''
let requestSentAt = 0
let requestedRoleNonce = ''
let requestedRoleMatchCounter = 0
let roleRequestSentAt = 0
let observedMatchCounter = 0
let observedPhase = GamePhase.BOOT
let requestedNightNonce = ''
let requestedNightMatchCounter = 0
let nightRequestSentAt = 0
let nightStateRequestedPhase: GamePhase | null = null
let requestedVoteNonce = ''
let requestedVoteMatchCounter = 0
let requestedVoteRoundNumber = 0
let requestedVotePhase: GamePhase | null = null
let voteRequestSentAt = 0
let voteStateRequestedPhase: GamePhase | null = null
let discussionFeedbackAt = 0

export function getClientViewState(): ClientViewState {
  return viewState
}

export function requestReadyToggle(): void {
  if (!viewState.roomSynchronized) {
    viewState.notice = 'Connecting to the multiplayer room...'
    return
  }
  if (!viewState.serverAlive) {
    viewState.notice = 'The game server is waking up. Try again in a moment.'
    return
  }
  viewState.notice = ''
  void room.send('toggleReady', {})
}

export function submitNightAction(targetId: string): void {
  if (!viewState.roomSynchronized || !viewState.serverAlive) {
    viewState.nightActionError = 'The game server is not ready.'
    return
  }
  if (viewState.phase !== GamePhase.NIGHT_ACTION) {
    viewState.nightActionError = 'Night actions are closed.'
    return
  }
  if (viewState.nightActionStatus !== PrivateNightStatus.ACTION_REQUIRED) return

  requestedNightNonce = createNonce('night')
  requestedNightMatchCounter = viewState.matchCounter
  nightRequestSentAt = Date.now()
  viewState.nightActionStatus = 'SUBMITTING'
  viewState.nightActionError = ''
  void room.send('submitNightAction', {
    nonce: requestedNightNonce,
    matchCounter: requestedNightMatchCounter,
    targetId
  })
}

export function submitVote(targetId: string): void {
  if (!viewState.roomSynchronized || !viewState.serverAlive) {
    viewState.voteError = 'The game server is not ready.'
    return
  }
  if (viewState.phase !== GamePhase.VOTING && viewState.phase !== GamePhase.RUNOFF_VOTING) {
    viewState.voteError = 'Voting is closed.'
    return
  }
  if (viewState.voteStatus !== PrivateVoteStatus.VOTE_REQUIRED) return

  requestedVoteNonce = createNonce('vote')
  requestedVoteMatchCounter = viewState.matchCounter
  requestedVoteRoundNumber = viewState.roundNumber
  requestedVotePhase = viewState.phase
  voteRequestSentAt = Date.now()
  viewState.voteStatus = 'SUBMITTING'
  viewState.voteError = ''
  void room.send('submitVote', {
    nonce: requestedVoteNonce,
    matchCounter: requestedVoteMatchCounter,
    roundNumber: requestedVoteRoundNumber,
    targetId
  })
}

export function submitDiscussionIntent(intent: DiscussionIntent): void {
  if (!viewState.roomSynchronized || !viewState.serverAlive) {
    viewState.discussionStatus = 'FAILED'
    viewState.discussionError = 'The game server is not ready.'
    return
  }
  const localPlayer = viewState.players.find((player) => player.id === viewState.localPlayerId)
  if (viewState.phase !== GamePhase.DISCUSSION || localPlayer?.status !== 'PLAYER' || !localPlayer.alive) {
    viewState.discussionStatus = 'FAILED'
    viewState.discussionError = 'Only living players may speak during Discussion.'
    return
  }
  if (viewState.discussionStatus === 'SENDING') return
  viewState.discussionStatus = 'SENDING'
  viewState.discussionError = ''
  discussionFeedbackAt = Date.now()
  void room.send('submitDiscussion', {
    matchCounter: viewState.matchCounter,
    template: intent.template,
    targetPlayerId: intent.targetPlayerId ?? '',
    claimedRole: intent.claimedRole ?? '',
    claimedResult: intent.claimedResult ?? ''
  })
}

export function requestPlayAgain(): void {
  if (!viewState.roomSynchronized || !viewState.serverAlive || viewState.phase !== GamePhase.GAME_OVER) return
  viewState.notice = 'Resetting the council...'
  void room.send('requestPlayAgain', {})
}

export function setupClientNetwork(): void {
  room.onMessage('discussionAccepted', (data) => {
    if (!viewState.localPlayerId || data.recipientId.toLowerCase() !== viewState.localPlayerId) return
    if (data.matchCounter !== viewState.matchCounter || data.eventOrder < 1) return
    viewState.discussionStatus = 'SENT'
    viewState.discussionError = ''
    discussionFeedbackAt = Date.now()
  })

  room.onMessage('privateProof', (data) => {
    if (!viewState.localPlayerId) return
    if (data.recipientId.toLowerCase() !== viewState.localPlayerId) return
    if (!requestedNonce || data.nonce !== requestedNonce || !data.proofId) return
    viewState.privateProofStatus = 'VERIFIED'
    viewState.notice = 'Private server channel verified for this client.'
  })

  room.onMessage('privateRole', (data) => {
    if (!viewState.localPlayerId) return
    if (data.recipientId.toLowerCase() !== viewState.localPlayerId) return
    if (!requestedRoleNonce || data.nonce !== requestedRoleNonce) return
    if (data.matchCounter !== requestedRoleMatchCounter) return
    const role = parsePlayerRole(data.role)
    if (!role) return

    viewState.privateRole = role
    viewState.privateRoleMatchCounter = data.matchCounter
    viewState.privateRoleStatus = 'RECEIVED'
    if (
      viewState.notice.startsWith('Retrieving your private role') ||
      viewState.notice.startsWith('A private role is not available')
    ) {
      viewState.notice = ''
    }
  })

  room.onMessage('privateNightState', (data) => {
    if (!viewState.localPlayerId) return
    if (data.recipientId.toLowerCase() !== viewState.localPlayerId) return
    if (!requestedNightNonce || data.nonce !== requestedNightNonce) return
    if (data.matchCounter !== requestedNightMatchCounter) return
    const status = parsePrivateNightStatus(data.status)
    if (!status) return

    viewState.nightActionStatus = status
    viewState.nightActionTargetId = data.targetId
    viewState.nightStateMatchCounter = data.matchCounter
    viewState.detectiveResult = data.investigationResult
      ? parseDetectiveResult(data.investigationResult)
      : null
    viewState.previousDoctorTargetId = data.previousDoctorTargetId
    viewState.nightActionError = ''
  })

  room.onMessage('privateVoteState', (data) => {
    if (!viewState.localPlayerId || data.recipientId.toLowerCase() !== viewState.localPlayerId) return
    if (!requestedVoteNonce || data.nonce !== requestedVoteNonce) return
    if (
      data.matchCounter !== requestedVoteMatchCounter ||
      data.roundNumber !== requestedVoteRoundNumber ||
      data.phase !== requestedVotePhase
    ) {
      return
    }
    const status = parsePrivateVoteStatus(data.status)
    if (!status) return
    viewState.voteStatus = status
    viewState.voteTargetId = data.targetId
    viewState.voteError = ''
  })

  room.onMessage('privateDetectiveResult', (data) => {
    if (!viewState.localPlayerId || data.recipientId.toLowerCase() !== viewState.localPlayerId) return
    if (data.matchCounter !== viewState.matchCounter) return
    const result = parseDetectiveResult(data.investigationResult)
    if (!result) return
    viewState.nightActionTargetId = data.targetId
    viewState.detectiveResult = result
    viewState.nightActionStatus = PrivateNightStatus.RESOLVED
  })

  room.onMessage('actionRejected', (data) => {
    if (data.action === 'submitNightAction' || data.action === 'requestNightState') {
      viewState.nightActionStatus = 'FAILED'
      viewState.nightActionError = data.reason
      nightStateRequestedPhase = null
      return
    }
    if (data.action === 'submitVote' || data.action === 'requestVoteState') {
      viewState.voteStatus = 'FAILED'
      viewState.voteError = data.reason
      voteStateRequestedPhase = null
      return
    }
    if (data.action === 'submitDiscussion') {
      viewState.discussionStatus = 'FAILED'
      viewState.discussionError = data.reason
      discussionFeedbackAt = Date.now()
      return
    }
    viewState.notice = data.reason
    if (data.action === 'requestPrivateProof') viewState.privateProofStatus = 'FAILED'
    if (data.action === 'requestRole') viewState.privateRoleStatus = 'FAILED'
  })

  let accumulator = 0
  engine.addSystem((dt: number) => {
    accumulator += dt
    if (accumulator < NETWORK_TICK_SECONDS) return
    accumulator = 0

    viewState.roomSynchronized = isStateSyncronized()
    const profile = getLocalPlayerSummary()
    if (profile) viewState.localPlayerId = profile.id

    observeHeartbeat()
    observePublicState()
    viewState.secondsLeft = secondsRemaining(viewState.phaseEndsAt, Date.now())
    if (viewState.discussionStatus !== 'IDLE' && Date.now() - discussionFeedbackAt > 1_400) {
      viewState.discussionStatus = 'IDLE'
      viewState.discussionError = ''
    }

    if (viewState.serverAlive && viewState.notice.startsWith('The game server is waking up')) {
      viewState.notice = ''
    }

    maybeRequestPrivateProof()
    maybeRequestPrivateRole()
    maybeRequestNightState()
    maybeRequestVoteState()
  })

  console.log('[CLIENT] Milestone 5 client initialized.')
}

function observeHeartbeat(): void {
  for (const [, heartbeat] of engine.getEntitiesWith(ServerHeartbeat)) {
    if (heartbeat.tick !== lastHeartbeatValue) {
      lastHeartbeatValue = heartbeat.tick
      lastHeartbeatObservedAt = Date.now()
    }
    break
  }
  viewState.serverAlive =
    viewState.roomSynchronized &&
    lastHeartbeatObservedAt > 0 &&
    Date.now() - lastHeartbeatObservedAt < HEARTBEAT_FRESHNESS_MS
}

function observePublicState(): void {
  for (const [, state] of engine.getEntitiesWith(PublicMatchState)) {
    const nextPhase = parsePhase(state.phase)
    if (state.matchCounter !== observedMatchCounter || nextPhase === GamePhase.LOBBY) {
      resetPrivateRoleState()
      resetPrivateNightState()
      resetPrivateVoteState()
      resetDiscussionState()
      observedMatchCounter = state.matchCounter
    }
    if (nextPhase !== observedPhase) {
      observedPhase = nextPhase
      nightStateRequestedPhase = null
      voteStateRequestedPhase = null
      if (nextPhase === GamePhase.NIGHT_ACTION) resetPrivateNightState()
      if (nextPhase === GamePhase.VOTING || nextPhase === GamePhase.RUNOFF_VOTING) resetPrivateVoteState()
      if (nextPhase !== GamePhase.DISCUSSION) resetDiscussionState()
    }
    viewState.phase = nextPhase
    viewState.phaseEndsAt = state.phaseEndsAt
    viewState.matchCounter = state.matchCounter
    viewState.activeCount = state.activeCount
    viewState.spectatorCount = state.spectatorCount
    viewState.readyCount = state.readyCount
    viewState.announcement = state.announcement
    viewState.roundNumber = state.roundNumber
    viewState.winner = parseWinnerTeam(state.winner)
    viewState.runoffCandidateIds = parseStringArray(state.runoffCandidatesJson)
    viewState.revealedRoles = parseRoleReveals(state.revealedRolesJson)
    viewState.recap = parseStringArray(state.recapJson)
    viewState.eliminatedPlayerId = state.eliminatedPlayerId
    viewState.eliminatedRole = state.eliminatedRole ? parsePlayerRole(state.eliminatedRole) : null
    viewState.discussionEvents = parseDiscussionEvents(state.discussionEventsJson)
    viewState.publicRoleClaims = parsePublicRoleClaims(state.publicRoleClaimsJson)

    if (state.playersJson !== lastPlayersJson) {
      lastPlayersJson = state.playersJson
      viewState.players = parsePlayers(state.playersJson)
    }
    break
  }
}

function resetDiscussionState(): void {
  viewState.discussionStatus = 'IDLE'
  viewState.discussionError = ''
  discussionFeedbackAt = 0
}

function maybeRequestPrivateRole(): void {
  if (!viewState.serverAlive || !viewState.localPlayerId || !viewState.roomSynchronized) return
  if (!phaseAllowsRoleRecovery(viewState.phase) || viewState.matchCounter < 1) return
  const localPlayer = viewState.players.find((player) => player.id === viewState.localPlayerId)
  if (!localPlayer?.matchParticipant) return
  if (
    viewState.privateRoleStatus === 'RECEIVED' &&
    viewState.privateRole !== null &&
    viewState.privateRoleMatchCounter === viewState.matchCounter
  ) {
    return
  }

  const now = Date.now()
  const retrying = viewState.privateRoleStatus === 'FAILED' || viewState.privateRoleStatus === 'REQUESTING'
  if (retrying && now - roleRequestSentAt <= 1_500) return
  if (viewState.privateRoleStatus !== 'WAITING' && !retrying) return

  requestedRoleNonce = `${now.toString(36)}_role_${Math.floor(Math.random() * 1_000_000).toString(36)}`
  requestedRoleMatchCounter = viewState.matchCounter
  roleRequestSentAt = now
  viewState.privateRoleStatus = 'REQUESTING'
  viewState.notice = 'Retrieving your private role...'
  void room.send('requestRole', { nonce: requestedRoleNonce, matchCounter: requestedRoleMatchCounter })
}

function resetPrivateRoleState(): void {
  viewState.privateRole = null
  viewState.privateRoleMatchCounter = 0
  viewState.privateRoleStatus = 'WAITING'
  requestedRoleNonce = ''
  requestedRoleMatchCounter = 0
  roleRequestSentAt = 0
  if (
    viewState.notice.startsWith('Retrieving your private role') ||
    viewState.notice.startsWith('A private role is not available')
  ) {
    viewState.notice = ''
  }
}

function phaseAllowsRoleRecovery(phase: GamePhase): boolean {
  return phase !== GamePhase.BOOT && phase !== GamePhase.LOBBY && phase !== GamePhase.STARTING
}

function maybeRequestNightState(): void {
  if (!viewState.serverAlive || !viewState.localPlayerId || !viewState.roomSynchronized) return
  if (!phaseAllowsNightRecovery(viewState.phase) || viewState.matchCounter < 1) return
  const localPlayer = viewState.players.find((player) => player.id === viewState.localPlayerId)
  if (!localPlayer?.matchParticipant) return

  const now = Date.now()
  const retryable =
    viewState.nightActionStatus === 'FAILED' ||
    viewState.nightActionStatus === 'REQUESTING' ||
    viewState.nightActionStatus === 'SUBMITTING'
  const retry = retryable && now - nightRequestSentAt > 1_500
  if (nightStateRequestedPhase === viewState.phase && !retry) return

  requestedNightNonce = createNonce('night-state')
  requestedNightMatchCounter = viewState.matchCounter
  nightRequestSentAt = now
  nightStateRequestedPhase = viewState.phase
  viewState.nightActionStatus = 'REQUESTING'
  viewState.nightActionError = ''
  viewState.previousDoctorTargetId = ''
  void room.send('requestNightState', {
    nonce: requestedNightNonce,
    matchCounter: requestedNightMatchCounter
  })
}

function resetPrivateNightState(): void {
  viewState.nightActionStatus = 'UNKNOWN'
  viewState.nightActionTargetId = ''
  viewState.nightStateMatchCounter = 0
  viewState.detectiveResult = null
  viewState.nightActionError = ''
  requestedNightNonce = ''
  requestedNightMatchCounter = 0
  nightRequestSentAt = 0
  nightStateRequestedPhase = null
}

function phaseAllowsNightRecovery(phase: GamePhase): boolean {
  return phase === GamePhase.NIGHT_ACTION || phase === GamePhase.MORNING
}

function maybeRequestVoteState(): void {
  if (!viewState.serverAlive || !viewState.localPlayerId || !viewState.roomSynchronized) return
  if (viewState.phase !== GamePhase.VOTING && viewState.phase !== GamePhase.RUNOFF_VOTING) return
  const localPlayer = viewState.players.find((player) => player.id === viewState.localPlayerId)
  if (localPlayer?.status !== 'PLAYER' || !localPlayer.alive) return

  const now = Date.now()
  const retryable =
    viewState.voteStatus === 'FAILED' ||
    viewState.voteStatus === 'REQUESTING' ||
    viewState.voteStatus === 'SUBMITTING'
  const retry = retryable && now - voteRequestSentAt > 1_500
  if (voteStateRequestedPhase === viewState.phase && !retry) return

  requestedVoteNonce = createNonce('vote-state')
  requestedVoteMatchCounter = viewState.matchCounter
  requestedVoteRoundNumber = viewState.roundNumber
  requestedVotePhase = viewState.phase
  voteRequestSentAt = now
  voteStateRequestedPhase = viewState.phase
  viewState.voteStatus = 'REQUESTING'
  viewState.voteError = ''
  void room.send('requestVoteState', {
    nonce: requestedVoteNonce,
    matchCounter: requestedVoteMatchCounter,
    roundNumber: requestedVoteRoundNumber,
    phase: viewState.phase
  })
}

function resetPrivateVoteState(): void {
  viewState.voteStatus = 'UNKNOWN'
  viewState.voteTargetId = ''
  viewState.voteError = ''
  requestedVoteNonce = ''
  requestedVoteMatchCounter = 0
  requestedVoteRoundNumber = 0
  requestedVotePhase = null
  voteRequestSentAt = 0
  voteStateRequestedPhase = null
}

function createNonce(purpose: string): string {
  const now = Date.now()
  return `${now.toString(36)}_${purpose}_${Math.floor(Math.random() * 1_000_000).toString(36)}`
}

function maybeRequestPrivateProof(): void {
  if (!viewState.serverAlive || !viewState.localPlayerId || !viewState.roomSynchronized) return
  const now = Date.now()
  const shouldRetry =
    (viewState.privateProofStatus === 'FAILED' || viewState.privateProofStatus === 'REQUESTING') &&
    now - requestSentAt > 4_000
  if (viewState.privateProofStatus !== 'WAITING' && !shouldRetry) return

  requestedNonce = `${now.toString(36)}_${Math.floor(Math.random() * 1_000_000).toString(36)}`
  requestSentAt = now
  viewState.privateProofStatus = 'REQUESTING'
  void room.send('requestPrivateProof', { nonce: requestedNonce })
}

function parsePlayers(value: string): PublicPlayer[] {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as PublicPlayer[]) : []
  } catch {
    return []
  }
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : []
  } catch {
    return []
  }
}

function parseRoleReveals(value: string): PublicRoleReveal[] {
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const role = item && typeof item === 'object' ? parsePlayerRole(String(item.role ?? '')) : null
      return role && typeof item.playerId === 'string' && typeof item.playerName === 'string'
        ? [{ playerId: item.playerId, playerName: item.playerName, role }]
        : []
    })
  } catch {
    return []
  }
}

function parseDiscussionEvents(value: string): PublicDiscussionEvent[] {
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const template = parseDiscussionTemplate(String(item.template ?? ''))
      const publicRoleClaim = item.publicRoleClaim ? parsePublicClaimRole(String(item.publicRoleClaim)) : ''
      const claimedResult = item.claimedResult ? parsePublicClaimResult(String(item.claimedResult)) : ''
      if (!template || (item.publicRoleClaim && !publicRoleClaim) || (item.claimedResult && !claimedResult)) return []
      if (typeof item.order !== 'number' || typeof item.senderRef !== 'string' || typeof item.senderName !== 'string' || typeof item.message !== 'string') return []
      return [{
        order: item.order,
        senderRef: item.senderRef,
        senderName: item.senderName,
        template,
        targetPlayerRef: typeof item.targetPlayerRef === 'string' ? item.targetPlayerRef : '',
        targetPlayerName: typeof item.targetPlayerName === 'string' ? item.targetPlayerName : '',
        publicRoleClaim: publicRoleClaim || '',
        claimedResult: claimedResult || '',
        message: item.message
      }]
    })
  } catch {
    return []
  }
}

function parsePublicRoleClaims(value: string): PublicRoleClaimEntry[] {
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const claim = item && typeof item === 'object' ? parsePublicClaimRole(String(item.publicRoleClaim ?? '')) : null
      return claim && typeof item.playerRef === 'string'
        ? [{ playerRef: item.playerRef, publicRoleClaim: claim }]
        : []
    })
  } catch {
    return []
  }
}

function parsePhase(value: string): GamePhase {
  return Object.values(GamePhase).includes(value as GamePhase) ? (value as GamePhase) : GamePhase.BOOT
}
