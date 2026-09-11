import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'
import { COLORS } from '../theme'

export interface LargeButtonProps {
  label: string
  disabled?: boolean
  secondary?: boolean
  onPress: () => void
}

export function LargeButton(props: LargeButtonProps) {
  const background = props.disabled ? COLORS.disabled : props.secondary ? COLORS.panelSoft : COLORS.gold
  const textColor = props.disabled || props.secondary ? COLORS.text : COLORS.ink

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: 66,
        margin: '10px 0 0 0',
        borderWidth: 1,
        borderColor: props.disabled ? COLORS.disabled : COLORS.border
      }}
      uiBackground={{ color: background }}
      uiText={{ value: props.label, fontSize: 23, color: textColor, textAlign: 'middle-center' }}
      onMouseDown={props.disabled ? undefined : props.onPress}
    />
  )
}
