import {
  DiscussionStore,
  DiscussionTemplate,
  MAX_DISCUSSION_EVENTS,
  PublicClaimResult,
  PublicClaimRole
} from '../src/game/discussion'
import { GamePhase, PlayerRole } from '../src/game/types'

const MATCH = 55
const MAFIA = 'player-mafia'
const DOCTOR = 'player-doctor'
const DETECTIVE = 'player-detective'
const VILLAGER = 'player-villager'
const SPECTATOR = 'player-spectator'
const PLAYERS = [
  { id: MAFIA, name: 'Maya' },
  { id: DOCTOR, name: 'Chris' },
  { id: DETECTIVE, name: 'Sam' },
  { id: VILLAGER, name: 'Alex' }
]

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function test(name: string, body: () => void): void {
  body()
  console.log(`PASS ${name}`)
}

function createStore(living = PLAYERS): DiscussionStore {
  const store = new DiscussionStore()
  store.startMatch(MATCH)
  store.beginDiscussion(MATCH, living)
  return store
}

test('dead player cannot send discussion event', () => {
  const store = createStore(PLAYERS.filter((player) => player.id !== VILLAGER))
  assert(!store.submit(VILLAGER, { template: DiscussionTemplate.INNOCENT }, MATCH, GamePhase.DISCUSSION, 1_000).accepted, 'dead player must be rejected')
})

test('spectator cannot send discussion event', () => {
  const store = createStore()
  assert(!store.submit(SPECTATOR, { template: DiscussionTemplate.WHY }, MATCH, GamePhase.DISCUSSION, 1_000).accepted, 'spectator must be rejected')
})

test('wrong phase and stale match are rejected', () => {
  const store = createStore()
  assert(!store.submit(MAFIA, { template: DiscussionTemplate.WHY }, MATCH, GamePhase.VOTING, 1_000).accepted, 'wrong phase must fail')
  assert(!store.submit(MAFIA, { template: DiscussionTemplate.WHY }, MATCH - 1, GamePhase.DISCUSSION, 1_000).accepted, 'stale match must fail')
})

test('invalid template and target are rejected', () => {
  const store = createStore()
  assert(!store.submit(MAFIA, { template: 'FREE_TEXT' }, MATCH, GamePhase.DISCUSSION, 1_000).accepted, 'arbitrary template must fail')
  assert(!store.submit(MAFIA, { template: DiscussionTemplate.SUSPECT, targetPlayerId: SPECTATOR }, MATCH, GamePhase.DISCUSSION, 1_000).accepted, 'invalid target must fail')
  assert(!store.submit(MAFIA, { template: DiscussionTemplate.SUSPECT, targetPlayerId: MAFIA }, MATCH, GamePhase.DISCUSSION, 1_000).accepted, 'self accusation must fail')
})

test('valid accusation is server-rendered and accepted', () => {
  const store = createStore()
  const result = store.submit(MAFIA, { template: DiscussionTemplate.SUSPECT, targetPlayerId: VILLAGER }, MATCH, GamePhase.DISCUSSION, 1_000)
  assert(result.accepted && result.event?.message === 'I suspect Alex.', 'server should construct safe accusation text')
})

test('Mafia may publicly claim Detective and Villager may claim Doctor', () => {
  const actualRoles = new Map([[MAFIA, PlayerRole.MAFIA], [VILLAGER, PlayerRole.VILLAGER]])
  const store = createStore()
  assert(store.submit(MAFIA, { template: DiscussionTemplate.CLAIM_ROLE, claimedRole: PublicClaimRole.DETECTIVE }, MATCH, GamePhase.DISCUSSION, 1_000).accepted, 'Mafia bluff must pass')
  assert(store.submit(VILLAGER, { template: DiscussionTemplate.CLAIM_ROLE, claimedRole: PublicClaimRole.DOCTOR }, MATCH, GamePhase.DISCUSSION, 1_000).accepted, 'Villager bluff must pass')
  assert(actualRoles.get(MAFIA) === PlayerRole.MAFIA, 'private truth remains separate')
})

test('public Detective-style claim may intentionally disagree with private truth', () => {
  const store = createStore()
  const result = store.submit(VILLAGER, {
    template: DiscussionTemplate.CLAIM_CHECK,
    targetPlayerId: MAFIA,
    claimedResult: PublicClaimResult.NOT_MAFIA
  }, MATCH, GamePhase.DISCUSSION, 1_000)
  assert(result.accepted && result.event?.claimedResult === PublicClaimResult.NOT_MAFIA, 'false investigation claim must pass')
})

test('claim board stores public claim only and changing claim updates it', () => {
  const store = createStore()
  store.submit(MAFIA, { template: DiscussionTemplate.CLAIM_ROLE, claimedRole: PublicClaimRole.VILLAGER }, MATCH, GamePhase.DISCUSSION, 1_000)
  store.submit(MAFIA, { template: DiscussionTemplate.CLAIM_ROLE, claimedRole: PublicClaimRole.DETECTIVE }, MATCH, GamePhase.DISCUSSION, 2_500)
  assert(store.publicRoleClaims.length === 1, 'board should keep only latest claim per player')
  assert(store.publicRoleClaims[0].playerRef === 'P1' && store.publicRoleClaims[0].publicRoleClaim === PublicClaimRole.DETECTIVE, 'latest public claim should replace old claim')
  const publicJson = JSON.stringify({ events: store.events, claims: store.publicRoleClaims })
  assert(!publicJson.includes('actualRole') && !publicJson.includes('privateRole') && !publicJson.includes('investigationResult'), 'public discussion must not contain private role/result fields')
  assert(!publicJson.includes(MAFIA) && !publicJson.includes(VILLAGER), 'public discussion must not contain raw player identities')
})

test('cooldown blocks spam without mutating history', () => {
  const store = createStore()
  assert(store.submit(MAFIA, { template: DiscussionTemplate.WHY }, MATCH, GamePhase.DISCUSSION, 1_000).accepted, 'first event should pass')
  assert(!store.submit(MAFIA, { template: DiscussionTemplate.PROVE_IT }, MATCH, GamePhase.DISCUSSION, 2_499).accepted, 'event inside cooldown must fail')
  assert(store.events.length === 1, 'rejected spam must not enter history')
  assert(store.submit(MAFIA, { template: DiscussionTemplate.PROVE_IT }, MATCH, GamePhase.DISCUSSION, 2_500).accepted, 'event at cooldown boundary should pass')
})

test('discussion messages stay bounded', () => {
  const store = createStore()
  for (let index = 0; index < MAX_DISCUSSION_EVENTS + 7; index += 1) {
    store.submit(MAFIA, { template: DiscussionTemplate.WAIT }, MATCH, GamePhase.DISCUSSION, index * 1_500)
  }
  assert(store.events.length === MAX_DISCUSSION_EVENTS, 'history must stay within public-state bound')
  assert(store.events[0].order === 8, 'oldest messages should be dropped first')
})

test('reset clears discussion feed, claims, cooldown and match context', () => {
  const store = createStore()
  store.submit(MAFIA, { template: DiscussionTemplate.CLAIM_ROLE, claimedRole: PublicClaimRole.DETECTIVE }, MATCH, GamePhase.DISCUSSION, 1_000)
  store.clear()
  assert(store.events.length === 0 && store.publicRoleClaims.length === 0, 'reset must clear all public social state')
  assert(!store.submit(MAFIA, { template: DiscussionTemplate.WHY }, MATCH, GamePhase.DISCUSSION, 3_000).accepted, 'old match cannot speak after reset')
})
