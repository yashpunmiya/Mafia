import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { isMobile } from '@dcl/sdk/platform'
import { ClientViewState } from '../../multiplayer/client-network'
import { COLORS } from '../theme'
import { PhaseTimer } from './timer'

export function PhaseBanner(props: { view: ClientViewState; visible: boolean }) {
  const mobile = isMobile()
  return (
    <UiEntity
      uiTransform={{
        display: props.visible ? 'flex' : 'none',
        positionType: 'absolute',
        position: { top: mobile ? 18 : 38, right: mobile ? 18 : 54 },
        width: mobile ? '46%' : 440,
        height: mobile ? 154 : 170,
        padding: mobile ? 14 : 20,
        flexDirection: 'column',
        borderWidth: 2,
        borderColor: COLORS.border
      }}
      uiBackground={{ color: COLORS.panel }}
    >
      <UiEntity uiTransform={{ width: '100%', height: 62, justifyContent: 'space-between' }}>
        <Label
          value={props.view.phase.replace('_', ' ')}
          fontSize={mobile ? 24 : 30}
          color={COLORS.gold}
          textAlign="middle-left"
          uiTransform={{ width: '58%', height: 62 }}
        />
        <PhaseTimer seconds={props.view.secondsLeft} />
      </UiEntity>
      <Label
        value={props.view.announcement}
        textWrap="wrap"
        fontSize={mobile ? 17 : 20}
        color={COLORS.text}
        textAlign="middle-left"
        uiTransform={{ width: '100%', height: 68 }}
      />
    </UiEntity>
  )
}
