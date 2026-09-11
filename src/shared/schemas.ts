import { engine, Schemas } from '@dcl/sdk/ecs'
import { AUTH_SERVER_PEER_ID } from '@dcl/sdk/network/message-bus-sync'

export const PublicMatchState = engine.defineComponent('mafia::PublicMatchState', {
  phase: Schemas.String,
  phaseEndsAt: Schemas.Int64,
  matchCounter: Schemas.Int,
  activeCount: Schemas.Int,
  spectatorCount: Schemas.Int,
  readyCount: Schemas.Int,
  playersJson: Schemas.String,
  announcement: Schemas.String,
  roundNumber: Schemas.Int,
  winner: Schemas.String,
  runoffCandidatesJson: Schemas.String,
  revealedRolesJson: Schemas.String,
  recapJson: Schemas.String,
  eliminatedPlayerId: Schemas.String,
  eliminatedRole: Schemas.String,
  discussionEventsJson: Schemas.String,
  publicRoleClaimsJson: Schemas.String
})

export const ServerHeartbeat = engine.defineComponent('mafia::ServerHeartbeat', {
  tick: Schemas.Int64
})

let validationInstalled = false

export function protectAuthoritativeComponents(): void {
  if (validationInstalled) return
  validationInstalled = true

  PublicMatchState.validateBeforeChange((change) => change.senderAddress === AUTH_SERVER_PEER_ID)
  ServerHeartbeat.validateBeforeChange((change) => change.senderAddress === AUTH_SERVER_PEER_ID)
}
