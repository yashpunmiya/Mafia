import {
  DetectiveResult,
  GamePhase,
  PlayerRole,
  PrivateNightStatus
} from '../src/game/types'
import { NightActionStore } from '../src/server/night-action-store'

const MATCH = 11
const MAFIA = 'player-mafia'
const DOCTOR = 'player-doctor'
const DETECTIVE = 'player-detective'
const VILLAGER = 'player-villager'
const SPECTATOR = 'player-spectator'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function test(name: string, body: () => void): void {
  body()
  console.log(`PASS ${name}`)
}

function createNight(): NightActionStore {
  const store = new NightActionStore()
  store.startMatch(
    MATCH,
    new Map([
      [MAFIA, PlayerRole.MAFIA],
      [DOCTOR, PlayerRole.DOCTOR],
      [DETECTIVE, PlayerRole.DETECTIVE],
      [VILLAGER, PlayerRole.VILLAGER]
    ])
  )
  return store
}

test('invalid phase, match, actor, and target actions are rejected', () => {
  const store = createNight()
  assert(!store.submit(MAFIA, VILLAGER, MATCH, GamePhase.ROLE_REVEAL).accepted, 'wrong phase must fail')
  assert(!store.submit(MAFIA, VILLAGER, MATCH + 1, GamePhase.NIGHT_ACTION).accepted, 'stale match must fail')
  assert(!store.submit(SPECTATOR, VILLAGER, MATCH, GamePhase.NIGHT_ACTION).accepted, 'spectator must fail')
  assert(!store.submit(MAFIA, SPECTATOR, MATCH, GamePhase.NIGHT_ACTION).accepted, 'unknown target must fail')
  assert(store.submissionCount === 0, 'invalid actions must not mutate submissions')
})

test('duplicate submissions are rejected and cannot replace the locked target', () => {
  const store = createNight()
  assert(store.submit(MAFIA, VILLAGER, MATCH, GamePhase.NIGHT_ACTION).accepted, 'first action should pass')
  assert(!store.submit(MAFIA, DOCTOR, MATCH, GamePhase.NIGHT_ACTION).accepted, 'duplicate action must fail')
  assert(store.submissionCount === 1, 'only the first submission should remain')
  assert(store.getPrivateState(MAFIA, MATCH)?.targetId === VILLAGER, 'first target must stay locked')
})

test('dead actors and dead targets are rejected', () => {
  const deadActorStore = createNight()
  deadActorStore.markDead(MAFIA)
  assert(!deadActorStore.submit(MAFIA, VILLAGER, MATCH, GamePhase.NIGHT_ACTION).accepted, 'dead actor must fail')

  const deadTargetStore = createNight()
  deadTargetStore.markDead(VILLAGER)
  assert(!deadTargetStore.submit(MAFIA, VILLAGER, MATCH, GamePhase.NIGHT_ACTION).accepted, 'dead target must fail')
})

test('Mafia and Detective cannot target self while Doctor can', () => {
  const store = createNight()
  assert(!store.submit(MAFIA, MAFIA, MATCH, GamePhase.NIGHT_ACTION).accepted, 'Mafia self-target must fail')
  assert(
    !store.submit(DETECTIVE, DETECTIVE, MATCH, GamePhase.NIGHT_ACTION).accepted,
    'Detective self-target must fail'
  )
  assert(store.submit(DOCTOR, DOCTOR, MATCH, GamePhase.NIGHT_ACTION).accepted, 'Doctor self-protection should pass')
})

test('Villager receives waiting state and cannot submit an action', () => {
  const store = createNight()
  assert(!store.submit(VILLAGER, MAFIA, MATCH, GamePhase.NIGHT_ACTION).accepted, 'Villager action must fail')
  assert(
    store.getPrivateState(VILLAGER, MATCH)?.status === PrivateNightStatus.WAITING,
    'Villager should receive waiting state'
  )
})

