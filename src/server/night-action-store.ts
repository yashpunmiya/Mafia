import { DetectiveResult, GamePhase, PlayerRole, PrivateNightStatus } from '../game/types'

export interface NightSubmissionResult {
  accepted: boolean
  reason: string
}

export interface PrivateNightState {
  status: PrivateNightStatus
  targetId: string
  investigationResult: DetectiveResult | null
  previousDoctorTargetId: string
}

export interface NightResolution {
  victimId: string | null
  saved: boolean
  timedOutPlayerIds: string[]
  detectivePlayerId: string | null
  detectiveTargetId: string | null
  detectiveResult: DetectiveResult | null
}

interface NightSubmission {
  role: PlayerRole
  targetId: string
}

const ACTION_ROLES = new Set<PlayerRole>([PlayerRole.MAFIA, PlayerRole.DOCTOR, PlayerRole.DETECTIVE])

export class NightActionStore {
  private matchCounter = 0
  private readonly rolesByPlayerId = new Map<string, PlayerRole>()
  private readonly livingPlayerIds = new Set<string>()
  private readonly submissionsByPlayerId = new Map<string, NightSubmission>()
  private resolution: NightResolution | null = null
  private previousDoctorTargetId: string | null = null

  startMatch(matchCounter: number, assignments: ReadonlyMap<string, PlayerRole>): void {
    if (!Number.isInteger(matchCounter) || matchCounter < 1) throw new Error('A valid match counter is required.')
    if (assignments.size < 4 || assignments.size > 5) throw new Error('Night actions require 4-5 assigned participants.')

    const normalizedAssignments = new Map<string, PlayerRole>()
    for (const [playerId, role] of assignments) {
      const id = normalizeIdentity(playerId)
      if (!id || normalizedAssignments.has(id)) throw new Error('Night actions received an invalid participant set.')
      normalizedAssignments.set(id, role)
    }

    this.clear()
    this.matchCounter = matchCounter
    for (const [id, role] of normalizedAssignments) {
      this.rolesByPlayerId.set(id, role)
      this.livingPlayerIds.add(id)
    }
  }

  startNextNight(livingPlayerIds: readonly string[]): void {
    if (this.matchCounter < 1 || this.rolesByPlayerId.size === 0) throw new Error('A match must exist first.')
    const living = livingPlayerIds.map(normalizeIdentity)
    if (
      living.some((id) => !id || !this.rolesByPlayerId.has(id)) ||
      new Set(living).size !== living.length
    ) {
      throw new Error('Next-night living participants must belong to the active match.')
    }
    this.livingPlayerIds.clear()
    living.forEach((id) => this.livingPlayerIds.add(id))
    this.submissionsByPlayerId.clear()
    this.resolution = null
  }

  submit(
    actorId: string,
    targetId: string,
    matchCounter: number,
    phase: GamePhase
  ): NightSubmissionResult {
    const actor = normalizeIdentity(actorId)
    const target = normalizeIdentity(targetId)
    if (phase !== GamePhase.NIGHT_ACTION) return rejected('Night actions are closed.')
    if (matchCounter !== this.matchCounter || this.matchCounter < 1) return rejected('This action is for a stale match.')
    if (this.resolution) return rejected('The night has already been resolved.')

    const role = this.rolesByPlayerId.get(actor)
    if (!role) return rejected('Only active match participants may act.')
    if (!this.livingPlayerIds.has(actor)) return rejected('Dead players cannot act.')
    if (!ACTION_ROLES.has(role)) return rejected('Your role has no night action.')
    if (this.submissionsByPlayerId.has(actor)) return rejected('Your night action is already locked.')
    if (!target || !this.rolesByPlayerId.has(target)) return rejected('That target is not an active participant.')
    if (!this.livingPlayerIds.has(target)) return rejected('That target is not alive.')
    if ((role === PlayerRole.MAFIA || role === PlayerRole.DETECTIVE) && target === actor) {
      return rejected('Your role cannot target itself.')
    }
    if (role === PlayerRole.DOCTOR && target === this.previousDoctorTargetId) {
      return rejected('The Doctor cannot protect the same player on consecutive nights.')
    }

    this.submissionsByPlayerId.set(actor, { role, targetId: target })
    return { accepted: true, reason: '' }
  }

