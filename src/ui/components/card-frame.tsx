import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { COLORS } from '../theme'

type CardDimension = number | `${number}%`

export function CardFrame(props: { width: CardDimension; height: CardDimension; children?: ReactEcs.JSX.ReactNode }) {
  return <UiEntity uiTransform={{ width: props.width, height: props.height, padding: 8, borderWidth: 1, borderColor: COLORS.gold, flexShrink: 0 }} uiBackground={{ color: COLORS.ink }}>
    <UiEntity uiTransform={{ width: '100%', height: '100%', padding: 20, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'column', alignItems: 'center' }} uiBackground={{ color: COLORS.panel }}>
      {props.children}
    </UiEntity>
  </UiEntity>
}

export function CardEyebrow(props: { text: string }) {
  return <UiEntity uiTransform={{ width: '100%', height: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <UiEntity uiTransform={{ width: 36, height: 1 }} uiBackground={{ color: COLORS.border }} />
    <Label value={props.text} fontSize={15} color={COLORS.gold} uiTransform={{ width: 290, height: 24 }} />
    <UiEntity uiTransform={{ width: 36, height: 1 }} uiBackground={{ color: COLORS.border }} />
  </UiEntity>
}
