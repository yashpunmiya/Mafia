import { GamePhase } from './types'

export const DISCUSSION_COOLDOWN_MS = 1_500
export const MAX_DISCUSSION_EVENTS = 20

export enum DiscussionTemplate {
  SUSPECT = 'SUSPECT',
  LYING = 'LYING',
  VOTE_FOR = 'VOTE_FOR',
  DONT_TRUST = 'DONT_TRUST',
  INNOCENT = 'INNOCENT',
  DONT_VOTE_ME = 'DONT_VOTE_ME',
  TRUST_ME = 'TRUST_ME',
  DISAGREE = 'DISAGREE',
  YOU_ARE_WRONG = 'YOU_ARE_WRONG',
  CAN_EXPLAIN = 'CAN_EXPLAIN',
  CLAIM_ROLE = 'CLAIM_ROLE',
  CLAIM_CHECK = 'CLAIM_CHECK',
  CLAIM_SAVE = 'CLAIM_SAVE',
  CLAIM_TRIED_SAVE = 'CLAIM_TRIED_SAVE',
  WHY = 'WHY',
  PROVE_IT = 'PROVE_IT',
  ASK_CHECK = 'ASK_CHECK',
  ASK_SAVE = 'ASK_SAVE',
  AGREE = 'AGREE',
  SUSPICIOUS = 'SUSPICIOUS',
  WAIT = 'WAIT',
  INTERESTING = 'INTERESTING'
}

export enum PublicClaimRole {
  DETECTIVE = 'DETECTIVE',
  DOCTOR = 'DOCTOR',
  VILLAGER = 'VILLAGER'
}

export enum PublicClaimResult {
  MAFIA = 'MAFIA',
  NOT_MAFIA = 'NOT_MAFIA'
}

export interface DiscussionIntent {
  template: string
  targetPlayerId?: string
  claimedRole?: string
  claimedResult?: string
}

export interface PublicDiscussionEvent {
  order: number
  senderRef: string
  senderName: string
  template: DiscussionTemplate
  targetPlayerRef: string
  targetPlayerName: string
  publicRoleClaim: PublicClaimRole | ''
  claimedResult: PublicClaimResult | ''
  message: string
}

export interface PublicRoleClaimEntry {
  playerRef: string
  publicRoleClaim: PublicClaimRole
}

export interface DiscussionSubmission {
  accepted: boolean
  reason: string
  event?: PublicDiscussionEvent
}

const TARGET_REQUIRED = new Set<DiscussionTemplate>([
  DiscussionTemplate.SUSPECT,
  DiscussionTemplate.LYING,
  DiscussionTemplate.VOTE_FOR,
  DiscussionTemplate.DONT_TRUST,
  DiscussionTemplate.CLAIM_CHECK,
  DiscussionTemplate.CLAIM_SAVE,
  DiscussionTemplate.CLAIM_TRIED_SAVE
])

const SELF_TARGET_FORBIDDEN = new Set<DiscussionTemplate>([
  DiscussionTemplate.SUSPECT,
  DiscussionTemplate.LYING,
  DiscussionTemplate.VOTE_FOR,
  DiscussionTemplate.DONT_TRUST,
  DiscussionTemplate.CLAIM_CHECK
])

export class DiscussionStore {
  private matchCounter = 0
  private participants = new Map<string, { name: string; playerRef: string; alive: boolean }>()
  private eventsValue: PublicDiscussionEvent[] = []
  private claims = new Map<string, PublicClaimRole>()
  private lastAcceptedAt = new Map<string, number>()
  private nextOrder = 1

  startMatch(matchCounter: number): void {
    this.clear()
    this.matchCounter = matchCounter
  }

  beginDiscussion(matchCounter: number, players: ReadonlyArray<{ id: string; name: string; alive?: boolean }>): void {
    this.matchCounter = matchCounter
    this.participants = new Map(players.map((player, index) => [
      player.id.toLowerCase(),
      { name: player.name, playerRef: `P${index + 1}`, alive: player.alive !== false }
    ]))
    this.eventsValue = []
    this.lastAcceptedAt.clear()
    for (const playerId of [...this.claims.keys()]) {
      if (!this.participants.get(playerId)?.alive) this.claims.delete(playerId)
    }
  }

