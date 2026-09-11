import { Schemas } from '@dcl/sdk/ecs'
import { registerMessages } from '@dcl/sdk/network'

export const Messages = {
  toggleReady: Schemas.Map({}),
  requestPrivateProof: Schemas.Map({ nonce: Schemas.String }),
  privateProof: Schemas.Map({ recipientId: Schemas.String, nonce: Schemas.String, proofId: Schemas.String }),
  requestRole: Schemas.Map({ nonce: Schemas.String, matchCounter: Schemas.Int }),
  privateRole: Schemas.Map({
    recipientId: Schemas.String,
    nonce: Schemas.String,
    matchCounter: Schemas.Int,
    role: Schemas.String
  }),
  submitNightAction: Schemas.Map({
    nonce: Schemas.String,
    matchCounter: Schemas.Int,
    targetId: Schemas.String
  }),
  requestNightState: Schemas.Map({ nonce: Schemas.String, matchCounter: Schemas.Int }),
  privateNightState: Schemas.Map({
    recipientId: Schemas.String,
    nonce: Schemas.String,
    matchCounter: Schemas.Int,
    status: Schemas.String,
    targetId: Schemas.String,
    investigationResult: Schemas.String,
    previousDoctorTargetId: Schemas.String
  }),
  privateDetectiveResult: Schemas.Map({
    recipientId: Schemas.String,
    matchCounter: Schemas.Int,
    targetId: Schemas.String,
    investigationResult: Schemas.String
  }),
  submitVote: Schemas.Map({
    nonce: Schemas.String,
    matchCounter: Schemas.Int,
    roundNumber: Schemas.Int,
    targetId: Schemas.String
  }),
  requestVoteState: Schemas.Map({
    nonce: Schemas.String,
    matchCounter: Schemas.Int,
    roundNumber: Schemas.Int,
    phase: Schemas.String
  }),
  privateVoteState: Schemas.Map({
    recipientId: Schemas.String,
    nonce: Schemas.String,
    matchCounter: Schemas.Int,
    roundNumber: Schemas.Int,
    phase: Schemas.String,
    status: Schemas.String,
    targetId: Schemas.String
  }),
  requestPlayAgain: Schemas.Map({}),
  submitDiscussion: Schemas.Map({
    matchCounter: Schemas.Int,
    template: Schemas.String,
    targetPlayerId: Schemas.String,
    claimedRole: Schemas.String,
    claimedResult: Schemas.String
  }),
  discussionAccepted: Schemas.Map({
    recipientId: Schemas.String,
    matchCounter: Schemas.Int,
    eventOrder: Schemas.Int
  }),
  actionRejected: Schemas.Map({ action: Schemas.String, reason: Schemas.String })
}

// registerMessages must execute during module loading, before the engine seals.
export const room = registerMessages(Messages)