test('matching Doctor protection prevents the Mafia kill', () => {
  const store = createNight()
  store.submit(MAFIA, VILLAGER, MATCH, GamePhase.NIGHT_ACTION)
  store.submit(DOCTOR, VILLAGER, MATCH, GamePhase.NIGHT_ACTION)
  const resolution = store.resolve(MATCH)
  assert(resolution.saved, 'matching targets should be marked saved')
  assert(resolution.victimId === null, 'a protected target must survive')
  assert(store.isLiving(VILLAGER), 'protected target should remain living')
})

test('an unprotected Mafia target becomes the authoritative victim', () => {
  const store = createNight()
  store.submit(MAFIA, VILLAGER, MATCH, GamePhase.NIGHT_ACTION)
  store.submit(DOCTOR, DOCTOR, MATCH, GamePhase.NIGHT_ACTION)
  const resolution = store.resolve(MATCH)
  assert(!resolution.saved, 'different targets should not be marked saved')
  assert(resolution.victimId === VILLAGER, 'Mafia target should be the victim')
  assert(!store.isLiving(VILLAGER), 'resolved victim should no longer be living')
})

test('Detective result is available only in the Detective private state', () => {
  const store = createNight()
  store.submit(MAFIA, VILLAGER, MATCH, GamePhase.NIGHT_ACTION)
  store.submit(DOCTOR, DOCTOR, MATCH, GamePhase.NIGHT_ACTION)
  store.submit(DETECTIVE, MAFIA, MATCH, GamePhase.NIGHT_ACTION)
  store.resolve(MATCH)

  assert(
    store.getPrivateState(DETECTIVE, MATCH)?.investigationResult === DetectiveResult.MAFIA,
    'Detective should privately learn Mafia'
  )
  assert(
    store.getPrivateState(MAFIA, MATCH)?.investigationResult === null,
    'Mafia private state must not contain the investigation'
  )
  assert(
    store.getPrivateState(DOCTOR, MATCH)?.investigationResult === null,
    'Doctor private state must not contain the investigation'
  )
  assert(store.getPrivateState(SPECTATOR, MATCH) === null, 'spectator must receive no private night state')

  const nonMafiaNight = createNight()
  nonMafiaNight.submit(DETECTIVE, DOCTOR, MATCH, GamePhase.NIGHT_ACTION)
  nonMafiaNight.resolve(MATCH)
  assert(
    nonMafiaNight.getPrivateState(DETECTIVE, MATCH)?.investigationResult === DetectiveResult.NOT_MAFIA,
    'Detective should privately learn Not Mafia for a non-Mafia target'
  )
})

test('timeout resolves safely with missing actions', () => {
  const emptyNight = createNight()
  const emptyResolution = emptyNight.resolve(MATCH)
  assert(emptyResolution.victimId === null, 'missing Mafia action should produce no victim')
  assert(emptyResolution.timedOutPlayerIds.length === 3, 'all three action roles should time out')

  const mafiaOnlyNight = createNight()
  mafiaOnlyNight.submit(MAFIA, VILLAGER, MATCH, GamePhase.NIGHT_ACTION)
  const mafiaOnlyResolution = mafiaOnlyNight.resolve(MATCH)
  assert(mafiaOnlyResolution.victimId === VILLAGER, 'missing Doctor action should not invent a protection')
  assert(mafiaOnlyResolution.timedOutPlayerIds.includes(DOCTOR), 'Doctor timeout should be recorded')
  assert(mafiaOnlyResolution.timedOutPlayerIds.includes(DETECTIVE), 'Detective timeout should be recorded')
})

test('reset clears submissions, results, living state, and recovery data', () => {
  const store = createNight()
  store.submit(MAFIA, VILLAGER, MATCH, GamePhase.NIGHT_ACTION)
  store.resolve(MATCH)
  store.clear()
  assert(store.submissionCount === 0, 'reset should clear submissions')
  assert(!store.isResolved, 'reset should clear resolution')
  assert(!store.isLiving(MAFIA), 'reset should clear living identities')
  assert(store.getPrivateState(MAFIA, MATCH) === null, 'old private state must not be recoverable')
})
