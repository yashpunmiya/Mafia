import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { isMobile } from '@dcl/sdk/platform'
import { CardFrame, CardEyebrow } from './card-frame'
import { PhaseTimer } from './timer'
import { COLORS } from '../theme'

export function ActionBoard(props: { visible: boolean; title: string; eyebrow: string; description: string; seconds: number; status: string; error?: boolean; children?: ReactEcs.JSX.ReactNode; footer?: ReactEcs.JSX.ReactNode }) {
  const mobile = isMobile()
  return <UiEntity uiTransform={{ display: props.visible ? 'flex' : 'none', positionType: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 12 }}>
    <CardFrame width={mobile ? '94%' : 1020} height={mobile ? '94%' : 660}>
      <CardEyebrow text={props.eyebrow} />
      <UiEntity uiTransform={{ width: '100%', height: mobile ? 68 : 56, justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Label value={props.title} textWrap="wrap" font="serif" fontSize={mobile ? 30 : 36} color={COLORS.text} textAlign="middle-left" uiTransform={{ width: mobile ? '75%' : 740, height: mobile ? 68 : 56 }} />
        <PhaseTimer seconds={props.seconds} />
      </UiEntity>
      <Label value={props.description} textWrap="wrap" fontSize={mobile ? 18 : 20} color={COLORS.muted} textAlign="middle-left" uiTransform={{ width: '100%', height: mobile ? 58 : 44, flexShrink: 0 }} />
      <UiEntity uiTransform={{ width: '100%', height: mobile ? 250 : 262, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexShrink: 0, overflow: 'hidden' }}>{props.children}</UiEntity>
      <Label value={props.status} textWrap="wrap" fontSize={mobile ? 15 : 17} color={props.error ? COLORS.danger : COLORS.gold} uiTransform={{ width: '100%', height: mobile ? 44 : 32, flexShrink: 0 }} />
      <UiEntity uiTransform={{ width: mobile ? '72%' : 620, height: 76, flexShrink: 0 }}>{props.footer}</UiEntity>
    </CardFrame>
  </UiEntity>
}
