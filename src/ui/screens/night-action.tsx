import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { isMobile } from '@dcl/sdk/platform'
import { DetectiveResult, PlayerRole, PrivateNightStatus, PublicPlayer } from '../../game/types'
import { ClientViewState, submitNightAction } from '../../multiplayer/client-network'
import { LargeButton } from '../components/button'
import { PhaseTimer } from '../components/timer'
import { COLORS } from '../theme'
import { PlayerCard } from '../components/player-card'
import { ActionBoard } from '../components/action-board'
import { CardFrame, CardEyebrow } from '../components/card-frame'
import { RoleEmblem } from '../components/role-emblem'

let selectedTargetId = ''
let selectedMatchKey = ''

export function NightActionScreen(props: { view: ClientViewState; visible: boolean }) {
  const matchKey = `${props.view.matchCounter}:${props.view.roundNumber}`
  if (selectedMatchKey !== matchKey) {
    selectedMatchKey = matchKey
    selectedTargetId = ''
  }

  const role = props.view.privateRole
  const localPlayer = props.view.players.find((player) => player.id === props.view.localPlayerId)
  const submittedTarget = props.view.players.find((player) => player.id === props.view.nightActionTargetId)
  const canChoose =
    localPlayer?.alive === true &&
    role !== null &&
    role !== PlayerRole.VILLAGER &&
    props.view.nightActionStatus === PrivateNightStatus.ACTION_REQUIRED
  const targets = role
    ? selectableTargets(props.view.players, props.view.localPlayerId, role, props.view.previousDoctorTargetId)
    : []
  const selectedTarget = targets.find((player) => player.id === selectedTargetId)
  const accent = roleColor(role)
  const copy = actionCopy(role)
  const submitted =
    props.view.nightActionStatus === PrivateNightStatus.SUBMITTED ||
    props.view.nightActionStatus === PrivateNightStatus.RESOLVED

  return <ActionBoard visible={props.visible} eyebrow={`NIGHT ${props.view.roundNumber} / PRIVATE ORDERS`} title={copy.title} description={copy.instruction} seconds={props.view.secondsLeft}
    status={submitted ? `ACTION SEALED: ${submittedTarget?.name ?? 'TARGET RECOVERED'}` : props.view.nightActionStatus === 'SUBMITTING' ? 'SEALING YOUR ORDER...' : props.view.nightActionError || copy.status}
    error={Boolean(props.view.nightActionError)}
    footer={role !== PlayerRole.VILLAGER && localPlayer?.alive !== false ? <LargeButton label={submitted ? 'ORDER SEALED' : selectedTarget ? `CONFIRM ${selectedTarget.name.slice(0,24).toUpperCase()}` : 'CHOOSE A PLAYER ABOVE'} disabled={!canChoose || !selectedTarget} onPress={() => { if (selectedTargetId) submitNightAction(selectedTargetId) }} /> : <Label value="THE VILLAGE SLEEPS. WAIT FOR DAWN." fontSize={21} color={COLORS.gold} uiTransform={{ width: '100%', height: 70 }} />}>
    {role === PlayerRole.VILLAGER || localPlayer?.alive === false ? <WaitingPanel dead={localPlayer?.alive === false} /> : targets.map(player => <PlayerCard id={player.id} name={player.id === props.view.localPlayerId ? `${player.name} (YOU)` : player.name} selected={(submitted ? props.view.nightActionTargetId : selectedTargetId) === player.id} disabled={!canChoose} onSelect={() => { if (canChoose) selectedTargetId = player.id }} />)}
  </ActionBoard>
}

export function DetectiveResultScreen(props: { view: ClientViewState; visible: boolean }) {
  const mobile = isMobile()
  const target = props.view.players.find((player) => player.id === props.view.nightActionTargetId)
  const result = props.view.detectiveResult
  const resolved = props.view.nightActionStatus === PrivateNightStatus.RESOLVED
  const resultText = !resolved
    ? 'RETRIEVING...'
    : result === DetectiveResult.MAFIA
      ? 'MAFIA'
      : result === DetectiveResult.NOT_MAFIA
        ? 'NOT MAFIA'
        : 'NO RESULT'
  const explanation = !resolved
    ? 'Requesting your private investigation result from the server.'
    : result
      ? `${target?.name ?? 'Your target'} is ${resultText}.`
      : 'No investigation was submitted before dawn.'

  return <UiEntity uiTransform={{ display: props.visible ? 'flex' : 'none', positionType: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 12 }}>
    <CardFrame width={mobile ? '88%' : 900} height={mobile ? '78%' : 500}>
      <CardEyebrow text="CONFIDENTIAL / DETECTIVE ONLY" />
      <UiEntity uiTransform={{ width: '100%', height: 300, alignItems: 'center', justifyContent: 'space-between' }}>
        <RoleEmblem role={PlayerRole.DETECTIVE} size={mobile ? 220 : 270} />
        <UiEntity uiTransform={{ width: '60%', height: 280, flexDirection: 'column', justifyContent: 'center' }}>
          <Label value={(target?.name ?? 'Investigation report').slice(0, 30)} textWrap="wrap" font="serif" fontSize={mobile ? 30 : 36} color={COLORS.text} textAlign="middle-left" uiTransform={{ width: '100%', height: 88 }} />
          <Label value={resultText} textWrap="wrap" font="serif" fontSize={mobile ? 44 : 54} color={result === DetectiveResult.MAFIA ? COLORS.danger : COLORS.gold} textAlign="middle-left" uiTransform={{ width: '100%', height: 100 }} />
          <Label value="FOR YOUR EYES ONLY" fontSize={18} color={COLORS.detective} textAlign="middle-left" uiTransform={{ width: '100%', height: 42 }} />
        </UiEntity>
      </UiEntity>
      <Label value={explanation} textWrap="wrap" fontSize={mobile ? 19 : 23} color={COLORS.muted} uiTransform={{ width: '100%', height: 86 }} />
    </CardFrame>
  </UiEntity>
}

