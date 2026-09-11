import { engine } from '@dcl/sdk/ecs'
import { syncEntity } from '@dcl/sdk/network'
import { HEARTBEAT_INTERVAL_MS, NETWORK_TICK_SECONDS, PLAYER_SCAN_SECONDS } from '../config/constants'
import { debugLog } from '../config/debug'
import { GameController, PhaseTransition } from '../game/game-controller'
import { DiscussionStore } from '../game/discussion'
import { GamePhase, PlayerRole, PublicRoleReveal, WinnerTeam } from '../game/types'
import { PlayerRegistry } from '../multiplayer/player-registry'
import { room } from '../shared/messages'
import { protectAuthoritativeComponents, PublicMatchState, ServerHeartbeat } from '../shared/schemas'
import { NightActionStore } from './night-action-store'
import {
  sendPrivateDetectiveResult,
  sendPrivateNightState,
  sendPrivateProof,
  sendPrivateRole,
  sendPrivateVoteState
} from './private-state'
import { PrivateRoleStore } from './private-role-store'
import { createPublicRoleReveal } from './public-results'
import { isValidNonce } from './validators'
import { VotingStore } from './voting-store'
import { computeWinner } from './win-conditions'

enum SyncId {
  PUBLIC_MATCH_STATE = 1001
}

const PHASE_ANNOUNCEMENTS: Readonly<Record<GamePhase, string>> = {
  [GamePhase.BOOT]: 'Preparing the council...',
  [GamePhase.LOBBY]: 'Gather 4-5 players and get ready.',
  [GamePhase.STARTING]: 'The council is assembling.',
  [GamePhase.ROLE_REVEAL]: 'Roles are being delivered privately.',
  [GamePhase.NIGHT_ACTION]: 'Night actions are being collected privately.',
  [GamePhase.MORNING]: 'The village wakes to the server-resolved outcome.',
  [GamePhase.DISCUSSION]: 'DISCUSS — WHO IS THE MAFIA? Platform voice remains external.',
  [GamePhase.VOTING]: 'Living players: cast one private, locked vote.',
  [GamePhase.RUNOFF_VOTING]: 'Runoff: vote privately for one tied candidate.',
  [GamePhase.ELIMINATION]: 'The council decision is final.',
  [GamePhase.GAME_OVER]: 'The match is over. All roles are now public.'
}

