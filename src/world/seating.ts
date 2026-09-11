import { engine, Transform, getWorldPosition, timers, AvatarEmoteCommand, EmoteState } from '@dcl/sdk/ecs'
import { movePlayerTo, stopEmote, triggerSceneEmote } from '~system/RestrictedActions'
import { getClientViewState } from '../multiplayer/client-network'
import { GamePhase } from '../game/types'
import { councilSeatIndex } from './seat-assignment'
import { councilAvatarPosition, COUNCIL_SITTING_EMOTE } from './seat-position'
import { performSeating } from './seating-transport'

let busy = false
let seated = false
let message = ''
let generation = 0
let seatPosition: { x: number; y: number; z: number } | null = null
let nextAutomaticSeatAttemptAt = 0

export function getSeatingState() { return { busy, seated, message } }

// Presentation only: public roster order, never role or action state.
export async function takeCouncilSeat(): Promise<void> {
  if (busy) return
  const view = getClientViewState()
  const index = councilSeatIndex(view.players, view.localPlayerId, view.phase)
  if (index < 0 || index > 4) { message = 'Council seats are for living players.'; return }
  const token = ++generation
  busy = true
  message = 'Taking your council seat...'
  const anchor = engine.getEntityOrNullByName(`Council Seat ${index + 1}`)
  if (!anchor || !Transform.has(anchor)) {
    busy = false
    message = 'Chair is still loading. Please try again.'
    return
  }
  // Use the actual scene anchor, not a second copy of the chair-layout formula.
  const position = councilAvatarPosition(getWorldPosition(engine, anchor))
  let stage: 'move' | 'pose' = 'move'
  try {
    // A teleport already interrupts the old emote. Do not require stopEmote,
    // or newer duration-based movement, to succeed on the mobile client.
    const completed = await performSeating({
      move: () => movePlayerTo({ newRelativePosition: position, cameraTarget: { x: 8, y: 1.2, z: 8 }, avatarTarget: { x: 8, y: position.y, z: 8 } }),
      valid: () => {
        const current = getClientViewState()
        return token === generation && current.matchCounter === view.matchCounter && councilSeatIndex(current.players, current.localPlayerId, current.phase) === index
      },
      settle: async () => {
        let stable = 0
        for (let i = 0; i < 16; i++) {
          await new Promise<void>(resolve => timers.setTimeout(resolve, 150))
          if (token !== generation) return false
          const feet = Transform.getOrNull(engine.PlayerEntity)?.position
          stable = feet && Math.hypot(feet.x-position.x, feet.z-position.z) < .35 ? stable + 1 : 0
          if (stable >= 3) return true
        }
        message = 'Hold still near your chair, then tap SIT again.'
        return false
      },
      stage: value => { stage = value; message = value === 'move' ? 'Moving to your chair...' : 'Loading seated animation...' },
      play: () => triggerSceneEmote({ src: COUNCIL_SITTING_EMOTE, loop: true })
    })
    if (!completed) {
      if (token !== generation) { try { await stopEmote({}) } catch { /* Walking also interrupts the pose. */ } }
      return
    }
    if (token !== generation) { await stopEmote({}); return }
    seatPosition = position
    seated = true
    const currentPhase = getClientViewState().phase
    message = isActiveCouncilPhase(currentPhase) ? 'Seated at the council for this round.' : 'Move to stand, or tap LEAVE SEAT.'
  } catch (error) {
    // Restricted-action errors contain no role/action data. Preserve the stage
    // in diagnostics instead of disguising every failure as an Explorer limit.
    console.error(`[SEATING:${stage}] ${String(error).slice(0, 240)}`)
    message = stage === 'move' ? 'Chair movement failed. Re-enter the scene and retry.' : 'Chair reached; animation failed to load. Retry SIT or update the app.'
  } finally { busy = false }
}

export async function leaveCouncilSeat(): Promise<void> {
  ++generation
  seated = false
  seatPosition = null
  message = ''
  try { await stopEmote({}) } catch { /* Movement also cancels native emotes. */ }
}

export function setupSeating(): void {
  AvatarEmoteCommand.onChange(engine.PlayerEntity, cmd => {
    if (!cmd || !seated) return
    const state = cmd.state ?? EmoteState.ES_STARTED
    if (state === EmoteState.ES_FINISHED || state === EmoteState.ES_INTERRUPTED) {
      seated = false; seatPosition = null; message = ''
    }
  })
  engine.addSystem(() => {
    const view = getClientViewState()
    const local = view.players.find(p => p.id === view.localPlayerId)
    const shouldStaySeated = !!local?.alive && local.connected && local.status === 'PLAYER' && local.matchParticipant && isActiveCouncilPhase(view.phase)
    if (busy && (!local?.alive || !local.connected || local.status !== 'PLAYER' || view.phase === GamePhase.GAME_OVER)) ++generation
    if (shouldStaySeated && !busy && !seated && Date.now() >= nextAutomaticSeatAttemptAt) {
      nextAutomaticSeatAttemptAt = Date.now() + 5000
      void takeCouncilSeat()
    }
    if (!shouldStaySeated) nextAutomaticSeatAttemptAt = 0
    if (seated && (!local?.alive || !local.connected || local.status !== 'PLAYER' || view.phase === GamePhase.GAME_OVER)) void leaveCouncilSeat()
    const position = Transform.getOrNull(engine.PlayerEntity)?.position
    if (seated && position && seatPosition && Math.hypot(position.x-seatPosition.x, position.z-seatPosition.z) > .9) {
      seated = false; seatPosition = null; message = ''
    }
  })
}

function isActiveCouncilPhase(phase: GamePhase): boolean {
  return phase !== GamePhase.BOOT && phase !== GamePhase.LOBBY && phase !== GamePhase.GAME_OVER
}
