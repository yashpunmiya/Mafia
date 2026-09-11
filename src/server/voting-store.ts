import { GamePhase, PrivateVoteStatus } from '../game/types'

export interface VoteSubmissionResult {
  accepted: boolean
  reason: string
}

export interface PrivateVoteState {
  status: PrivateVoteStatus
  targetId: string
}

export interface VoteResolution {
  eliminatedPlayerId: string | null
  runoffCandidateIds: string[]
  tied: boolean
  timedOutVoterIds: string[]
}

export class VotingStore {
  private matchCounter = 0
  private roundNumber = 0
  private phase: GamePhase | null = null
  private readonly eligibleVoterIds = new Set<string>()
  private readonly candidateIds = new Set<string>()
  private readonly votesByPlayerId = new Map<string, string>()

  startMatch(matchCounter: number): void {
    if (!Number.isInteger(matchCounter) || matchCounter < 1) throw new Error('A valid match counter is required.')
    this.clear()
    this.matchCounter = matchCounter
  }

  startBallot(
    matchCounter: number,
    roundNumber: number,
    phase: GamePhase.VOTING | GamePhase.RUNOFF_VOTING,
    livingPlayerIds: readonly string[],
    runoffCandidateIds: readonly string[] = []
  ): void {
    if (matchCounter !== this.matchCounter || this.matchCounter < 1) throw new Error('Cannot start a stale ballot.')
    if (!Number.isInteger(roundNumber) || roundNumber < 1) throw new Error('A valid round number is required.')

    const living = normalizeUnique(livingPlayerIds)
    const candidates =
      phase === GamePhase.RUNOFF_VOTING ? normalizeUnique(runoffCandidateIds) : living
    if (candidates.some((id) => !living.includes(id))) {
      throw new Error('Every ballot candidate must be a living participant.')
    }
    if (phase === GamePhase.RUNOFF_VOTING && candidates.length < 2) {
      throw new Error('A runoff requires at least two tied candidates.')
    }

    this.roundNumber = roundNumber
    this.phase = phase
    this.eligibleVoterIds.clear()
    this.candidateIds.clear()
    this.votesByPlayerId.clear()
    living.forEach((id) => this.eligibleVoterIds.add(id))
    candidates.forEach((id) => this.candidateIds.add(id))
  }

  submit(
    actorId: string,
    targetId: string,
    matchCounter: number,
    roundNumber: number,
    phase: GamePhase
  ): VoteSubmissionResult {
    const actor = normalizeIdentity(actorId)
    const target = normalizeIdentity(targetId)
    if (phase !== GamePhase.VOTING && phase !== GamePhase.RUNOFF_VOTING) {
      return rejected('Voting is closed.')
    }
    if (phase !== this.phase) return rejected('This vote is for a stale ballot.')
    if (matchCounter !== this.matchCounter || this.matchCounter < 1) return rejected('This vote is for a stale match.')
    if (roundNumber !== this.roundNumber || this.roundNumber < 1) return rejected('This vote is for a stale round.')
    if (!this.eligibleVoterIds.has(actor)) return rejected('Only living match participants may vote.')
    if (this.votesByPlayerId.has(actor)) return rejected('Your vote is already locked.')
    if (!this.candidateIds.has(target)) return rejected('That player is not eligible in this ballot.')
    if (actor === target) return rejected('You cannot vote for yourself.')

    this.votesByPlayerId.set(actor, target)
    return { accepted: true, reason: '' }
  }

  getPrivateState(
    playerId: string,
    matchCounter: number,
    roundNumber: number,
    phase: GamePhase
  ): PrivateVoteState | null {
    const id = normalizeIdentity(playerId)
    if (matchCounter !== this.matchCounter || roundNumber !== this.roundNumber || phase !== this.phase) return null
    if (!this.eligibleVoterIds.has(id)) return null
    const targetId = this.votesByPlayerId.get(id)
    return targetId
      ? { status: PrivateVoteStatus.SUBMITTED, targetId }
      : { status: PrivateVoteStatus.VOTE_REQUIRED, targetId: '' }
  }

  resolve(): VoteResolution {
    if (!this.phase) throw new Error('No ballot is active.')
    const totals = new Map<string, number>()
    for (const targetId of this.votesByPlayerId.values()) {
      totals.set(targetId, (totals.get(targetId) ?? 0) + 1)
    }
    const maxVotes = totals.size > 0 ? Math.max(...totals.values()) : 0
    const leaders = maxVotes > 0 ? [...totals].filter(([, votes]) => votes === maxVotes).map(([id]) => id) : []
    const tied = leaders.length > 1
    const isFirstBallot = this.phase === GamePhase.VOTING

    return {
      eliminatedPlayerId: leaders.length === 1 ? leaders[0] : null,
      runoffCandidateIds: tied && isFirstBallot ? leaders : [],
      tied,
      timedOutVoterIds: [...this.eligibleVoterIds].filter((id) => !this.votesByPlayerId.has(id))
    }
  }

  get allEligibleVoted(): boolean {
    return this.eligibleVoterIds.size > 0 && this.votesByPlayerId.size === this.eligibleVoterIds.size
  }

  get submissionCount(): number {
    return this.votesByPlayerId.size
  }

  get activeCandidateIds(): string[] {
    return [...this.candidateIds]
  }

  clearBallot(): void {
    this.roundNumber = 0
    this.phase = null
    this.eligibleVoterIds.clear()
    this.candidateIds.clear()
    this.votesByPlayerId.clear()
  }

  clear(): void {
    this.matchCounter = 0
    this.clearBallot()
  }
}

function normalizeIdentity(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeUnique(values: readonly string[]): string[] {
  const normalized = values.map(normalizeIdentity)
  if (normalized.some((id) => !id) || new Set(normalized).size !== normalized.length) {
    throw new Error('Ballot participants must be unique valid identities.')
  }
  return normalized
}

function rejected(reason: string): VoteSubmissionResult {
  return { accepted: false, reason }
}
