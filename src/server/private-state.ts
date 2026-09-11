import { room } from '../shared/messages'
import { DetectiveResult, PlayerRole } from '../game/types'
import { PrivateNightState } from './night-action-store'
import { PrivateVoteState } from './voting-store'
import { isValidNonce, normalizePlayerId } from './validators'

export function sendPrivateProof(senderAddress: string, nonce: string): boolean {
  const recipientId = normalizePlayerId(senderAddress)
  if (!recipientId || !isValidNonce(nonce)) return false

  // The recipient is derived only from the server-verified message context.
  const proofId = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000_000).toString(36)}`
  void room.send('privateProof', { recipientId, nonce, proofId }, { to: [recipientId] })
  return true
}

export function sendPrivateRole(
  senderAddress: string,
  nonce: string,
  matchCounter: number,
  role: PlayerRole
): boolean {
  const recipientId = normalizePlayerId(senderAddress)
  if (!recipientId || !isValidNonce(nonce) || !Number.isInteger(matchCounter) || matchCounter < 1) return false

  // Both lookup and recipient originate from the server-verified message context.
  void room.send('privateRole', { recipientId, nonce, matchCounter, role }, { to: [recipientId] })
  return true
}

export function sendPrivateNightState(
  senderAddress: string,
  nonce: string,
  matchCounter: number,
  state: PrivateNightState
): boolean {
  const recipientId = normalizePlayerId(senderAddress)
  if (!recipientId || !isValidNonce(nonce) || !Number.isInteger(matchCounter) || matchCounter < 1) return false

  void room.send(
    'privateNightState',
    {
      recipientId,
      nonce,
      matchCounter,
      status: state.status,
      targetId: state.targetId,
      investigationResult: state.investigationResult ?? '',
      previousDoctorTargetId: state.previousDoctorTargetId
    },
    { to: [recipientId] }
  )
  return true
}

export function sendPrivateVoteState(
  senderAddress: string,
  nonce: string,
  matchCounter: number,
  roundNumber: number,
  phase: string,
  state: PrivateVoteState
): boolean {
  const recipientId = normalizePlayerId(senderAddress)
  if (
    !recipientId ||
    !isValidNonce(nonce) ||
    !Number.isInteger(matchCounter) ||
    matchCounter < 1 ||
    !Number.isInteger(roundNumber) ||
    roundNumber < 1
  ) {
    return false
  }

  void room.send(
    'privateVoteState',
    {
      recipientId,
      nonce,
      matchCounter,
      roundNumber,
      phase,
      status: state.status,
      targetId: state.targetId
    },
    { to: [recipientId] }
  )
  return true
}

export function sendPrivateDetectiveResult(
  senderAddress: string,
  matchCounter: number,
  targetId: string,
  investigationResult: DetectiveResult
): boolean {
  const recipientId = normalizePlayerId(senderAddress)
  const normalizedTargetId = normalizePlayerId(targetId)
  if (!recipientId || !normalizedTargetId || !Number.isInteger(matchCounter) || matchCounter < 1) return false

  void room.send(
    'privateDetectiveResult',
    { recipientId, matchCounter, targetId: normalizedTargetId, investigationResult },
    { to: [recipientId] }
  )
  return true
}
