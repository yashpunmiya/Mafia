import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { getSeatingState, takeCouncilSeat, leaveCouncilSeat } from '../../world/seating'
import { COLORS } from '../theme'

export function SeatControl(props: { visible: boolean }) {
  const state = getSeatingState()
  return <UiEntity uiTransform={{ display: props.visible ? 'flex' : 'none', positionType: 'absolute', position: { top: 18, right: 24 }, width: 320, height: 100, flexDirection: 'column', zIndex: 30 }}>
    <UiEntity uiTransform={{ width: '100%', height: 54, borderWidth: 1, borderColor: COLORS.border }} uiBackground={{ color: COLORS.panel }}
      uiText={{ value: state.busy ? 'TAKING SEAT...' : state.seated ? 'LEAVE SEAT' : 'TAKE YOUR COUNCIL SEAT', fontSize: 17, color: COLORS.gold }}
      onMouseDown={state.busy ? undefined : () => { void (state.seated ? leaveCouncilSeat() : takeCouncilSeat()) }} />
    <Label value={state.message} fontSize={14} color={COLORS.text} uiTransform={{ width: '100%', height: 42 }} />
  </UiEntity>
}
