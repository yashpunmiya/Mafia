import { GameController } from '../src/game/game-controller'
import { GamePhase, PlayerRole, PrivateNightStatus, PrivateVoteStatus, WinnerTeam } from '../src/game/types'
import { NightActionStore } from '../src/server/night-action-store'
import { PrivateRoleStore } from '../src/server/private-role-store'
import { createPublicRoleReveal } from '../src/server/public-results'
import { VotingStore } from '../src/server/voting-store'
import { computeWinner } from '../src/server/win-conditions'

const MATCH = 21
const ROUND = 1
const MAFIA = 'player-mafia'
const DOCTOR = 'player-doctor'
const DETECTIVE = 'player-detective'
const VILLAGER = 'player-villager'
const SPECTATOR = 'player-spectator'
const LIVING = [MAFIA, DOCTOR, DETECTIVE, VILLAGER]
const ROLES = new Map<string, PlayerRole>([
  [MAFIA, PlayerRole.MAFIA],
  [DOCTOR, PlayerRole.DOCTOR],
  [DETECTIVE, PlayerRole.DETECTIVE],
  [VILLAGER, PlayerRole.VILLAGER]
])

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function test(name: string, body: () => void): void {
  body()
  console.log(`PASS ${name}`)
}

function createVoting(phase: GamePhase.VOTING | GamePhase.RUNOFF_VOTING = GamePhase.VOTING): VotingStore {
  const store = new VotingStore()
  store.startMatch(MATCH)
  store.startBallot(MATCH, ROUND, phase, LIVING, phase === GamePhase.RUNOFF_VOTING ? [MAFIA, DOCTOR] : [])
  return store
}

function createNight(): NightActionStore {
  const store = new NightActionStore()
  store.startMatch(MATCH, ROLES)
  return store
}

test('self-votes are rejected', () => {
  const voting = createVoting()
  assert(!voting.submit(MAFIA, MAFIA, MATCH, ROUND, GamePhase.VOTING).accepted, 'self-vote must fail')
  assert(voting.submissionCount === 0, 'self-vote must not mutate the ballot')
})

test('dead players and spectators cannot vote', () => {
  const voting = new VotingStore()
  voting.startMatch(MATCH)
  voting.startBallot(MATCH, ROUND, GamePhase.VOTING, [MAFIA, DOCTOR, DETECTIVE])
  assert(!voting.submit(VILLAGER, MAFIA, MATCH, ROUND, GamePhase.VOTING).accepted, 'dead player must fail')
  assert(!voting.submit(SPECTATOR, MAFIA, MATCH, ROUND, GamePhase.VOTING).accepted, 'spectator must fail')
})

test('one vote locks and duplicate votes cannot replace it', () => {
  const voting = createVoting()
  assert(voting.submit(MAFIA, DOCTOR, MATCH, ROUND, GamePhase.VOTING).accepted, 'first vote should pass')
  assert(!voting.submit(MAFIA, DETECTIVE, MATCH, ROUND, GamePhase.VOTING).accepted, 'duplicate must fail')
  assert(voting.getPrivateState(MAFIA, MATCH, ROUND, GamePhase.VOTING)?.targetId === DOCTOR, 'first vote stays locked')
})

test('invalid and stale match, round, phase, and target votes are rejected', () => {
  const voting = createVoting()
  assert(!voting.submit(MAFIA, DOCTOR, MATCH + 1, ROUND, GamePhase.VOTING).accepted, 'stale match must fail')
  assert(!voting.submit(MAFIA, DOCTOR, MATCH, ROUND + 1, GamePhase.VOTING).accepted, 'stale round must fail')
  assert(!voting.submit(MAFIA, DOCTOR, MATCH, ROUND, GamePhase.RUNOFF_VOTING).accepted, 'stale phase must fail')
  assert(!voting.submit(MAFIA, SPECTATOR, MATCH, ROUND, GamePhase.VOTING).accepted, 'invalid target must fail')
})

test('majority resolution eliminates the unique leader without exposing a live tally', () => {
  const voting = createVoting()
  voting.submit(MAFIA, VILLAGER, MATCH, ROUND, GamePhase.VOTING)
  voting.submit(DOCTOR, VILLAGER, MATCH, ROUND, GamePhase.VOTING)
  voting.submit(DETECTIVE, VILLAGER, MATCH, ROUND, GamePhase.VOTING)
  const result = voting.resolve()
  assert(result.eliminatedPlayerId === VILLAGER, 'unique vote leader should be eliminated')
  assert(result.runoffCandidateIds.length === 0, 'unique leader should not create runoff')
  assert(result.timedOutVoterIds.includes(VILLAGER), 'timeout state should include missing voter')
})

test('a first ballot tie produces only the tied runoff candidates', () => {
  const voting = createVoting()
  voting.submit(MAFIA, DOCTOR, MATCH, ROUND, GamePhase.VOTING)
  voting.submit(DOCTOR, MAFIA, MATCH, ROUND, GamePhase.VOTING)
  const result = voting.resolve()
  assert(result.tied, 'first ballot should tie')
  assert(result.eliminatedPlayerId === null, 'first tie must not eliminate')
  assert(result.runoffCandidateIds.length === 2, 'two leaders should enter runoff')
  assert(result.runoffCandidateIds.includes(MAFIA) && result.runoffCandidateIds.includes(DOCTOR), 'only tied leaders qualify')
})

