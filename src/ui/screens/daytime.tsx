import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { isMobile } from '@dcl/sdk/platform'
import { GamePhase, PrivateVoteStatus, WinnerTeam } from '../../game/types'
import { ClientViewState, requestPlayAgain, submitVote } from '../../multiplayer/client-network'
import { LargeButton } from '../components/button'
import { PhaseTimer } from '../components/timer'
import { COLORS } from '../theme'
import { PlayerCard } from '../components/player-card'
import { ActionBoard } from '../components/action-board'
import { CardFrame, CardEyebrow } from '../components/card-frame'
import { RevealedCard } from '../components/revealed-card'
import { RoleEmblem } from '../components/role-emblem'

let selectedVoteTargetId = ''
let selectedBallotKey = ''

function LegacyDiscussionScreen(props: { view: ClientViewState; visible: boolean }) {
  return (
    <UiEntity uiTransform={{ display: props.visible ? 'flex' : 'none', positionType: 'absolute', position: { top: 32 }, width: '100%', justifyContent: 'center', zIndex: 12 }}>
      <UiEntity
        uiTransform={{ width: 900, height: 204, padding: '14px 28px', flexDirection: 'column', alignItems: 'center', borderWidth: 1, borderColor: COLORS.gold }}
        uiBackground={{ color: COLORS.panel }}
      >
        <Label value={`DAY ${props.view.roundNumber}  /  THE COUNCIL CONVENES`} fontSize={16} color={COLORS.muted} textAlign="middle-center" uiTransform={{ width: '100%', height: 28 }} />
        <Label value="DISCUSS — WHO IS THE MAFIA?" font="serif" fontSize={38} color={COLORS.gold} textAlign="middle-center" uiTransform={{ width: '100%', height: 62 }} />
        <UiEntity uiTransform={{ width: '100%', height: 72, justifyContent: 'space-between', alignItems: 'center' }}>
          <Label value="Listen closely. Question everyone.\nUse Decentraland voice to speak to the council." fontSize={21} color={COLORS.text} textAlign="middle-left" uiTransform={{ width: 600, height: 72 }} />
          <PhaseTimer seconds={props.view.secondsLeft} />
        </UiEntity>
      </UiEntity>
    </UiEntity>
  )
}

export function VotingScreen(props: { view: ClientViewState; visible: boolean }) {
  const ballotKey = `${props.view.matchCounter}:${props.view.roundNumber}:${props.view.phase}`
  if (selectedBallotKey !== ballotKey) {
    selectedBallotKey = ballotKey
    selectedVoteTargetId = ''
  }
  const runoff = props.view.phase === GamePhase.RUNOFF_VOTING
  const candidates = props.view.players.filter(
    (player) => player.status === 'PLAYER' && player.alive && player.id !== props.view.localPlayerId && (!runoff || props.view.runoffCandidateIds.includes(player.id))
  )
  const selected = candidates.find((player) => player.id === selectedVoteTargetId)
  const submittedTarget = props.view.players.find((player) => player.id === props.view.voteTargetId)
  const canChoose = props.view.voteStatus === PrivateVoteStatus.VOTE_REQUIRED
  const submitted = props.view.voteStatus === PrivateVoteStatus.SUBMITTED

  return <ActionBoard visible={props.visible} eyebrow={`DAY ${props.view.roundNumber} / THE COUNCIL BALLOT`}
    title={runoff ? 'The deciding ballot' : 'Who do you suspect?'}
    description={runoff ? 'Only tied candidates remain. Another tie spares everyone.' : 'Choose one other living player. Your ballot stays private and locks on confirmation.'}
    seconds={props.view.secondsLeft} status={submitted ? `BALLOT SEALED: ${submittedTarget?.name ?? 'TARGET RECOVERED'}` : props.view.voteStatus === 'SUBMITTING' ? 'SEALING YOUR BALLOT...' : props.view.voteError || 'ONE PLAYER. ONE SEALED BALLOT. NO LIVE TOTALS.'}
    error={Boolean(props.view.voteError)}
    footer={<LargeButton label={submitted ? 'BALLOT SEALED' : selected ? `CAST VOTE: ${selected.name.slice(0,24).toUpperCase()}` : 'CHOOSE A PLAYER ABOVE'} disabled={!canChoose || !selected} onPress={() => { if (selectedVoteTargetId) submitVote(selectedVoteTargetId) }} />}>
    {candidates.map(player => <PlayerCard id={player.id} name={player.name} selected={player.id === (submitted ? props.view.voteTargetId : selectedVoteTargetId)} disabled={!canChoose} onSelect={() => { if (canChoose) selectedVoteTargetId = player.id }} />)}
  </ActionBoard>
}

