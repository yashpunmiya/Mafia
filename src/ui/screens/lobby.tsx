import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { isMobile } from '@dcl/sdk/platform'
import { GamePhase } from '../../game/types'
import { ClientViewState, requestReadyToggle } from '../../multiplayer/client-network'
import { getSeatingState, takeCouncilSeat, leaveCouncilSeat } from '../../world/seating'
import { LargeButton } from '../components/button'
import { CardFrame, CardEyebrow } from '../components/card-frame'
import { COLORS } from '../theme'

let minimized = false

export function LobbyScreen(props: { view: ClientViewState; onHowToPlay: () => void }) {
  const mobile = isMobile()
  const local = props.view.players.find(p => p.id === props.view.localPlayerId)
  const eligible = props.view.serverAlive && local?.status === 'PLAYER' && local.connected
  const seat = getSeatingState()
  if (minimized) return <UiEntity uiTransform={{ display: props.view.phase === GamePhase.LOBBY ? 'flex' : 'none', positionType: 'absolute', position: { left: mobile ? 18 : 40, top: mobile ? 18 : 26 }, width: mobile ? '48%' : 410, height: mobile ? 164 : 180, padding: 14, flexDirection: 'column', borderWidth: 1, borderColor: COLORS.gold }} uiBackground={{ color: COLORS.panel }}>
    <Label value={`MAFIA  |  ${props.view.readyCount} / ${props.view.activeCount} READY`} textWrap="wrap" fontSize={mobile ? 17 : 20} color={COLORS.gold} uiTransform={{ width: '100%', height: 34 }} />
    <Label value={local?.ready ? 'You are ready. Explore while others join.' : 'Open lobby to ready up or take your seat.'} textWrap="wrap" fontSize={mobile ? 14 : 16} color={COLORS.text} uiTransform={{ width: '100%', height: 42 }} />
    <LargeButton label="OPEN LOBBY" secondary onPress={() => { minimized = false }} />
  </UiEntity>
  return <UiEntity uiTransform={{ display: props.view.phase === GamePhase.LOBBY ? 'flex' : 'none', positionType: 'absolute', position: mobile ? undefined : { left: 40, top: 26 }, width: mobile ? '100%' : undefined, height: mobile ? '100%' : undefined, justifyContent: mobile ? 'center' : undefined, alignItems: mobile ? 'center' : undefined }}>
    <CardFrame width={mobile ? '90%' : 900} height={mobile ? '90%' : 590}>
      <UiEntity uiTransform={{ width: '100%', height: 42, justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <UiEntity uiTransform={{ width: '62%', height: 24 }}><CardEyebrow text="MOONLIT VILLAGE COUNCIL" /></UiEntity>
        <UiEntity uiTransform={{ width: '24%', height: 42, borderWidth: 1, borderColor: COLORS.border }} uiBackground={{ color: COLORS.panelSoft }} onMouseDown={() => { minimized = true }}>
          <Label value="MINIMIZE" fontSize={mobile ? 15 : 18} color={COLORS.gold} uiTransform={{ width: '100%', height: '100%' }} />
        </UiEntity>
      </UiEntity>
      <Label value="MAFIA" font="serif" fontSize={mobile ? 56 : 70} color={COLORS.text} uiTransform={{ width: '100%', height: 76 }} />
      <UiEntity uiTransform={{ width: '100%', height: 346, justifyContent: 'space-between' }}>
        <UiEntity uiTransform={{ width: '54%', height: 346, flexDirection: 'column' }}>
          <Label value={`${props.view.activeCount} / 5 SEATS   |   ${props.view.readyCount} READY`} fontSize={19} color={COLORS.gold} textAlign="middle-left" uiTransform={{ width: '100%', height: 48 }} />
          {props.view.players.filter(p => p.status === 'PLAYER').slice(0,5).map((p,i) => <UiEntity uiTransform={{ width: '100%', height: 52, margin: '2px 0', padding: '4px 10px', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }} uiBackground={{ color: COLORS.panelSoft }}>
            <Label value={`0${i+1}`} textWrap="nowrap" font="serif" fontSize={22} color={COLORS.gold} uiTransform={{ width: 44, height: 40, flexShrink: 0 }} />
            <UiEntity uiTransform={{ width: 38, height: 38 }} uiBackground={{ avatarTexture: { userId: p.id }, textureMode: 'stretch' }} />
            <Label value={p.name.slice(0,21)} textWrap="nowrap" fontSize={mobile ? 16 : 19} color={COLORS.text} textAlign="middle-left" uiTransform={{ width: '52%', height: 42, margin: '0 8px' }} />
            <Label value={p.ready ? 'READY' : 'WAITING'} fontSize={mobile ? 11 : 13} color={p.ready ? COLORS.ready : COLORS.muted} uiTransform={{ width: '20%', height: 42 }} />
          </UiEntity>)}
        </UiEntity>
        <UiEntity uiTransform={{ width: '42%', height: 346, flexDirection: 'column' }}>
          <Label value="Take a seat. Keep a secret." textWrap="wrap" font="serif" fontSize={mobile ? 22 : 27} color={COLORS.gold} uiTransform={{ width: '100%', height: 54 }} />
          <LargeButton label={local?.ready ? 'READY - TAP TO CANCEL' : 'READY TO PLAY'} disabled={!eligible} onPress={requestReadyToggle} />
          <LargeButton label={seat.busy ? 'TAKING YOUR SEAT...' : seat.seated ? 'STAND UP / LEAVE SEAT' : 'SIT AT COUNCIL'} disabled={!eligible || seat.busy} onPress={() => { void (seat.seated ? leaveCouncilSeat() : takeCouncilSeat()) }} />
          <Label value={seat.message || 'SIT moves you to your assigned chair.\nWalk or tap STAND UP to leave.'} textWrap="wrap" fontSize={mobile ? 14 : 16} color={COLORS.muted} uiTransform={{ width: '100%', height: 68 }} />
          <LargeButton label="HOW TO PLAY" secondary onPress={props.onHowToPlay} />
        </UiEntity>
      </UiEntity>
      <Label value={props.view.notice || (!props.view.serverAlive ? 'Connecting to the game server...' : local?.status === 'SPECTATOR' ? 'COUNCIL FULL - You are spectating this match.' : '4-5 players. Everyone must be ready. Only you receive your secret role.')} textWrap="wrap" fontSize={mobile ? 15 : 18} color={COLORS.muted} uiTransform={{ width: '100%', height: 58 }} />
    </CardFrame>
  </UiEntity>
}
