import { PlayerRole } from '../src/game/types'
import { PrivateRoleStore } from '../src/server/private-role-store'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function test(name: string, body: () => void): void {
  body()
  console.log(`PASS ${name}`)
}

function participants(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `player-${index + 1}`)
}

function countRole(assignments: ReadonlyMap<string, PlayerRole>, role: PlayerRole): number {
  return [...assignments.values()].filter((assignedRole) => assignedRole === role).length
}

const fourPlayerAssignments = new PrivateRoleStore().assignToParticipants(participants(4), () => 0.2)
const fivePlayerAssignments = new PrivateRoleStore().assignToParticipants(participants(5), () => 0.42)

test('four and five-player assignments contain exactly one Mafia', () => {
  assert(countRole(fourPlayerAssignments, PlayerRole.MAFIA) === 1, 'four players should have exactly one Mafia')
  assert(countRole(fivePlayerAssignments, PlayerRole.MAFIA) === 1, 'expected exactly one Mafia')
})

test('four and five-player assignments contain exactly one Doctor', () => {
  assert(countRole(fourPlayerAssignments, PlayerRole.DOCTOR) === 1, 'four players should have exactly one Doctor')
  assert(countRole(fivePlayerAssignments, PlayerRole.DOCTOR) === 1, 'expected exactly one Doctor')
})

test('four and five-player assignments contain exactly one Detective', () => {
  assert(countRole(fourPlayerAssignments, PlayerRole.DETECTIVE) === 1, 'four players should have exactly one Detective')
  assert(countRole(fivePlayerAssignments, PlayerRole.DETECTIVE) === 1, 'expected exactly one Detective')
})

test('four and five-player matches contain the correct Villager count', () => {
  assert(countRole(fourPlayerAssignments, PlayerRole.VILLAGER) === 1, 'four players should have one Villager')
  assert(countRole(fivePlayerAssignments, PlayerRole.VILLAGER) === 2, 'five players should have two Villagers')
})

test('a player identity cannot be assigned more than once', () => {
  const store = new PrivateRoleStore()
  let rejectedDuplicate = false
  try {
    store.assignToParticipants(['player-1', 'player-2', 'PLAYER-1', 'player-4'])
  } catch {
    rejectedDuplicate = true
  }
  assert(rejectedDuplicate, 'duplicate normalized player identities must be rejected')
  assert(store.size === 0, 'a rejected assignment must not leave partial role state')
})

test('only active match participants receive roles', () => {
  const activePlayers = participants(4)
  const store = new PrivateRoleStore()
  const assignments = store.assignToParticipants(activePlayers, () => 0.6)
  assert(assignments.size === activePlayers.length, 'every active participant should receive one role')
  assert(store.get('spectator-1') === null, 'a spectator must not receive a role')
})

test('assignment is randomized by the server random source', () => {
  const activePlayers = participants(4)
  const first = new PrivateRoleStore().assignToParticipants(activePlayers, () => 0)
  const second = new PrivateRoleStore().assignToParticipants(activePlayers, () => 0.999)
  const changed = activePlayers.some((playerId) => first.get(playerId) !== second.get(playerId))
  assert(changed, 'different random samples should be able to produce different assignments')
})

test('role assignment clears completely on reset', () => {
  const store = new PrivateRoleStore()
  store.assignToParticipants(participants(5), () => 0.4)
  store.clear()
  assert(store.size === 0, 'reset should clear every private assignment')
  assert(store.get('player-1') === null, 'a cleared role must not be recoverable')
})
