import { MAX_PLAYERS } from '../src/config/constants'
import { GameController } from '../src/game/game-controller'
import { classifyLobbyRoster } from '../src/game/roster'
import { secondsRemaining } from '../src/game/timers'
import { GamePhase } from '../src/game/types'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function test(name: string, body: () => void): void {
  body()
  console.log(`PASS ${name}`)
}

test('lobby waits until the roster is ready', () => {
  const controller = new GameController()
  controller.start(1_000)
  assert(controller.phase === GamePhase.LOBBY, 'controller should enter lobby')
  assert(controller.tick(2_000, false) === null, 'lobby should not advance early')
})

test('ready lobby starts and follows the milestone phase skeleton', () => {
  const controller = new GameController()
  controller.start(0)
  const start = controller.tick(100, true)
  assert(start?.to === GamePhase.STARTING, 'ready lobby should start')
  assert(controller.matchCounter === 1, 'server-owned match counter should increment')
  controller.tick(controller.phaseEndsAt, true)
  assert(controller.phase === GamePhase.ROLE_REVEAL, 'countdown should enter role reveal')
  controller.tick(controller.phaseEndsAt, true)
  assert(controller.phase === GamePhase.NIGHT_ACTION, 'role reveal should enter night action')
})

test('starting cancels safely if the lobby stops being ready', () => {
  const controller = new GameController()
  controller.start(0)
  controller.tick(1, true)
  controller.tick(2, false)
  assert(controller.phase === GamePhase.LOBBY, 'starting should cancel back to lobby')
})

test('roster caps players at five and marks overflow as spectators', () => {
  const roster = classifyLobbyRoster(
    Array.from({ length: 7 }, (_, index) => ({ id: `player-${index}`, joinedOrder: index }))
  )
  assert(roster.playerIds.length === MAX_PLAYERS, 'active roster must be capped at five')
  assert(roster.spectatorIds.length === 2, 'overflow visitors should spectate')
})

test('timer display clamps at zero', () => {
  assert(secondsRemaining(5_001, 1_000) === 5, 'timer should round up partial seconds')
  assert(secondsRemaining(1_000, 2_000) === 0, 'expired timer should clamp to zero')
})