  submit(
    senderId: string,
    intent: DiscussionIntent,
    matchCounter: number,
    phase: GamePhase,
    now: number
  ): DiscussionSubmission {
    const actorId = senderId.toLowerCase()
    if (phase !== GamePhase.DISCUSSION) return rejected('Discussion is closed.')
    if (matchCounter !== this.matchCounter) return rejected('This discussion belongs to another match.')
    const sender = this.participants.get(actorId)
    if (!sender?.alive) return rejected('Only living match participants may speak through Quick Discussion.')

    const template = parseDiscussionTemplate(intent.template)
    if (!template) return rejected('That discussion phrase is not allowed.')

    const targetId = (intent.targetPlayerId ?? '').toLowerCase()
    const needsTarget = TARGET_REQUIRED.has(template)
    const target = this.participants.get(targetId)
    if (needsTarget && !target?.alive) return rejected('Choose a living match participant.')
    if (!needsTarget && targetId) return rejected('That phrase does not accept a target.')
    if (SELF_TARGET_FORBIDDEN.has(template) && targetId === actorId) return rejected('Choose another player.')

    const publicRoleClaim = parsePublicClaimRole(intent.claimedRole ?? '')
    const claimedResult = parsePublicClaimResult(intent.claimedResult ?? '')
    if (template === DiscussionTemplate.CLAIM_ROLE && !publicRoleClaim) return rejected('Choose a valid public role claim.')
    if (template !== DiscussionTemplate.CLAIM_ROLE && intent.claimedRole) return rejected('That phrase does not accept a role claim.')
    if (template === DiscussionTemplate.CLAIM_CHECK && !claimedResult) return rejected('Choose MAFIA or NOT MAFIA.')
    if (template !== DiscussionTemplate.CLAIM_CHECK && intent.claimedResult) return rejected('That phrase does not accept a claimed result.')

    const lastAccepted = this.lastAcceptedAt.get(actorId)
    if (lastAccepted !== undefined && now - lastAccepted < DISCUSSION_COOLDOWN_MS) {
      return rejected('Wait a moment before speaking again.')
    }

    const targetName = targetId ? target?.name ?? '' : ''
    const event: PublicDiscussionEvent = {
      order: this.nextOrder++,
      senderRef: sender.playerRef,
      senderName: sender.name,
      template,
      targetPlayerRef: target?.playerRef ?? '',
      targetPlayerName: targetName,
      publicRoleClaim: publicRoleClaim ?? '',
      claimedResult: claimedResult ?? '',
      message: buildDiscussionMessage(sender.name, template, targetName, publicRoleClaim, claimedResult)
    }
    this.eventsValue.push(event)
    if (this.eventsValue.length > MAX_DISCUSSION_EVENTS) this.eventsValue.shift()
    if (publicRoleClaim) this.claims.set(actorId, publicRoleClaim)
    this.lastAcceptedAt.set(actorId, now)
    return { accepted: true, reason: '', event }
  }

  get events(): PublicDiscussionEvent[] {
    return this.eventsValue.map((event) => ({ ...event }))
  }

  get publicRoleClaims(): PublicRoleClaimEntry[] {
    return [...this.claims].flatMap(([playerId, publicRoleClaim]) => {
      const playerRef = this.participants.get(playerId)?.playerRef
      return playerRef ? [{ playerRef, publicRoleClaim }] : []
    })
  }

  clear(): void {
    this.matchCounter = 0
    this.participants.clear()
    this.eventsValue = []
    this.claims.clear()
    this.lastAcceptedAt.clear()
    this.nextOrder = 1
  }
}

export function parseDiscussionTemplate(value: string): DiscussionTemplate | null {
  return Object.values(DiscussionTemplate).includes(value as DiscussionTemplate) ? (value as DiscussionTemplate) : null
}

export function parsePublicClaimRole(value: string): PublicClaimRole | null {
  return Object.values(PublicClaimRole).includes(value as PublicClaimRole) ? (value as PublicClaimRole) : null
}

export function parsePublicClaimResult(value: string): PublicClaimResult | null {
  return Object.values(PublicClaimResult).includes(value as PublicClaimResult) ? (value as PublicClaimResult) : null
}

function rejected(reason: string): DiscussionSubmission {
  return { accepted: false, reason }
}

function buildDiscussionMessage(
  _sender: string,
  template: DiscussionTemplate,
  target: string,
  role: PublicClaimRole | null,
  result: PublicClaimResult | null
): string {
  const messages: Record<DiscussionTemplate, string> = {
    [DiscussionTemplate.SUSPECT]: `I suspect ${target}.`,
    [DiscussionTemplate.LYING]: `${target} is lying.`,
    [DiscussionTemplate.VOTE_FOR]: `Vote ${target}.`,
    [DiscussionTemplate.DONT_TRUST]: `Don't trust ${target}.`,
    [DiscussionTemplate.INNOCENT]: `I'm innocent.`,
    [DiscussionTemplate.DONT_VOTE_ME]: `Don't vote me.`,
    [DiscussionTemplate.TRUST_ME]: `Trust me.`,
    [DiscussionTemplate.DISAGREE]: `I disagree.`,
    [DiscussionTemplate.YOU_ARE_WRONG]: `You're wrong.`,
    [DiscussionTemplate.CAN_EXPLAIN]: `I can explain.`,
    [DiscussionTemplate.CLAIM_ROLE]: `I'm ${role ?? 'VILLAGER'}.`,
    [DiscussionTemplate.CLAIM_CHECK]: `I checked ${target}: ${result ?? 'NOT MAFIA'}.`,
    [DiscussionTemplate.CLAIM_SAVE]: `I saved ${target}.`,
    [DiscussionTemplate.CLAIM_TRIED_SAVE]: `I tried to save ${target}.`,
    [DiscussionTemplate.WHY]: `Why?`,
    [DiscussionTemplate.PROVE_IT]: `Prove it.`,
    [DiscussionTemplate.ASK_CHECK]: `Who did you check?`,
    [DiscussionTemplate.ASK_SAVE]: `Who did you save?`,
    [DiscussionTemplate.AGREE]: `I agree.`,
    [DiscussionTemplate.SUSPICIOUS]: `That's suspicious.`,
    [DiscussionTemplate.WAIT]: `Wait.`,
    [DiscussionTemplate.INTERESTING]: `Interesting.`
  }
  return messages[template]
}
