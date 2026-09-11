import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { COLORS } from '../theme'

export function PhaseTimer(props: { seconds: number; large?: boolean }) {
  const minutes = Math.floor(props.seconds / 60)
  const seconds = props.seconds % 60
  const value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  return (
    <UiEntity
      uiTransform={{ width: props.large ? 250 : 164, height: props.large ? 106 : 56 }}
      uiBackground={{ color: COLORS.panelSoft }}
    >
      <Label
        value={value}
        fontSize={props.large ? 58 : 32}
        color={props.seconds <= 5 ? COLORS.danger : COLORS.gold}
        textAlign="middle-center"
        uiTransform={{ width: '100%', height: '100%' }}
      />
    </UiEntity>
  )
}