  getPrivateState(playerId: string, matchCounter: number): PrivateNightState | null {
    const id = normalizeIdentity(playerId)
    const role = this.rolesByPlayerId.get(id)
    if (!role || matchCounter !== this.matchCounter) return null

    const submission = this.submissionsByPlayerId.get(id)
    if (this.resolution) {
      const investigationResult =
        role === PlayerRole.DETECTIVE && this.resolution.detectivePlayerId === id
          ? this.resolution.detectiveResult
          : null
      return {
        status: PrivateNightStatus.RESOLVED,
        targetId: submission?.targetId ?? '',
        investigationResult,
        previousDoctorTargetId: role === PlayerRole.DOCTOR ? this.previousDoctorTargetId ?? '' : ''
      }
    }

    if (!this.livingPlayerIds.has(id) || role === PlayerRole.VILLAGER) {
      return {
        status: PrivateNightStatus.WAITING,
        targetId: '',
        investigationResult: null,
        previousDoctorTargetId: role === PlayerRole.DOCTOR ? this.previousDoctorTargetId ?? '' : ''
      }
    }
    if (submission) {
      return {
        status: PrivateNightStatus.SUBMITTED,
        targetId: submission.targetId,
        investigationResult: null,
        previousDoctorTargetId: role === PlayerRole.DOCTOR ? this.previousDoctorTargetId ?? '' : ''
      }
    }
    return {
      status: PrivateNightStatus.ACTION_REQUIRED,
      targetId: '',
      investigationResult: null,
      previousDoctorTargetId: role === PlayerRole.DOCTOR ? this.previousDoctorTargetId ?? '' : ''
    }
  }

  resolve(matchCounter: number): NightResolution {
    if (matchCounter !== this.matchCounter || this.matchCounter < 1) {
      throw new Error('Cannot resolve a stale match.')
    }
    if (this.resolution) return cloneResolution(this.resolution)

    const mafiaId = this.findLivingPlayerByRole(PlayerRole.MAFIA)
    const doctorId = this.findLivingPlayerByRole(PlayerRole.DOCTOR)
    const detectiveId = this.findLivingPlayerByRole(PlayerRole.DETECTIVE)
    const mafiaTarget = mafiaId ? this.submissionsByPlayerId.get(mafiaId)?.targetId ?? null : null
    const doctorTarget = doctorId ? this.submissionsByPlayerId.get(doctorId)?.targetId ?? null : null
    const detectiveTarget = detectiveId ? this.submissionsByPlayerId.get(detectiveId)?.targetId ?? null : null
    const saved = mafiaTarget !== null && mafiaTarget === doctorTarget
    const victimId = mafiaTarget && !saved ? mafiaTarget : null
    const detectiveResult = detectiveTarget
      ? this.rolesByPlayerId.get(detectiveTarget) === PlayerRole.MAFIA
        ? DetectiveResult.MAFIA
        : DetectiveResult.NOT_MAFIA
      : null
    const timedOutPlayerIds = [mafiaId, doctorId, detectiveId].filter(
      (id): id is string => id !== null && !this.submissionsByPlayerId.has(id)
    )

    this.previousDoctorTargetId = doctorTarget

    if (victimId) this.livingPlayerIds.delete(victimId)
    this.resolution = {
      victimId,
      saved,
      timedOutPlayerIds,
      detectivePlayerId: detectiveTarget ? detectiveId : null,
      detectiveTargetId: detectiveTarget,
      detectiveResult
    }
    return cloneResolution(this.resolution)
  }

  markDead(playerId: string): void {
    this.livingPlayerIds.delete(normalizeIdentity(playerId))
  }

  isLiving(playerId: string): boolean {
    return this.livingPlayerIds.has(normalizeIdentity(playerId))
  }

  get isResolved(): boolean {
    return this.resolution !== null
  }

  clear(): void {
    this.matchCounter = 0
    this.rolesByPlayerId.clear()
    this.livingPlayerIds.clear()
    this.submissionsByPlayerId.clear()
    this.resolution = null
    this.previousDoctorTargetId = null
  }

  get submissionCount(): number {
    return this.submissionsByPlayerId.size
  }

  private findLivingPlayerByRole(role: PlayerRole): string | null {
    for (const [playerId, assignedRole] of this.rolesByPlayerId) {
      if (assignedRole === role && this.livingPlayerIds.has(playerId)) return playerId
    }
    return null
  }
}

function normalizeIdentity(value: string): string {
  return value.trim().toLowerCase()
}

function rejected(reason: string): NightSubmissionResult {
  return { accepted: false, reason }
}

function cloneResolution(resolution: NightResolution): NightResolution {
  return { ...resolution, timedOutPlayerIds: [...resolution.timedOutPlayerIds] }
}