test('a second tie produces no elimination', () => {
  const voting = createVoting(GamePhase.RUNOFF_VOTING)
  voting.submit(MAFIA, DOCTOR, MATCH, ROUND, GamePhase.RUNOFF_VOTING)
  voting.submit(DOCTOR, MAFIA, MATCH, ROUND, GamePhase.RUNOFF_VOTING)
  const result = voting.resolve()
  assert(result.tied, 'runoff should tie')
  assert(result.eliminatedPlayerId === null, 'second tie eliminates nobody')
  assert(result.runoffCandidateIds.length === 0, 'second tie cannot create another runoff')
})

test('eliminated player role reveal is explicitly public and contains no ballot mapping', () => {
  const reveal = createPublicRoleReveal(MAFIA.toUpperCase(), 'Alex', PlayerRole.MAFIA)
  assert(reveal.playerId === MAFIA, 'public reveal should use normalized eliminated identity')
  assert(reveal.role === PlayerRole.MAFIA, 'eliminated role should be public')
  assert(!('votesByPlayerId' in reveal), 'public reveal must not contain voter mappings')
})

test('eliminating Mafia produces a Village win', () => {
  assert(computeWinner([DOCTOR, DETECTIVE, VILLAGER], ROLES) === WinnerTeam.VILLAGE, 'no living Mafia means Village wins')
})

test('Mafia parity produces a Mafia win', () => {
  assert(computeWinner([MAFIA, DOCTOR], ROLES) === WinnerTeam.MAFIA, 'one Mafia versus one non-Mafia is parity')
})

test('repeated round cleanup clears transient night and vote state while preserving roles and survivors', () => {
  const night = createNight()
  night.submit(MAFIA, VILLAGER, MATCH, GamePhase.NIGHT_ACTION)
  night.submit(DOCTOR, DOCTOR, MATCH, GamePhase.NIGHT_ACTION)
  night.submit(DETECTIVE, MAFIA, MATCH, GamePhase.NIGHT_ACTION)
  night.resolve(MATCH)

  const voting = createVoting()
  voting.submit(MAFIA, DOCTOR, MATCH, ROUND, GamePhase.VOTING)
  voting.clearBallot()
  night.startNextNight([MAFIA, DOCTOR, DETECTIVE])

  assert(night.submissionCount === 0 && !night.isResolved, 'new night clears submissions and resolution')
  assert(night.getPrivateState(DETECTIVE, MATCH)?.investigationResult === null, 'Detective result clears')
  assert(night.getPrivateState(MAFIA, MATCH)?.status === PrivateNightStatus.ACTION_REQUIRED, 'surviving role may act')
  assert(voting.submissionCount === 0 && voting.activeCandidateIds.length === 0, 'vote and runoff state clears')
})

test('Doctor cannot protect the same player on consecutive nights', () => {
  const night = createNight()
  assert(night.submit(DOCTOR, VILLAGER, MATCH, GamePhase.NIGHT_ACTION).accepted, 'first protection should pass')
  night.resolve(MATCH)
  night.startNextNight(LIVING)
  assert(!night.submit(DOCTOR, VILLAGER, MATCH, GamePhase.NIGHT_ACTION).accepted, 'same consecutive target must fail')
  assert(night.submit(DOCTOR, DOCTOR, MATCH, GamePhase.NIGHT_ACTION).accepted, 'different target should pass')
})

test('a dead player cannot act on the next night', () => {
  const night = createNight()
  night.markDead(DETECTIVE)
  night.startNextNight([MAFIA, DOCTOR, VILLAGER])
  assert(!night.submit(DETECTIVE, MAFIA, MATCH, GamePhase.NIGHT_ACTION).accepted, 'dead Detective cannot act')
})

test('full play-again reset clears roles, actions, votes, recovery, and returns to lobby', () => {
  const roles = new PrivateRoleStore()
  roles.assignToParticipants(LIVING, () => 0.4)
  const night = createNight()
  night.submit(MAFIA, VILLAGER, MATCH, GamePhase.NIGHT_ACTION)
  const voting = createVoting()
  voting.submit(MAFIA, DOCTOR, MATCH, ROUND, GamePhase.VOTING)
  const controller = new GameController()
  controller.start(0)
  controller.tick(1, true)

  roles.clear()
  night.clear()
  voting.clear()
  controller.resetToLobby(2)

  assert(roles.size === 0, 'roles clear')
  assert(night.submissionCount === 0 && night.getPrivateState(MAFIA, MATCH) === null, 'night recovery clears')
  assert(voting.submissionCount === 0 && voting.getPrivateState(MAFIA, MATCH, ROUND, GamePhase.VOTING) === null, 'vote recovery clears')
  assert(controller.phase === GamePhase.LOBBY, 'play again returns to lobby for ready-again')
})
