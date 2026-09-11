import { Color4 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'
import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import {
  DiscussionIntent,
  DiscussionTemplate,
  PublicClaimResult,
  PublicClaimRole,
  PublicDiscussionEvent
} from '../../game/discussion'
import { ClientViewState, submitDiscussionIntent } from '../../multiplayer/client-network'
import { COLORS } from '../theme'

type DiscussionMode = 'ROOT' | 'SUSPECT' | 'DEFEND' | 'CLAIM' | 'REACT'

let mode: DiscussionMode = 'ROOT'
let targetTemplate: DiscussionTemplate | null = null
let targetClaimResult: PublicClaimResult | '' = ''
let claimsOpen = false
let currentDiscussionKey = ''

const ACCENT = {
  suspect: Color4.create(0.82, 0.18, 0.22, 1),
  defend: Color4.create(0.12, 0.58, 0.33, 1),
  claim: Color4.create(0.48, 0.18, 0.78, 1),
  react: Color4.create(0.08, 0.42, 0.8, 1),
  feed: Color4.create(0.055, 0.075, 0.105, 0.98)
} as const

export function DiscussionScreen(props: { view: ClientViewState; visible: boolean }) {
  const key = `${props.view.matchCounter}:${props.view.roundNumber}`
  if (key !== currentDiscussionKey) resetUi(key)

  const mobile = isMobile()
  const local = props.view.players.find((player) => player.id === props.view.localPlayerId)
  const canSpeak = local?.status === 'PLAYER' && local.alive
  const feedEvents = props.view.discussionEvents.slice(mobile ? -5 : -7)
  const living = props.view.players.filter((player) => player.status === 'PLAYER' && player.alive)

  return (
    <UiEntity
      uiTransform={{
        display: props.visible ? 'flex' : 'none', positionType: 'absolute', width: '100%', height: '100%',
        alignItems: 'center', justifyContent: 'center', zIndex: 12
      }}
    >
      <UiEntity
        uiTransform={{
          width: mobile ? '78%' : '88%', height: mobile ? '96%' : 830, padding: mobile ? 12 : 18,
          flexDirection: 'column', borderWidth: 2, borderColor: COLORS.gold
        }}
        uiBackground={{ color: COLORS.panel }}
      >
        <DiscussionHeader view={props.view} mobile={mobile} onClaims={() => (claimsOpen = !claimsOpen)} />
        <Label value="WHO IS THE MAFIA?" font="serif" fontSize={mobile ? 32 : 42} color={COLORS.text} textAlign="middle-center" uiTransform={{ width: '100%', height: mobile ? 42 : 58 }} />
        <Label value="DISCUSS  -  DECEIVE  -  FIND THE TRUTH" fontSize={mobile ? 12 : 14} color={COLORS.gold} textAlign="middle-center" uiTransform={{ width: '100%', height: 24 }} />

        <UiEntity uiTransform={{ width: '100%', height: mobile ? 250 : 408, flexDirection: 'row' }}>
          {mobile && claimsOpen ? <ClaimsBoard view={props.view} width="100%" /> : <DiscussionFeed events={feedEvents} width={mobile ? '100%' : 830} />}
          {!mobile && <ClaimsBoard view={props.view} width={374} />}
        </UiEntity>

        {canSpeak ? (
          <DiscussionComposer view={props.view} mobile={mobile} living={living} localId={props.view.localPlayerId} />
        ) : (
          <UiEntity uiTransform={{ width: '100%', height: mobile ? 148 : 170, padding: 18, flexDirection: 'column', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border }} uiBackground={{ color: COLORS.panelSoft }}>
            <Label value="SPECTATING" fontSize={24} color={COLORS.gold} textAlign="middle-center" uiTransform={{ width: '100%', height: 38 }} />
            <Label value="Don't reveal secret information. You may read, but cannot influence the council." textWrap="wrap" fontSize={18} color={COLORS.muted} textAlign="middle-center" uiTransform={{ width: '100%', height: 58 }} />
          </UiEntity>
        )}
        <CategoryBar mobile={mobile} disabled={!canSpeak || props.view.discussionStatus === 'SENDING'} />
      </UiEntity>
    </UiEntity>
  )
}

function DiscussionHeader(props: { view: ClientViewState; mobile: boolean; onClaims: () => void }) {
  const timer = `00:${Math.max(0, props.view.secondsLeft).toString().padStart(2, '0')}`
  return (
    <UiEntity uiTransform={{ width: '100%', height: 50, justifyContent: 'space-between', alignItems: 'center' }}>
      <Label value={`DAY ${props.view.roundNumber}`} fontSize={20} color={COLORS.gold} textAlign="middle-left" uiTransform={{ width: 170, height: 46 }} />
      <Label value="DISCUSS" fontSize={22} color={COLORS.text} textAlign="middle-center" uiTransform={{ width: 240, height: 46 }} />
      <UiEntity uiTransform={{ width: props.mobile ? 330 : 170, height: 46, justifyContent: 'flex-end' }}>
        {props.mobile && <MiniButton label="CLAIMS" width={145} selected={claimsOpen} onPress={props.onClaims} />}
        <Label value={timer} fontSize={23} color={props.view.secondsLeft <= 8 ? COLORS.danger : COLORS.gold} textAlign="middle-right" uiTransform={{ width: 145, height: 46 }} />
      </UiEntity>
    </UiEntity>
  )
}

function DiscussionFeed(props: { events: PublicDiscussionEvent[]; width: number | '100%' }) {
  return (
    <UiEntity uiTransform={{ width: props.width, height: '100%', padding: 8, margin: '0 8px 0 0', flexDirection: 'column', borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' }} uiBackground={{ color: ACCENT.feed }}>
      <Label value="RECENT DISCUSSION" fontSize={14} color={COLORS.muted} textAlign="middle-left" uiTransform={{ width: '100%', height: 26 }} />
      {props.events.length === 0
        ? <Label value="The council is silent. Make the first move." fontSize={19} color={COLORS.muted} textAlign="middle-center" uiTransform={{ width: '100%', height: 180 }} />
        : props.events.map((event) => <FeedRow event={event} />)}
    </UiEntity>
  )
}

function FeedRow(props: { event: PublicDiscussionEvent }) {
  return (
    <UiEntity uiTransform={{ width: '100%', height: 46, margin: '1px 0', alignItems: 'center' }}>
      <UiEntity uiTransform={{ width: 36, height: 36, margin: '0 9px 0 0', borderWidth: 2, borderColor: COLORS.gold }} uiBackground={{ color: COLORS.panelSoft }} uiText={{ value: props.event.senderName.slice(0, 1).toUpperCase() || '?', fontSize: 17, color: COLORS.text, textAlign: 'middle-center' }} />
      <UiEntity uiTransform={{ width: '90%', height: 44, padding: '2px 9px', flexDirection: 'column' }} uiBackground={{ color: COLORS.panelSoft }}>
        <Label value={props.event.senderName.slice(0, 24)} fontSize={13} color={COLORS.gold} textAlign="middle-left" uiTransform={{ width: '100%', height: 17 }} />
        <Label value={props.event.message} textWrap="wrap" fontSize={15} color={COLORS.text} textAlign="middle-left" uiTransform={{ width: '100%', height: 23 }} />
      </UiEntity>
    </UiEntity>
  )
}

function ClaimsBoard(props: { view: ClientViewState; width: number | '100%' }) {
  const living = props.view.players.filter((player) => player.status === 'PLAYER' && player.alive)
  const matchPlayers = props.view.players.filter((player) => player.matchParticipant)
  const playerRef = (id: string) => `P${matchPlayers.findIndex((player) => player.id === id) + 1}`
  const claimFor = (id: string) => props.view.publicRoleClaims.find((entry) => entry.playerRef === playerRef(id))?.publicRoleClaim
  const detectiveClaims = living.filter((player) => claimFor(player.id) === PublicClaimRole.DETECTIVE).length
  return (
    <UiEntity uiTransform={{ width: props.width, height: '100%', padding: 12, flexDirection: 'column', borderWidth: 1, borderColor: COLORS.border }} uiBackground={{ color: COLORS.panelSoft }}>
      <Label value="CLAIMS - NOT VERIFIED" fontSize={17} color={COLORS.gold} textAlign="middle-left" uiTransform={{ width: '100%', height: 30 }} />
      <Label value="Player claims may be false." fontSize={14} color={COLORS.muted} textAlign="middle-left" uiTransform={{ width: '100%', height: 24 }} />
      {living.map((player) => (
        <UiEntity uiTransform={{ width: '100%', height: 31, margin: '1px 0', padding: '0 8px', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }} uiBackground={{ color: COLORS.panel }}>
          <Label value={player.name.slice(0, 17)} fontSize={14} color={COLORS.text} textAlign="middle-left" uiTransform={{ width: '58%', height: 29 }} />
          <Label value={claimFor(player.id) ?? 'NO CLAIM'} fontSize={13} color={claimFor(player.id) ? COLORS.gold : COLORS.muted} textAlign="middle-right" uiTransform={{ width: '40%', height: 29 }} />
        </UiEntity>
      ))}
      <Label value={detectiveClaims > 1 ? `${detectiveClaims} DETECTIVE CLAIMS - SOMEONE MAY BE LYING` : ''} textWrap="wrap" fontSize={12} color={COLORS.danger} textAlign="middle-center" uiTransform={{ width: '100%', height: 28 }} />
    </UiEntity>
  )
}

function DiscussionComposer(props: { view: ClientViewState; mobile: boolean; living: ClientViewState['players']; localId: string }) {
  // Three 44px rows fit on mobile for the largest (nine-phrase) category.
  const height = props.mobile ? 202 : 170
  const feedbackHeight = props.mobile ? 38 : 30
  const feedback = props.view.discussionStatus === 'SENDING' ? 'SENDING TO COUNCIL...' : props.view.discussionStatus === 'SENT' ? 'SENT TO COUNCIL' : props.view.discussionError
  return (
    <UiEntity uiTransform={{ width: '100%', height, padding: '6px 8px', flexDirection: 'column', borderWidth: 1, borderColor: COLORS.border }} uiBackground={{ color: COLORS.panelSoft }}>
      <UiEntity uiTransform={{ width: '100%', height: height - feedbackHeight - 12, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center' }}>
        {composerContent(props.living, props.localId, props.mobile)}
      </UiEntity>
      <Label value={feedback || (mode === 'ROOT' ? 'Quick Discussion needs no keyboard. Native voice and chat stay available.' : 'Choose a phrase. Claims are intentionally unverified.')} textWrap="wrap" fontSize={props.mobile ? 12 : 14} color={props.view.discussionError ? COLORS.danger : props.view.discussionStatus === 'SENT' ? COLORS.ready : COLORS.muted} textAlign="middle-center" uiTransform={{ width: '100%', height: feedbackHeight }} />
    </UiEntity>
  )
}

function composerContent(living: ClientViewState['players'], localId: string, mobile: boolean) {
  const width: MiniButtonWidth = mobile ? '30%' : 215
  if (targetTemplate) {
    const forbidSelf = targetTemplate !== DiscussionTemplate.CLAIM_SAVE && targetTemplate !== DiscussionTemplate.CLAIM_TRIED_SAVE
    const targets = living.filter((player) => !forbidSelf || player.id !== localId)
    return [
      <MiniButton label="BACK" width={mobile ? '30%' : 130} secondary onPress={() => { targetTemplate = null; targetClaimResult = '' }} />,
      ...targets.map((player) => <MiniButton label={player.id === localId ? 'ME' : player.name.slice(0, 16).toUpperCase()} width={mobile ? '30%' : 205} onPress={() => send({ template: targetTemplate!, targetPlayerId: player.id, claimedResult: targetClaimResult })} />)
    ]
  }
  if (mode === 'SUSPECT') return [
    targetButton('I SUSPECT...', DiscussionTemplate.SUSPECT, width), targetButton('IS LYING...', DiscussionTemplate.LYING, width),
    targetButton('VOTE FOR...', DiscussionTemplate.VOTE_FOR, width), targetButton("DON'T TRUST...", DiscussionTemplate.DONT_TRUST, width)
  ]
  if (mode === 'DEFEND') return [
    phraseButton("I'M INNOCENT", DiscussionTemplate.INNOCENT, width), phraseButton("DON'T VOTE ME", DiscussionTemplate.DONT_VOTE_ME, width),
    phraseButton('TRUST ME', DiscussionTemplate.TRUST_ME, width), phraseButton('I DISAGREE', DiscussionTemplate.DISAGREE, width),
    phraseButton("YOU'RE WRONG", DiscussionTemplate.YOU_ARE_WRONG, width), phraseButton('I CAN EXPLAIN', DiscussionTemplate.CAN_EXPLAIN, width)
  ]
  if (mode === 'CLAIM') return [
    claimButton("I'M DETECTIVE", PublicClaimRole.DETECTIVE, width), claimButton("I'M DOCTOR", PublicClaimRole.DOCTOR, width), claimButton("I'M VILLAGER", PublicClaimRole.VILLAGER, width),
    claimTarget('CHECKED: MAFIA', PublicClaimResult.MAFIA, width), claimTarget('CHECKED: NOT MAFIA', PublicClaimResult.NOT_MAFIA, width),
    targetButton('I SAVED...', DiscussionTemplate.CLAIM_SAVE, width), targetButton('TRIED TO SAVE...', DiscussionTemplate.CLAIM_TRIED_SAVE, width)
  ]
  if (mode === 'REACT') return [
    phraseButton('WHY?', DiscussionTemplate.WHY, width), phraseButton('PROVE IT', DiscussionTemplate.PROVE_IT, width),
    phraseButton('WHO DID YOU CHECK?', DiscussionTemplate.ASK_CHECK, width), phraseButton('WHO DID YOU SAVE?', DiscussionTemplate.ASK_SAVE, width),
    phraseButton('I AGREE', DiscussionTemplate.AGREE, width), phraseButton('I DISAGREE', DiscussionTemplate.DISAGREE, width),
    phraseButton("THAT'S SUSPICIOUS", DiscussionTemplate.SUSPICIOUS, width), phraseButton('WAIT', DiscussionTemplate.WAIT, width),
    phraseButton('INTERESTING', DiscussionTemplate.INTERESTING, width)
  ]
  return [phraseButton('WHY?', DiscussionTemplate.WHY, width), phraseButton('PROVE IT', DiscussionTemplate.PROVE_IT, width), phraseButton('I AGREE', DiscussionTemplate.AGREE, width), phraseButton('I DISAGREE', DiscussionTemplate.DISAGREE, width)]
}

function CategoryBar(props: { mobile: boolean; disabled: boolean }) {
  return (
    <UiEntity uiTransform={{ width: '100%', height: 74, padding: '6px 0 0 0', justifyContent: 'center', alignSelf: 'center' }}>
      <CategoryButton label="SUSPECT" color={ACCENT.suspect} selected={mode === 'SUSPECT'} disabled={props.disabled} onPress={() => chooseMode('SUSPECT')} />
      <CategoryButton label="DEFEND" color={ACCENT.defend} selected={mode === 'DEFEND'} disabled={props.disabled} onPress={() => chooseMode('DEFEND')} />
      <CategoryButton label="CLAIM" color={ACCENT.claim} selected={mode === 'CLAIM'} disabled={props.disabled} onPress={() => chooseMode('CLAIM')} />
      <CategoryButton label="REACT" color={ACCENT.react} selected={mode === 'REACT'} disabled={props.disabled} onPress={() => chooseMode('REACT')} />
    </UiEntity>
  )
}

function CategoryButton(props: { label: string; color: Color4; selected: boolean; disabled: boolean; onPress: () => void }) {
  return <UiEntity uiTransform={{ width: '23%', height: 64, margin: '0 4px', borderWidth: props.selected ? 3 : 1, borderColor: props.selected ? COLORS.text : props.color }} uiBackground={{ color: props.disabled ? COLORS.disabled : props.color }} uiText={{ value: props.label, fontSize: 20, color: COLORS.text, textAlign: 'middle-center' }} onMouseDown={props.disabled ? undefined : props.onPress} />
}

type MiniButtonWidth = number | '30%'

function MiniButton(props: { label: string; width: MiniButtonWidth; onPress: () => void; selected?: boolean; secondary?: boolean }) {
  return <UiEntity uiTransform={{ width: props.width, height: 44, margin: 3, borderWidth: props.selected ? 3 : 1, borderColor: props.selected ? COLORS.gold : COLORS.border }} uiBackground={{ color: props.secondary ? COLORS.panel : props.selected ? COLORS.selected : COLORS.panelSoft }} uiText={{ value: props.label, fontSize: 15, color: props.selected ? COLORS.gold : COLORS.text, textAlign: 'middle-center' }} onMouseDown={props.onPress} />
}

function targetButton(label: string, template: DiscussionTemplate, width: MiniButtonWidth) {
  return <MiniButton label={label} width={width} onPress={() => (targetTemplate = template)} />
}

function phraseButton(label: string, template: DiscussionTemplate, width: MiniButtonWidth) {
  return <MiniButton label={label} width={width} onPress={() => send({ template })} />
}

function claimButton(label: string, claimedRole: PublicClaimRole, width: MiniButtonWidth) {
  return <MiniButton label={label} width={width} onPress={() => send({ template: DiscussionTemplate.CLAIM_ROLE, claimedRole })} />
}

function claimTarget(label: string, result: PublicClaimResult, width: MiniButtonWidth) {
  return <MiniButton label={label} width={width} onPress={() => { targetTemplate = DiscussionTemplate.CLAIM_CHECK; targetClaimResult = result }} />
}

function chooseMode(next: DiscussionMode): void {
  mode = mode === next ? 'ROOT' : next
  targetTemplate = null
  targetClaimResult = ''
}

function send(intent: DiscussionIntent): void {
  submitDiscussionIntent(intent)
  mode = 'ROOT'
  targetTemplate = null
  targetClaimResult = ''
}

function resetUi(key: string): void {
  currentDiscussionKey = key
  mode = 'ROOT'
  targetTemplate = null
  targetClaimResult = ''
  claimsOpen = false
}