export function EliminationScreen(props: { view: ClientViewState; visible: boolean }) {
  const mobile = isMobile()
  const player = props.view.players.find((item) => item.id === props.view.eliminatedPlayerId)
  const eliminated = Boolean(player && props.view.eliminatedRole)
  return <FullOverlay visible={props.visible}>
    <CardFrame width={mobile ? '88%' : 900} height={mobile ? '78%' : 500}>
      <CardEyebrow text="THE COUNCIL HAS SPOKEN" />
      <UiEntity uiTransform={{ width: '100%', height: 306, alignItems: 'center', justifyContent: 'space-between' }}>
        {props.view.eliminatedRole ? <RoleEmblem role={props.view.eliminatedRole} size={mobile ? 220 : 270} /> : <Label value="NO\nVERDICT" textWrap="wrap" font="serif" fontSize={mobile ? 39 : 48} color={COLORS.gold} uiTransform={{ width: mobile ? 220 : 270, height: mobile ? 220 : 270 }} />}
        <UiEntity uiTransform={{ width: '60%', height: 280, flexDirection: 'column', justifyContent: 'center' }}>
          <Label value={eliminated ? 'ELIMINATED' : 'NO ELIMINATION'} fontSize={19} color={COLORS.danger} textAlign="middle-left" uiTransform={{ width: '100%', height: 38 }} />
          <Label value={(player?.name ?? 'The council deadlocked.').slice(0, 32)} textWrap="wrap" font="serif" fontSize={mobile ? 36 : 44} color={COLORS.text} textAlign="middle-left" uiTransform={{ width: '100%', height: 100 }} />
          <Label value={props.view.eliminatedRole ?? 'Nobody leaves today.'} textWrap="wrap" font="serif" fontSize={mobile ? 30 : 36} color={COLORS.gold} textAlign="middle-left" uiTransform={{ width: '100%', height: 76 }} />
        </UiEntity>
      </UiEntity>
      <Label value={props.view.announcement} textWrap="wrap" fontSize={mobile ? 19 : 23} color={COLORS.muted} uiTransform={{ width: '100%', height: 88 }} />
    </CardFrame>
  </FullOverlay>
}

export function SpectatingScreen(props: { view: ClientViewState; visible: boolean }) {
  const mobile = isMobile()
  return (
    <UiEntity uiTransform={{ display: props.visible ? 'flex' : 'none', positionType: 'absolute', position: { top: mobile ? 20 : 42, left: mobile ? 18 : 54 }, width: mobile ? '68%' : 720, height: mobile ? 184 : 220, padding: mobile ? 18 : 28, flexDirection: 'column', borderWidth: 3, borderColor: COLORS.border }} uiBackground={{ color: COLORS.panel }}>
      <Label value="SPECTATING — Don't reveal secret information." textWrap="wrap" fontSize={mobile ? 23 : 30} color={COLORS.gold} textAlign="middle-left" uiTransform={{ width: '100%', height: mobile ? 68 : 72 }} />
      <Label value={props.view.announcement} textWrap="wrap" fontSize={mobile ? 18 : 21} color={COLORS.text} textAlign="middle-left" uiTransform={{ width: '100%', height: mobile ? 78 : 72 }} />
    </UiEntity>
  )
}

export function GameOverScreen(props: { view: ClientViewState; visible: boolean }) {
  const mobile = isMobile()
  const participant = props.view.players.find((player) => player.id === props.view.localPlayerId)?.matchParticipant
  const title = props.view.winner === WinnerTeam.MAFIA ? 'MAFIA WINS' : 'VILLAGE WINS'
  return <FullOverlay visible={props.visible}>
    <CardFrame width={mobile ? '94%' : 1020} height={mobile ? '94%' : 640}>
      <CardEyebrow text="THE LAST SECRET IS OUT" />
      <Label value={title} font="serif" fontSize={mobile ? 46 : 56} color={COLORS.gold} uiTransform={{ width: '100%', height: mobile ? 66 : 78 }} />
      <UiEntity uiTransform={{ width: '100%', height: mobile ? 238 : 280, justifyContent: 'center', overflow: 'hidden' }}>
        {props.view.revealedRoles.map(reveal => <RevealedCard role={reveal.role} name={reveal.playerName} compact={mobile} />)}
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', height: mobile ? 126 : 98, flexDirection: 'column', overflow: 'hidden' }}>
        {props.view.recap.slice(-3).map(line => <Label value={line} textWrap="wrap" fontSize={mobile ? 15 : 17} color={COLORS.muted} textAlign="middle-left" uiTransform={{ width: '100%', height: mobile ? 42 : 32 }} />)}
      </UiEntity>
      <UiEntity uiTransform={{ width: mobile ? '72%' : 620, height: 76 }}><LargeButton label={participant ? 'PLAY AGAIN - A NEW SECRET' : 'WAITING FOR THE NEXT COUNCIL'} disabled={!participant} onPress={requestPlayAgain} /></UiEntity>
    </CardFrame>
  </FullOverlay>
}

function FullOverlay(props: { visible: boolean; children?: ReactEcs.JSX.ReactNode }) {
  return (
    <UiEntity uiTransform={{ display: props.visible ? 'flex' : 'none', positionType: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 12 }}>
      {props.children}
    </UiEntity>
  )
}

function VoteCard(props: { name: string; selected: boolean; disabled: boolean; onSelect: () => void }) {
  return (
    <UiEntity uiTransform={{ width: '100%', height: 66, margin: '3px 0', padding: '0 18px', justifyContent: 'space-between', borderWidth: 3, borderColor: props.selected ? COLORS.gold : COLORS.border }} uiBackground={{ color: props.selected ? COLORS.panelSoft : COLORS.panel }} onMouseDown={props.disabled ? undefined : props.onSelect}>
      <Label value={props.name} fontSize={25} color={COLORS.text} textAlign="middle-left" uiTransform={{ width: 570, height: 66 }} />
      <Label value={props.selected ? 'SELECTED' : 'SELECT'} fontSize={19} color={props.selected ? COLORS.gold : COLORS.muted} textAlign="middle-right" uiTransform={{ width: 150, height: 66 }} />
    </UiEntity>
  )
}