function TargetCard(props: {
  player: PublicPlayer
  localPlayerId: string
  selected: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: 58,
        margin: '3px 0',
        padding: '0 18px',
        justifyContent: 'space-between',
        borderWidth: 2,
        borderColor: props.selected ? COLORS.gold : COLORS.border
      }}
      uiBackground={{ color: props.selected ? COLORS.panelSoft : COLORS.panel }}
      onMouseDown={props.disabled ? undefined : props.onSelect}
    >
      <Label
        value={props.player.id === props.localPlayerId ? `${props.player.name} (YOU)` : props.player.name}
        fontSize={22}
        color={props.disabled ? COLORS.muted : COLORS.text}
        textAlign="middle-left"
        uiTransform={{ width: 570, height: 58 }}
      />
      <Label
        value={props.selected ? 'SELECTED' : 'SELECT'}
        fontSize={18}
        color={props.selected ? COLORS.gold : COLORS.muted}
        textAlign="middle-right"
        uiTransform={{ width: 140, height: 58 }}
      />
    </UiEntity>
  )
}

function WaitingPanel(props: { dead: boolean }) {
  return (
    <UiEntity
      uiTransform={{ width: '100%', height: 252, flexDirection: 'column', justifyContent: 'center' }}
      uiBackground={{ color: COLORS.panelSoft }}
    >
      <Label
        value={props.dead ? 'YOU ARE OUT' : 'THE VILLAGE SLEEPS'}
        fontSize={38}
        color={COLORS.gold}
        textAlign="middle-center"
        uiTransform={{ width: '100%', height: 82 }}
      />
      <Label
        value={props.dead ? 'Dead players cannot submit night actions.' : 'You have no night action. Watch the timer and wait for dawn.'}
        fontSize={24}
        color={COLORS.text}
        textWrap="wrap"
        textAlign="middle-center"
        uiTransform={{ width: '100%', height: 100 }}
      />
    </UiEntity>
  )
}

function selectableTargets(
  players: readonly PublicPlayer[],
  localPlayerId: string,
  role: PlayerRole,
  previousDoctorTargetId: string
): PublicPlayer[] {
  return players.filter(
    (player) =>
      player.status === 'PLAYER' &&
      player.alive &&
      (role === PlayerRole.DOCTOR || player.id !== localPlayerId) &&
      (role !== PlayerRole.DOCTOR || player.id !== previousDoctorTargetId)
  )
}

function actionCopy(role: PlayerRole | null): { title: string; instruction: string; status: string } {
  switch (role) {
    case PlayerRole.MAFIA:
      return {
        title: 'MAFIA: CHOOSE A TARGET',
        instruction: 'Select one other living player. Your choice is private and locks when confirmed.',
        status: 'Choose carefully before dawn.'
      }
    case PlayerRole.DOCTOR:
      return {
        title: 'DOCTOR: PROTECT',
        instruction: 'Select one living player. You may protect yourself, but not the same target as last night.',
        status: 'A matching Mafia target will be saved.'
      }
    case PlayerRole.DETECTIVE:
      return {
        title: 'DETECTIVE: INVESTIGATE',
        instruction: 'Select one other living player. Your result will arrive privately at dawn.',
        status: 'Your investigation does not change the kill result.'
      }
    case PlayerRole.VILLAGER:
      return {
        title: 'VILLAGER',
        instruction: 'You have no night action.',
        status: 'Wait for dawn.'
      }
    default:
      return {
        title: 'NIGHT ACTION',
        instruction: 'Retrieving your private role and action state.',
        status: 'Private state is loading.'
      }
  }
}

function roleColor(role: PlayerRole | null) {
  switch (role) {
    case PlayerRole.MAFIA:
      return COLORS.danger
    case PlayerRole.DOCTOR:
      return COLORS.doctor
    case PlayerRole.DETECTIVE:
      return COLORS.detective
    default:
      return COLORS.gold
  }
}