export function setupAuthority(): void {
  protectAuthoritativeComponents()

  const controller = new GameController()
  const registry = new PlayerRegistry()
  const privateRoles = new PrivateRoleStore()
  const nightActions = new NightActionStore()
  const voting = new VotingStore()
  const discussion = new DiscussionStore()
  let roundNumber = 0
  let winner = WinnerTeam.NONE
  let runoffCandidateIds: string[] = []
  let revealedRoles: PublicRoleReveal[] = []
  let recap: string[] = []
  let eliminatedPlayerId = ''
  let eliminatedRole: PlayerRole | null = null
  let announcement = PHASE_ANNOUNCEMENTS[GamePhase.BOOT]

  controller.start(Date.now())
  announcement = PHASE_ANNOUNCEMENTS[controller.phase]
  registry.scan(controller.phase)

  const stateEntity = engine.addEntity()
  PublicMatchState.create(stateEntity, publicState())
  ServerHeartbeat.create(stateEntity, { tick: Date.now() })
  syncEntity(stateEntity, [PublicMatchState.componentId, ServerHeartbeat.componentId], SyncId.PUBLIC_MATCH_STATE)

  room.onMessage('toggleReady', (_data, context) => {
    if (!context) return
    const rejection = registry.toggleReady(context.from, controller.phase)
    if (rejection) sendRejection('toggleReady', context.from, rejection)
    else publishState()
  })

  room.onMessage('requestPrivateProof', (data, context) => {
    if (!context) return
    if (!registry.hasConnectedPlayer(context.from)) {
      sendRejection('requestPrivateProof', context.from, 'Player is not registered in the scene.')
      return
    }
    if (!sendPrivateProof(context.from, data.nonce)) {
      sendRejection('requestPrivateProof', context.from, 'The proof request was invalid.')
    }
  })

  room.onMessage('requestRole', (data, context) => {
    if (!context) return
    const role = privateRoles.get(context.from)
    const roleAvailable =
      data.matchCounter === controller.matchCounter &&
      controller.phase !== GamePhase.BOOT &&
      controller.phase !== GamePhase.LOBBY &&
      controller.phase !== GamePhase.STARTING &&
      role !== null
    if (!roleAvailable || !sendPrivateRole(context.from, data.nonce, data.matchCounter, role)) {
      sendRejection('requestRole', context.from, 'A private role is not available for this player in this match.')
    }
  })

  room.onMessage('submitNightAction', (data, context) => {
    if (!context) return
    if (!isValidNonce(data.nonce)) {
      sendRejection('submitNightAction', context.from, 'The private action request was invalid.')
      return
    }
    const submission = nightActions.submit(context.from, data.targetId, data.matchCounter, controller.phase)
    if (!submission.accepted) {
      sendRejection('submitNightAction', context.from, submission.reason)
      return
    }
    const privateState = nightActions.getPrivateState(context.from, data.matchCounter)
    if (!privateState || !sendPrivateNightState(context.from, data.nonce, data.matchCounter, privateState)) {
      sendRejection('submitNightAction', context.from, 'The private action acknowledgement failed.')
    }
  })

  room.onMessage('requestNightState', (data, context) => {
    if (!context) return
    const phaseAllowsRecovery =
      controller.phase !== GamePhase.BOOT &&
      controller.phase !== GamePhase.LOBBY &&
      controller.phase !== GamePhase.STARTING &&
      controller.phase !== GamePhase.ROLE_REVEAL
    const privateState = nightActions.getPrivateState(context.from, data.matchCounter)
    if (
      !phaseAllowsRecovery ||
      !privateState ||
      !sendPrivateNightState(context.from, data.nonce, data.matchCounter, privateState)
    ) {
      sendRejection('requestNightState', context.from, 'Private night state is not available for this player.')
    }
  })

  room.onMessage('submitVote', (data, context) => {
    if (!context) return
    if (!isValidNonce(data.nonce)) {
      sendRejection('submitVote', context.from, 'The private vote request was invalid.')
      return
    }
    const submission = voting.submit(
      context.from,
      data.targetId,
      data.matchCounter,
      data.roundNumber,
      controller.phase
    )
    if (!submission.accepted) {
      sendRejection('submitVote', context.from, submission.reason)
      return
    }
    const privateState = voting.getPrivateState(context.from, data.matchCounter, data.roundNumber, controller.phase)
    if (
      !privateState ||
      !sendPrivateVoteState(
        context.from,
        data.nonce,
        data.matchCounter,
        data.roundNumber,
        controller.phase,
        privateState
      )
    ) {
      sendRejection('submitVote', context.from, 'The private vote acknowledgement failed.')
    }
  })

  room.onMessage('requestVoteState', (data, context) => {
    if (!context) return
    if (data.phase !== controller.phase) {
      sendRejection('requestVoteState', context.from, 'Private vote state is not available for this ballot.')
      return
    }
    const privateState = voting.getPrivateState(context.from, data.matchCounter, data.roundNumber, controller.phase)
    if (
      !privateState ||
      !sendPrivateVoteState(
        context.from,
        data.nonce,
        data.matchCounter,
        data.roundNumber,
        controller.phase,
        privateState
      )
    ) {
      sendRejection('requestVoteState', context.from, 'Private vote state is not available for this player.')
    }
  })

  room.onMessage('requestPlayAgain', (_data, context) => {
    if (!context) return
    if (controller.phase !== GamePhase.GAME_OVER || !registry.isLockedParticipant(context.from)) {
      sendRejection('requestPlayAgain', context.from, 'Only a match participant may restart a finished match.')
      return
    }
    clearMatchState()
    logTransition(controller.resetToLobby(Date.now()))
    announcement = PHASE_ANNOUNCEMENTS[GamePhase.LOBBY]
    publishState()
  })

  room.onMessage('submitDiscussion', (data, context) => {
    if (!context) return
    const submission = discussion.submit(
      context.from,
      {
        template: data.template,
        targetPlayerId: data.targetPlayerId,
        claimedRole: data.claimedRole,
        claimedResult: data.claimedResult
      },
      data.matchCounter,
      controller.phase,
      Date.now()
    )
    if (!submission.accepted || !submission.event) {
      sendRejection('submitDiscussion', context.from, submission.reason)
      return
    }
    publishState()
    void room.send(
      'discussionAccepted',
      {
        recipientId: context.from.toLowerCase(),
        matchCounter: controller.matchCounter,
        eventOrder: submission.event.order
      },
      { to: [context.from] }
    )
  })

  let networkAccumulator = 0
  let playerScanAccumulator = 0
  let heartbeatAccumulatorMs = 0
  let lastPublished = ''
  publishState()

  engine.addSystem((dt: number) => {
    networkAccumulator += dt
    playerScanAccumulator += dt
    heartbeatAccumulatorMs += dt * 1_000
    if (heartbeatAccumulatorMs >= HEARTBEAT_INTERVAL_MS) {
      heartbeatAccumulatorMs = 0
      ServerHeartbeat.getMutable(stateEntity).tick = Date.now()
    }
    if (playerScanAccumulator >= PLAYER_SCAN_SECONDS) {
      playerScanAccumulator = 0
      registry.scan(controller.phase)
    }
    if (networkAccumulator < NETWORK_TICK_SECONDS) return
    networkAccumulator = 0

    const now = Date.now()
    handleManagedPhase(now)
    const transition = controller.tick(now, registry.canStart(controller.phase))
    if (transition) handleAutomaticTransition(transition)
    publishState()
  })

  console.log('[SERVER] Milestone 5 authority initialized.')

  function handleManagedPhase(now: number): void {
    if (
      controller.phase === GamePhase.NIGHT_ACTION &&
      controller.phaseEndsAt > 0 &&
      now >= controller.phaseEndsAt &&
      !nightActions.isResolved
    ) {
      resolveNight(now)
      return
    }
    if (
      (controller.phase === GamePhase.VOTING || controller.phase === GamePhase.RUNOFF_VOTING) &&
      (voting.allEligibleVoted || (controller.phaseEndsAt > 0 && now >= controller.phaseEndsAt))
    ) {
      resolveBallot(now)
      return
    }
    if (
      controller.phase === GamePhase.ELIMINATION &&
      controller.phaseEndsAt > 0 &&
      now >= controller.phaseEndsAt
    ) {
      if (winner !== WinnerTeam.NONE) finishGame(now)
      else beginNextNight(now)
    }
  }

  function handleAutomaticTransition(transition: PhaseTransition): void {
    announcement = PHASE_ANNOUNCEMENTS[transition.to]
    if (transition.to === GamePhase.STARTING) beginMatch()
    if (transition.to === GamePhase.DISCUSSION) beginDiscussion()
    if (transition.to === GamePhase.VOTING) beginVoting()
    if (transition.to === GamePhase.LOBBY) clearMatchState()
    logTransition(transition)
  }

  function beginMatch(): void {
    registry.lockCurrentParticipants()
    const assignments = privateRoles.assignToParticipants(registry.getLockedParticipantIds())
    nightActions.startMatch(controller.matchCounter, assignments)
    voting.startMatch(controller.matchCounter)
    discussion.startMatch(controller.matchCounter)
    roundNumber = 1
    winner = WinnerTeam.NONE
    runoffCandidateIds = []
    revealedRoles = []
    recap = []
    eliminatedPlayerId = ''
    eliminatedRole = null
  }

  function beginDiscussion(): void {
    const livingIds = new Set(registry.getLivingParticipantIds())
    const participants = registry.getLockedParticipantIds().map((id) => ({
      id,
      name: registry.getDisplayName(id),
      alive: livingIds.has(id)
    }))
    discussion.beginDiscussion(controller.matchCounter, participants)
  }

  function resolveNight(now: number): void {
    const resolution = nightActions.resolve(controller.matchCounter)
    if (resolution.detectivePlayerId && resolution.detectiveTargetId && resolution.detectiveResult) {
      sendPrivateDetectiveResult(
        resolution.detectivePlayerId,
        controller.matchCounter,
        resolution.detectiveTargetId,
        resolution.detectiveResult
      )
    }
    if (resolution.victimId) {
      registry.markDead(resolution.victimId)
      const name = registry.getDisplayName(resolution.victimId)
      announcement = `${name} did not survive the night.`
      recap.push(`Night ${roundNumber}: ${name} died.`)
    } else {
      announcement = 'No one died during the night.'
      recap.push(`Night ${roundNumber}: No one died.`)
    }
    winner = currentWinner()
    if (winner !== WinnerTeam.NONE) finishGame(now)
    else logTransition(controller.transitionTo(GamePhase.MORNING, now))
  }

  function beginVoting(): void {
    runoffCandidateIds = []
    voting.startBallot(
      controller.matchCounter,
      roundNumber,
      GamePhase.VOTING,
      registry.getLivingParticipantIds()
    )
  }

  function resolveBallot(now: number): void {
    const ballotPhase = controller.phase
    const resolution = voting.resolve()
    if (ballotPhase === GamePhase.VOTING && resolution.runoffCandidateIds.length > 1) {
      runoffCandidateIds = resolution.runoffCandidateIds
      const names = runoffCandidateIds.map((id) => registry.getDisplayName(id)).join(' vs ')
      announcement = `Runoff required: ${names}. Live totals remain hidden.`
      logTransition(controller.transitionTo(GamePhase.RUNOFF_VOTING, now))
      voting.startBallot(
        controller.matchCounter,
        roundNumber,
        GamePhase.RUNOFF_VOTING,
        registry.getLivingParticipantIds(),
        runoffCandidateIds
      )
      return
    }

    runoffCandidateIds = []
    eliminatedPlayerId = resolution.eliminatedPlayerId ?? ''
    eliminatedRole = eliminatedPlayerId ? privateRoles.get(eliminatedPlayerId) : null
    if (eliminatedPlayerId && eliminatedRole) {
      registry.markDead(eliminatedPlayerId)
      const name = registry.getDisplayName(eliminatedPlayerId)
      revealedRoles.push(createPublicRoleReveal(eliminatedPlayerId, name, eliminatedRole))
      recap.push(`Day ${roundNumber}: ${name} was eliminated as ${eliminatedRole}.`)
      announcement = `${name} was eliminated. Their role was ${eliminatedRole}.`
    } else {
      recap.push(`Day ${roundNumber}: No one was eliminated.`)
      announcement = resolution.tied
        ? 'The runoff ended tied. Nobody was eliminated.'
        : 'Voting ended without an elimination.'
    }
    voting.clearBallot()
    winner = currentWinner()
    logTransition(controller.transitionTo(GamePhase.ELIMINATION, now))
  }

  function beginNextNight(now: number): void {
    roundNumber += 1
    runoffCandidateIds = []
    eliminatedPlayerId = ''
    eliminatedRole = null
    voting.clearBallot()
    nightActions.startNextNight(registry.getLivingParticipantIds())
    announcement = PHASE_ANNOUNCEMENTS[GamePhase.NIGHT_ACTION]
    logTransition(controller.transitionTo(GamePhase.NIGHT_ACTION, now))
  }

  function finishGame(now: number): void {
    if (winner === WinnerTeam.NONE) winner = currentWinner()
    revealedRoles = registry.getLockedParticipantIds().flatMap((playerId) => {
      const role = privateRoles.get(playerId)
      return role ? [createPublicRoleReveal(playerId, registry.getDisplayName(playerId), role)] : []
    })
    runoffCandidateIds = []
    voting.clearBallot()
    announcement = `${winner === WinnerTeam.MAFIA ? 'MAFIA' : 'VILLAGE'} WINS. All roles are revealed.`
    logTransition(controller.transitionTo(GamePhase.GAME_OVER, now))
  }

  function currentWinner(): WinnerTeam {
    return computeWinner(registry.getLivingParticipantIds(), privateRoles.copyAssignmentsForServer())
  }

  function clearMatchState(): void {
    nightActions.clear()
    voting.clear()
    privateRoles.clear()
    discussion.clear()
    registry.resetForLobby()
    roundNumber = 0
    winner = WinnerTeam.NONE
    runoffCandidateIds = []
    revealedRoles = []
    recap = []
    eliminatedPlayerId = ''
    eliminatedRole = null
  }

  function publicState() {
    return {
      phase: controller.phase,
      phaseEndsAt: controller.phaseEndsAt,
      matchCounter: controller.matchCounter,
      activeCount: registry.activeCount(controller.phase),
      spectatorCount: registry.spectatorCount(controller.phase),
      readyCount: registry.readyCount(controller.phase),
      playersJson: JSON.stringify(registry.toPublicPlayers(controller.phase)),
      announcement,
      roundNumber,
      winner,
      runoffCandidatesJson: JSON.stringify(runoffCandidateIds),
      revealedRolesJson: JSON.stringify(revealedRoles),
      recapJson: JSON.stringify(recap),
      eliminatedPlayerId,
      eliminatedRole: eliminatedRole ?? '',
      discussionEventsJson: JSON.stringify(discussion.events),
      publicRoleClaimsJson: JSON.stringify(discussion.publicRoleClaims)
    }
  }

  function publishState(): void {
    const state = publicState()
    const serialized = JSON.stringify(state)
    if (serialized === lastPublished) return
    lastPublished = serialized
    PublicMatchState.createOrReplace(stateEntity, state)
  }

  function sendRejection(action: string, recipient: string, reason: string): void {
    void room.send('actionRejected', { action, reason }, { to: [recipient] })
  }

  function logTransition(transition: PhaseTransition): void {
    debugLog(`Phase ${transition.from} -> ${transition.to}`)
  }
}
